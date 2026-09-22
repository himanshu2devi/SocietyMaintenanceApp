package com.society.core.repository;

import com.society.core.domain.SocietyEvent;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SocietyEventRepository extends JpaRepository<SocietyEvent, UUID> {

    Optional<SocietyEvent> findByIdAndSocietyId(UUID id, UUID societyId);

    List<SocietyEvent> findBySocietyIdOrderByEventDateDesc(UUID societyId);

    @Query("""
            SELECT e FROM SocietyEvent e
            WHERE e.societyId = :societyId
              AND (:status IS NULL OR e.status = :status)
              AND (:from IS NULL OR e.eventDate >= :from)
              AND (:to IS NULL OR e.eventDate <= :to)
              AND (:q IS NULL OR LOWER(e.title) LIKE :q OR LOWER(COALESCE(e.location, '')) LIKE :q)
            ORDER BY e.eventDate DESC, e.createdAt DESC
            """)
    Page<SocietyEvent> search(@Param("societyId") UUID societyId,
                              @Param("status") String status,
                              @Param("from") LocalDate from,
                              @Param("to") LocalDate to,
                              @Param("q") String q,
                              Pageable pageable);
}
