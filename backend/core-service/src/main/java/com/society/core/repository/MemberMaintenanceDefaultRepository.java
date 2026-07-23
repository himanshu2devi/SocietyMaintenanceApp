package com.society.core.repository;

import com.society.core.domain.MemberMaintenanceDefault;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface MemberMaintenanceDefaultRepository extends JpaRepository<MemberMaintenanceDefault, UUID> {

    List<MemberMaintenanceDefault> findBySocietyIdOrderByEffectiveFromYearDescEffectiveFromMonthDescFlatNumberAsc(
            UUID societyId);

    Optional<MemberMaintenanceDefault> findBySocietyIdAndMemberIdAndEffectiveFromYearAndEffectiveFromMonth(
            UUID societyId, UUID memberId, int year, int month);

    @Query("""
            SELECT d FROM MemberMaintenanceDefault d
            WHERE d.societyId = :societyId
              AND d.memberId = :memberId
              AND (d.effectiveFromYear < :year
                   OR (d.effectiveFromYear = :year AND d.effectiveFromMonth <= :month))
            ORDER BY d.effectiveFromYear DESC, d.effectiveFromMonth DESC
            """)
    List<MemberMaintenanceDefault> findApplicableForMember(
            @Param("societyId") UUID societyId,
            @Param("memberId") UUID memberId,
            @Param("year") int year,
            @Param("month") int month);

    @Query("""
            SELECT d FROM MemberMaintenanceDefault d
            WHERE d.societyId = :societyId
              AND LOWER(d.flatNumber) = LOWER(:flatNumber)
              AND (d.effectiveFromYear < :year
                   OR (d.effectiveFromYear = :year AND d.effectiveFromMonth <= :month))
            ORDER BY d.effectiveFromYear DESC, d.effectiveFromMonth DESC
            """)
    List<MemberMaintenanceDefault> findApplicableForFlat(
            @Param("societyId") UUID societyId,
            @Param("flatNumber") String flatNumber,
            @Param("year") int year,
            @Param("month") int month);
}
