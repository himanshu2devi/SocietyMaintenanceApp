package com.society.core.repository;

import com.society.core.domain.ParkingSlot;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface ParkingSlotRepository extends JpaRepository<ParkingSlot, UUID> {

    Optional<ParkingSlot> findByIdAndSocietyId(UUID id, UUID societyId);

    boolean existsBySocietyIdAndSlotCodeIgnoreCase(UUID societyId, String slotCode);

    Optional<ParkingSlot> findBySocietyIdAndSlotCodeIgnoreCase(UUID societyId, String slotCode);

    @Query("""
            SELECT s FROM ParkingSlot s
            WHERE s.societyId = :societyId
              AND (:category IS NULL OR s.category = :category)
              AND (:status IS NULL OR s.status = :status)
              AND (:q IS NULL OR LOWER(s.slotCode) LIKE :q OR LOWER(COALESCE(s.buildingWing, '')) LIKE :q)
            ORDER BY s.slotCode ASC
            """)
    Page<ParkingSlot> search(@Param("societyId") UUID societyId,
                             @Param("category") String category,
                             @Param("status") String status,
                             @Param("q") String q,
                             Pageable pageable);
}
