package com.society.core.repository;

import com.society.core.domain.MaintenanceRateSchedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MaintenanceRateScheduleRepository extends JpaRepository<MaintenanceRateSchedule, UUID> {

    List<MaintenanceRateSchedule> findBySocietyIdOrderByEffectiveFromYearDescEffectiveFromMonthDesc(UUID societyId);

    Optional<MaintenanceRateSchedule> findBySocietyIdAndEffectiveFromYearAndEffectiveFromMonth(
            UUID societyId, int year, int month);

    @Query("""
            SELECT r FROM MaintenanceRateSchedule r
            WHERE r.societyId = :societyId
              AND (r.effectiveFromYear < :year
                   OR (r.effectiveFromYear = :year AND r.effectiveFromMonth <= :month))
            ORDER BY r.effectiveFromYear DESC, r.effectiveFromMonth DESC
            """)
    List<MaintenanceRateSchedule> findApplicableRates(
            @Param("societyId") UUID societyId,
            @Param("year") int year,
            @Param("month") int month);
}
