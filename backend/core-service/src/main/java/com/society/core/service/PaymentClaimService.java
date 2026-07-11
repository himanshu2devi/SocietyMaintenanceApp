package com.society.core.service;

import com.society.core.domain.MaintenanceCharge;
import com.society.core.domain.MaintenanceStatus;
import com.society.core.domain.PaymentClaim;
import com.society.core.dto.MaintenanceRateDtos.EffectiveRateResponse;
import com.society.core.dto.PaymentClaimDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.MaintenanceChargeRepository;
import com.society.core.repository.PaymentClaimRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class PaymentClaimService {

    private static final Set<String> PAYMENT_MODES = Set.of("CASH", "ONLINE");

    private final PaymentClaimRepository claimRepository;
    private final MaintenanceChargeRepository chargeRepository;
    private final MaintenanceRateService rateService;

    public PaymentClaimService(PaymentClaimRepository claimRepository,
                               MaintenanceChargeRepository chargeRepository,
                               MaintenanceRateService rateService) {
        this.claimRepository = claimRepository;
        this.chargeRepository = chargeRepository;
        this.rateService = rateService;
    }

    @Transactional
    public PaymentClaimResponse submit(UUID societyId, UUID memberId, String memberName, String flatNumber,
                                       SubmitPaymentClaimRequest req) {
        if (flatNumber == null || flatNumber.isBlank()) {
            throw new BadRequestException("Your profile needs a flat number before submitting payment claims");
        }

        MaintenanceCharge charge = resolveChargeForClaim(societyId, memberId, flatNumber.trim(), req);

        if (charge.getStatus() == MaintenanceStatus.PAID) {
            throw new ConflictException("This maintenance period is already marked paid");
        }
        if (claimRepository.existsBySocietyIdAndChargeIdAndStatus(societyId, charge.getId(), "SUBMITTED")) {
            throw new ConflictException("A payment claim is already pending for this period");
        }

        PaymentClaim claim = new PaymentClaim();
        claim.setSocietyId(societyId);
        claim.setChargeId(charge.getId());
        claim.setMemberId(memberId);
        claim.setMemberName(memberName);
        claim.setFlatNumber(charge.getFlatNumber());
        claim.setAmount(charge.getAmount());
        claim.setPaymentMode(normalizePaymentMode(req.paymentMode()));
        claim.setReferenceNumber(req.referenceNumber());
        claim.setNotes(req.notes());
        claim.setStatus("SUBMITTED");
        return toResponse(claimRepository.save(claim), charge);
    }

    private MaintenanceCharge resolveChargeForClaim(UUID societyId, UUID memberId, String flatNumber,
                                                    SubmitPaymentClaimRequest req) {
        if (req.chargeId() != null && !req.chargeId().isBlank()) {
            UUID chargeId = UUID.fromString(req.chargeId());
            MaintenanceCharge charge = chargeRepository.findByIdAndSocietyId(chargeId, societyId)
                    .orElseThrow(() -> new NotFoundException("Maintenance charge not found"));
            if (!flatNumber.equalsIgnoreCase(charge.getFlatNumber())) {
                throw new BadRequestException("You can only claim payment for your own flat");
            }
            return charge;
        }

        if (req.billingYear() == null || req.billingMonth() == null) {
            throw new BadRequestException("Select a maintenance period (year and month) or a pending charge");
        }
        if (req.billingMonth() < 1 || req.billingMonth() > 12) {
            throw new BadRequestException("Month must be between 1 and 12");
        }

        return chargeRepository
                .findBySocietyIdAndFlatNumberAndBillingYearAndBillingMonth(
                        societyId, flatNumber, req.billingYear(), req.billingMonth())
                .map(existing -> {
                    if (!flatNumber.equalsIgnoreCase(existing.getFlatNumber())) {
                        throw new BadRequestException("You can only claim payment for your own flat");
                    }
                    return existing;
                })
                .orElseGet(() -> createPendingCharge(
                        societyId, memberId, flatNumber, req.billingYear(), req.billingMonth()));
    }

    private MaintenanceCharge createPendingCharge(UUID societyId, UUID memberId, String flatNumber,
                                                  int year, int month) {
        EffectiveRateResponse rate = rateService.effective(societyId, year, month);
        if (!rate.configured() || rate.amount() == null || rate.amount().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException(
                    "Society maintenance amount is not set for this month. Ask committee to set the rate first.");
        }

        MaintenanceCharge charge = new MaintenanceCharge();
        charge.setSocietyId(societyId);
        charge.setFlatNumber(flatNumber);
        charge.setMemberId(memberId);
        charge.setBillingYear(year);
        charge.setBillingMonth(month);
        charge.setAmount(rate.amount());
        charge.setStatus(MaintenanceStatus.PENDING);
        charge.setPaymentMode(null);
        charge.setPaidAt(null);
        return chargeRepository.save(charge);
    }

    @Transactional(readOnly = true)
    public List<PaymentClaimResponse> listForSociety(UUID societyId, String status) {
        List<PaymentClaim> claims = (status == null || status.isBlank())
                ? claimRepository.findBySocietyIdOrderByCreatedAtDesc(societyId)
                : claimRepository.findBySocietyIdAndStatusOrderByCreatedAtDesc(societyId, status.toUpperCase());
        return claims.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<PaymentClaimResponse> listForMember(UUID societyId, UUID memberId) {
        return claimRepository.findBySocietyIdAndMemberIdOrderByCreatedAtDesc(societyId, memberId)
                .stream().map(this::toResponse).toList();
    }

    @Transactional
    public PaymentClaimResponse review(UUID societyId, UUID adminId, UUID claimId, ReviewPaymentClaimRequest req) {
        PaymentClaim claim = claimRepository.findByIdAndSocietyId(claimId, societyId)
                .orElseThrow(() -> new NotFoundException("Payment claim not found"));
        if (!"SUBMITTED".equals(claim.getStatus())) {
            throw new ConflictException("Only submitted claims can be reviewed");
        }

        String decision = req.decision().trim().toUpperCase();
        if (!decision.equals("APPROVED") && !decision.equals("REJECTED")) {
            throw new BadRequestException("decision must be APPROVED or REJECTED");
        }

        claim.setStatus(decision);
        claim.setReviewedBy(adminId);
        claim.setReviewedAt(Instant.now());
        claim.setReviewNotes(req.reviewNotes());

        MaintenanceCharge charge = chargeRepository.findByIdAndSocietyId(claim.getChargeId(), societyId)
                .orElseThrow(() -> new NotFoundException("Maintenance charge not found"));

        if ("APPROVED".equals(decision)) {
            String mode = req.paymentMode() != null && !req.paymentMode().isBlank()
                    ? normalizePaymentMode(req.paymentMode())
                    : normalizePaymentMode(claim.getPaymentMode());
            claim.setPaymentMode(mode);
            charge.setStatus(MaintenanceStatus.PAID);
            charge.setPaidAt(Instant.now());
            charge.setPaymentMode(mode);
            String note = "Verified via payment claim";
            if (claim.getReferenceNumber() != null && !claim.getReferenceNumber().isBlank()) {
                note = note + " (ref: " + claim.getReferenceNumber() + ")";
            }
            charge.setNotes(note);
            chargeRepository.save(charge);
        }

        return toResponse(claimRepository.save(claim), charge);
    }

    private PaymentClaimResponse toResponse(PaymentClaim c) {
        MaintenanceCharge charge = chargeRepository.findById(c.getChargeId()).orElse(null);
        return toResponse(c, charge);
    }

    private PaymentClaimResponse toResponse(PaymentClaim c, MaintenanceCharge charge) {
        return new PaymentClaimResponse(
                c.getId().toString(),
                c.getChargeId().toString(),
                c.getMemberId().toString(),
                c.getMemberName(),
                c.getFlatNumber(),
                c.getAmount(),
                c.getPaymentMode(),
                c.getReferenceNumber(),
                c.getNotes(),
                c.getStatus(),
                c.getReviewNotes(),
                charge == null ? null : charge.getBillingYear(),
                charge == null ? null : charge.getBillingMonth(),
                c.getCreatedAt(),
                c.getReviewedAt()
        );
    }

    private static String normalizePaymentMode(String paymentMode) {
        if (paymentMode == null || paymentMode.isBlank()) {
            throw new BadRequestException("Payment mode is required. Choose Cash or Online.");
        }
        String normalized = paymentMode.trim().toUpperCase(Locale.ROOT);
        if ("BANK_TRANSFER".equals(normalized) || "UPI".equals(normalized) || "NEFT".equals(normalized)) {
            normalized = "ONLINE";
        }
        if (!PAYMENT_MODES.contains(normalized)) {
            throw new BadRequestException("Payment mode must be CASH or ONLINE.");
        }
        return normalized;
    }
}
