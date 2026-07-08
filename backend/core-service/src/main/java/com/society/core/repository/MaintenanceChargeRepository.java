package com.society.core.repository;

import com.society.core.domain.MaintenanceCharge;
import com.society.core.domain.MaintenanceStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MaintenanceChargeRepository extends JpaRepository<MaintenanceCharge, UUID> {

    List<MaintenanceCharge> findBySocietyIdOrderByBillingYearDescBillingMonthDesc(UUID societyId);

    List<MaintenanceCharge> findBySocietyIdAndStatus(UUID societyId, MaintenanceStatus status);

    Optional<MaintenanceCharge> findByIdAndSocietyId(UUID id, UUID societyId);

    Optional<MaintenanceCharge> findBySocietyIdAndFlatNumberAndBillingYearAndBillingMonth(
            UUID societyId, String flatNumber, int billingYear, int billingMonth);

    @Query("""
            SELECT COALESCE(SUM(c.amount), 0) FROM MaintenanceCharge c
            WHERE c.societyId = :societyId AND c.status = :status
              AND c.billingYear = :year AND c.billingMonth = :month
            """)
    BigDecimal sumByStatusForMonth(@Param("societyId") UUID societyId,
                                   @Param("status") MaintenanceStatus status,
                                   @Param("year") int year,
                                   @Param("month") int month);

    @Query("""
            SELECT COALESCE(SUM(c.amount), 0) FROM MaintenanceCharge c
            WHERE c.societyId = :societyId AND c.status = :status AND c.billingYear = :year
            """)
    BigDecimal sumByStatusForYear(@Param("societyId") UUID societyId,
                                  @Param("status") MaintenanceStatus status,
                                  @Param("year") int year);
}
