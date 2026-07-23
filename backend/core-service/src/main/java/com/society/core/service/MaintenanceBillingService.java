package com.society.core.service;

import com.society.core.domain.MaintenanceBillingMode;
import com.society.core.domain.MemberMaintenanceDefault;
import com.society.core.domain.SocietyMaintenanceSettings;
import com.society.core.dto.MaintenanceBillingDtos.*;
import com.society.core.dto.MaintenanceRateDtos.EffectiveRateResponse;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.repository.MemberMaintenanceDefaultRepository;
import com.society.core.repository.MaintenanceRateScheduleRepository;
import com.society.core.repository.SocietyMaintenanceSettingsRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class MaintenanceBillingService {

    private final SocietyMaintenanceSettingsRepository settingsRepository;
    private final MemberMaintenanceDefaultRepository defaultRepository;
    private final MaintenanceRateScheduleRepository rateRepository;
    private final MaintenanceRateService rateService;

    public MaintenanceBillingService(
            SocietyMaintenanceSettingsRepository settingsRepository,
            MemberMaintenanceDefaultRepository defaultRepository,
            MaintenanceRateScheduleRepository rateRepository,
            MaintenanceRateService rateService) {
        this.settingsRepository = settingsRepository;
        this.defaultRepository = defaultRepository;
        this.rateRepository = rateRepository;
        this.rateService = rateService;
    }

    @Transactional
    public BillingSettingsResponse getSettings(UUID societyId) {
        return settingsRepository.findBySocietyId(societyId)
                .map(this::toSettingsResponse)
                .orElseGet(() -> lazyMigrateExistingSameSocieties(societyId));
    }

    private BillingSettingsResponse lazyMigrateExistingSameSocieties(UUID societyId) {
        boolean hasRates = !rateRepository
                .findBySocietyIdOrderByEffectiveFromYearDescEffectiveFromMonthDesc(societyId)
                .isEmpty();
        if (!hasRates) {
            return new BillingSettingsResponse(false, null, null);
        }
        SocietyMaintenanceSettings settings = new SocietyMaintenanceSettings();
        settings.setSocietyId(societyId);
        settings.setBillingMode(MaintenanceBillingMode.SAME);
        settings.setConfiguredAt(Instant.now());
        settings.setConfiguredBy(societyId);
        return toSettingsResponse(settingsRepository.save(settings));
    }

    @Transactional
    public BillingSettingsResponse chooseMode(UUID societyId, UUID userId, ChooseBillingModeRequest req) {
        if (req.billingMode() == null) {
            throw new BadRequestException("Choose SAME or VARIABLE maintenance billing.");
        }
        var existing = settingsRepository.findBySocietyId(societyId);
        if (existing.isPresent()) {
            throw new ConflictException(
                    "Maintenance billing mode is already set for this society and cannot be changed.");
        }
        SocietyMaintenanceSettings settings = new SocietyMaintenanceSettings();
        settings.setSocietyId(societyId);
        settings.setBillingMode(req.billingMode());
        settings.setConfiguredBy(userId);
        settings.setConfiguredAt(Instant.now());
        return toSettingsResponse(settingsRepository.save(settings));
    }

    @Transactional(readOnly = true)
    public MaintenanceBillingMode requireMode(UUID societyId) {
        return settingsRepository.findBySocietyId(societyId)
                .map(SocietyMaintenanceSettings::getBillingMode)
                .orElse(MaintenanceBillingMode.SAME);
    }

    @Transactional(readOnly = true)
    public List<MemberDefaultResponse> listMemberDefaults(UUID societyId) {
        return defaultRepository
                .findBySocietyIdOrderByEffectiveFromYearDescEffectiveFromMonthDescFlatNumberAsc(societyId)
                .stream()
                .map(this::toDefaultResponse)
                .toList();
    }

    @Transactional
    public List<MemberDefaultResponse> upsertMemberDefaults(
            UUID societyId, UUID userId, BulkUpsertMemberDefaultsRequest req) {
        MaintenanceBillingMode mode = requireMode(societyId);
        if (mode != MaintenanceBillingMode.VARIABLE) {
            throw new BadRequestException(
                    "Per-member amounts are only available when billing mode is VARIABLE.");
        }
        List<MemberDefaultResponse> saved = new ArrayList<>();
        for (UpsertMemberDefaultRequest item : req.defaults()) {
            UUID memberId;
            try {
                memberId = UUID.fromString(item.memberId().trim());
            } catch (IllegalArgumentException ex) {
                throw new BadRequestException("Invalid member id: " + item.memberId());
            }
            String flat = item.flatNumber() == null ? "" : item.flatNumber().trim();
            if (flat.isEmpty()) {
                throw new BadRequestException("Flat number is required for each member default.");
            }
            if (item.amount() == null || item.amount().compareTo(BigDecimal.ZERO) <= 0) {
                throw new BadRequestException("Amount must be greater than zero for flat " + flat);
            }
            int year = item.effectiveFromYear();
            int month = item.effectiveFromMonth();

            MemberMaintenanceDefault row = defaultRepository
                    .findBySocietyIdAndMemberIdAndEffectiveFromYearAndEffectiveFromMonth(
                            societyId, memberId, year, month)
                    .orElseGet(MemberMaintenanceDefault::new);
            if (row.getId() == null) {
                row.setSocietyId(societyId);
                row.setMemberId(memberId);
                row.setEffectiveFromYear(year);
                row.setEffectiveFromMonth(month);
                row.setCreatedAt(Instant.now());
            }
            row.setFlatNumber(flat);
            row.setAmount(item.amount());
            row.setUpdatedBy(userId);
            row.setUpdatedAt(Instant.now());
            saved.add(toDefaultResponse(defaultRepository.save(row)));
        }
        return saved;
    }

    /**
     * Resolve default amount for a flat/member for a billing period.
     * SAME → society rate timeline. VARIABLE → per-member effective-from timeline.
     */
    @Transactional(readOnly = true)
    public ResolvedAmountResponse resolveAmount(
            UUID societyId, UUID memberId, String flatNumber, int year, int month) {
        MaintenanceBillingMode mode = requireMode(societyId);

        if (mode == MaintenanceBillingMode.VARIABLE) {
            MemberMaintenanceDefault memberDefault = null;
            if (memberId != null) {
                memberDefault = defaultRepository
                        .findApplicableForMember(societyId, memberId, year, month)
                        .stream()
                        .findFirst()
                        .orElse(null);
            }
            if (memberDefault == null && flatNumber != null && !flatNumber.isBlank()) {
                memberDefault = defaultRepository
                        .findApplicableForFlat(societyId, flatNumber.trim(), year, month)
                        .stream()
                        .findFirst()
                        .orElse(null);
            }
            if (memberDefault == null || memberDefault.getAmount() == null
                    || memberDefault.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
                return new ResolvedAmountResponse(null, false, mode, "MEMBER_DEFAULT", null, null);
            }
            return new ResolvedAmountResponse(
                    memberDefault.getAmount(),
                    true,
                    mode,
                    "MEMBER_DEFAULT",
                    memberDefault.getEffectiveFromYear(),
                    memberDefault.getEffectiveFromMonth());
        }

        EffectiveRateResponse rate = rateService.effective(societyId, year, month);
        if (!rate.configured() || rate.amount() == null) {
            return new ResolvedAmountResponse(null, false, mode, "SOCIETY_RATE", null, null);
        }
        return new ResolvedAmountResponse(
                rate.amount(),
                true,
                mode,
                "SOCIETY_RATE",
                rate.effectiveFromYear(),
                rate.effectiveFromMonth());
    }

    private BillingSettingsResponse toSettingsResponse(SocietyMaintenanceSettings s) {
        return new BillingSettingsResponse(
                true,
                s.getBillingMode(),
                s.getConfiguredAt() == null ? null : s.getConfiguredAt().toString()
        );
    }

    private MemberDefaultResponse toDefaultResponse(MemberMaintenanceDefault d) {
        return new MemberDefaultResponse(
                d.getId().toString(),
                d.getMemberId().toString(),
                d.getFlatNumber(),
                d.getAmount(),
                d.getEffectiveFromYear(),
                d.getEffectiveFromMonth(),
                d.getUpdatedAt() == null ? null : d.getUpdatedAt().toString()
        );
    }
}
