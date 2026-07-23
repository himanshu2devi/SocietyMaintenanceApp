package com.society.core.service;

import com.society.core.domain.MaintenanceCharge;
import com.society.core.domain.MaintenanceStatus;
import com.society.core.dto.MaintenanceDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.ForbiddenException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.MaintenanceChargeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class MaintenanceService {

    private static final Set<String> PAYMENT_MODES = Set.of("CASH", "ONLINE");

    private final MaintenanceChargeRepository repository;
    private final MaintenanceReceiptPdfService receiptPdfService;
    private final SocietyDirectoryLookup directoryLookup;

    public MaintenanceService(
            MaintenanceChargeRepository repository,
            MaintenanceReceiptPdfService receiptPdfService,
            SocietyDirectoryLookup directoryLookup) {
        this.repository = repository;
        this.receiptPdfService = receiptPdfService;
        this.directoryLookup = directoryLookup;
    }

    /** Record a collection: upsert the flat/period charge and mark it PAID. */
    @Transactional
    public MaintenanceChargeResponse recordCollection(UUID societyId, RecordCollectionRequest req) {
        MaintenanceCharge charge = repository
                .findBySocietyIdAndFlatNumberAndBillingYearAndBillingMonth(
                        societyId, req.flatNumber(), req.billingYear(), req.billingMonth())
                .orElseGet(MaintenanceCharge::new);

        charge.setSocietyId(societyId);
        charge.setFlatNumber(req.flatNumber().trim());
        charge.setMemberId(parseMemberId(req.memberId()));
        charge.setBillingYear(req.billingYear());
        charge.setBillingMonth(req.billingMonth());
        charge.setAmount(req.amount());
        charge.setStatus(MaintenanceStatus.PAID);
        charge.setPaymentMode(normalizePaymentMode(req.paymentMode()));
        charge.setPaidAt(Instant.now());
        charge.setNotes(req.notes());
        if (req.transactionReference() != null && !req.transactionReference().isBlank()) {
            charge.setTransactionReference(req.transactionReference().trim());
        }
        return toResponse(repository.save(charge));
    }

    /** Create/ensure a charge exists for the flat/period and mark it PENDING. */
    @Transactional
    public MaintenanceChargeResponse markPending(UUID societyId, MarkPendingRequest req) {
        MaintenanceCharge charge = repository
                .findBySocietyIdAndFlatNumberAndBillingYearAndBillingMonth(
                        societyId, req.flatNumber(), req.billingYear(), req.billingMonth())
                .orElseGet(MaintenanceCharge::new);

        charge.setSocietyId(societyId);
        charge.setFlatNumber(req.flatNumber().trim());
        charge.setMemberId(parseMemberId(req.memberId()));
        charge.setBillingYear(req.billingYear());
        charge.setBillingMonth(req.billingMonth());
        charge.setAmount(req.amount());
        charge.setStatus(MaintenanceStatus.PENDING);
        charge.setPaymentMode(null);
        charge.setPaidAt(null);
        charge.setNotes(req.notes());
        charge.setTransactionReference(null);
        return toResponse(repository.save(charge));
    }

    @Transactional
    public MaintenanceChargeResponse markPaidById(UUID societyId, UUID chargeId, String paymentMode) {
        MaintenanceCharge charge = repository.findByIdAndSocietyId(chargeId, societyId)
                .orElseThrow(() -> new NotFoundException("Maintenance charge not found"));
        charge.setStatus(MaintenanceStatus.PAID);
        charge.setPaidAt(Instant.now());
        charge.setPaymentMode(normalizePaymentMode(paymentMode));
        return toResponse(repository.save(charge));
    }

    @Transactional(readOnly = true)
    public List<MaintenanceChargeResponse> list(UUID societyId) {
        return repository.findBySocietyIdOrderByBillingYearDescBillingMonthDesc(societyId)
                .stream().map(MaintenanceService::toResponse).toList();
    }

    /**
     * Paid maintenance receipt PDF. Members may download only their own flat's paid charges;
     * admins may download any paid charge in the society.
     */
    @Transactional(readOnly = true)
    public ReceiptPdf downloadReceipt(
            UUID societyId,
            UUID chargeId,
            UUID userId,
            String role,
            String flatNumber) {
        MaintenanceCharge charge = repository.findByIdAndSocietyId(chargeId, societyId)
                .orElseThrow(() -> new NotFoundException("Maintenance charge not found"));
        if (charge.getStatus() != MaintenanceStatus.PAID) {
            throw new BadRequestException("Receipt is available only after maintenance is marked paid.");
        }

        boolean admin = role != null && role.toUpperCase(Locale.ROOT).contains("ADMIN");
        if (!admin) {
            boolean sameMember = charge.getMemberId() != null && charge.getMemberId().equals(userId);
            boolean sameFlat = flatNumber != null && !flatNumber.isBlank()
                    && flatNumber.trim().equalsIgnoreCase(charge.getFlatNumber());
            if (!sameMember && !sameFlat) {
                throw new ForbiddenException("You can only download receipts for your own flat.");
            }
        }

        String societyName = directoryLookup.findSocietyName(societyId).orElse("Society");
        String memberName = directoryLookup
                .findMemberName(societyId, charge.getMemberId(), charge.getFlatNumber())
                .orElse("Member");

        byte[] pdf = receiptPdfService.generate(societyName, memberName, charge);
        return new ReceiptPdf(receiptPdfService.filename(charge), pdf);
    }

    public record ReceiptPdf(String filename, byte[] bytes) {}

    private static String normalizePaymentMode(String paymentMode) {
        if (paymentMode == null || paymentMode.isBlank()) {
            throw new BadRequestException("Payment mode is required. Choose Cash or Online.");
        }
        String normalized = paymentMode.trim().toUpperCase(Locale.ROOT);
        if (!PAYMENT_MODES.contains(normalized)) {
            throw new BadRequestException("Payment mode must be CASH or ONLINE.");
        }
        return normalized;
    }

    private static UUID parseMemberId(String memberId) {
        if (memberId == null || memberId.isBlank()) return null;
        return UUID.fromString(memberId.trim());
    }

    static MaintenanceChargeResponse toResponse(MaintenanceCharge c) {
        return new MaintenanceChargeResponse(
                c.getId().toString(),
                c.getFlatNumber(),
                c.getMemberId() == null ? null : c.getMemberId().toString(),
                c.getBillingYear(),
                c.getBillingMonth(),
                c.getAmount(),
                c.getStatus().name(),
                c.getPaymentMode(),
                c.getPaidAt(),
                c.getNotes(),
                c.getTransactionReference()
        );
    }
}
