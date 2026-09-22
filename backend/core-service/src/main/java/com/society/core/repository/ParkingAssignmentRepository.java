package com.society.core.repository;

import com.society.core.domain.ParkingAssignment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ParkingAssignmentRepository extends JpaRepository<ParkingAssignment, UUID> {

    Optional<ParkingAssignment> findByIdAndSocietyId(UUID id, UUID societyId);

    @Query("""
            SELECT a FROM ParkingAssignment a
            WHERE a.societyId = :societyId AND a.slotId = :slotId AND a.active = true
            """)
    Optional<ParkingAssignment> findActiveForSlot(@Param("societyId") UUID societyId,
                                                  @Param("slotId") UUID slotId);

    @Query("""
            SELECT COUNT(a) FROM ParkingAssignment a
            WHERE a.societyId = :societyId AND a.slotId = :slotId AND a.active = true
            """)
    long countActiveForSlot(@Param("societyId") UUID societyId, @Param("slotId") UUID slotId);

    @Query("""
            SELECT a FROM ParkingAssignment a
            WHERE a.societyId = :societyId AND a.slotId IN :slotIds AND a.active = true
            """)
    List<ParkingAssignment> findActiveForSlots(@Param("societyId") UUID societyId,
                                               @Param("slotIds") List<UUID> slotIds);

    List<ParkingAssignment> findBySocietyIdAndMemberUserIdOrderByAssignedAtDesc(UUID societyId, UUID memberUserId);

    Page<ParkingAssignment> findBySocietyIdOrderByAssignedAtDesc(UUID societyId, Pageable pageable);

    Page<ParkingAssignment> findBySocietyIdAndActiveOrderByAssignedAtDesc(UUID societyId, boolean active, Pageable pageable);

    List<ParkingAssignment> findBySocietyIdAndSlotIdOrderByAssignedAtDesc(UUID societyId, UUID slotId);
}
