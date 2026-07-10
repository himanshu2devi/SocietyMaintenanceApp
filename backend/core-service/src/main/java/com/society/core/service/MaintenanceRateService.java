package com.society.core.service;

import com.society.core.domain.MaintenanceRateSchedule;
import com.society.core.dto.MaintenanceRateDtos.*;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.repository.MaintenanceRateScheduleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MaintenanceRateService {

    private final MaintenanceRateScheduleRepository repository;

    public MaintenanceRateService(MaintenanceRateScheduleRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<MaintenanceRateResponse> list(UUID societyId) {
        return repository.findBySocietyIdOrderByEffectiveFromYearDescEffectiveFromMonthDesc(societyId)
                .stream().map(MaintenanceRateService::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public EffectiveRateResponse effective(UUID societyId, int year, int month) {
        return repository.findApplicableRates(societyId, year, month).stream().findFirst()
                .map(r -> new EffectiveRateResponse(
                        r.getAmount(),
                        r.getEffectiveFromYear(),
                        r.getEffectiveFromMonth(),
                        true))
                .orElse(new EffectiveRateResponse(null, null, null, false));
    }

    @Transactional
    public MaintenanceRateResponse setRate(UUID societyId, UUID createdBy, UpsertMaintenanceRateRequest req) {
        var existing = repository.findBySocietyIdAndEffectiveFromYearAndEffectiveFromMonth(
                societyId, req.effectiveFromYear(), req.effectiveFromMonth());

        MaintenanceRateSchedule rate = existing.orElseGet(MaintenanceRateSchedule::new);
        if (existing.isEmpty()) {
            rate.setSocietyId(societyId);
            rate.setCreatedBy(createdBy);
            rate.setEffectiveFromYear(req.effectiveFromYear());
            rate.setEffectiveFromMonth(req.effectiveFromMonth());
        } else if (existing.get().getAmount().compareTo(req.amount()) == 0
                && ((req.notes() == null && existing.get().getNotes() == null)
                || (req.notes() != null && req.notes().equals(existing.get().getNotes())))) {
            throw new ConflictException("This rate is already set for the selected month.");
        }

        // Updating the same effective month is allowed (correct a mistake for that start month),
        // but already-recorded charges keep their stored amounts.
        rate.setAmount(req.amount());
        rate.setNotes(req.notes());
        if (rate.getCreatedBy() == null) rate.setCreatedBy(createdBy);
        return toResponse(repository.save(rate));
    }

    static MaintenanceRateResponse toResponse(MaintenanceRateSchedule r) {
        return new MaintenanceRateResponse(
                r.getId().toString(),
                r.getAmount(),
                r.getEffectiveFromYear(),
                r.getEffectiveFromMonth(),
                r.getNotes(),
                r.getCreatedAt() == null ? null : r.getCreatedAt().toString()
        );
    }
}
