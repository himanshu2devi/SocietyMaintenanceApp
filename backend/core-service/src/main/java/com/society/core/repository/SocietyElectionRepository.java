package com.society.core.repository;

import com.society.core.domain.SocietyElection;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SocietyElectionRepository extends JpaRepository<SocietyElection, UUID> {

    Optional<SocietyElection> findByIdAndSocietyId(UUID id, UUID societyId);

    List<SocietyElection> findBySocietyIdOrderByCreatedAtDesc(UUID societyId);

    @Query("""
            SELECT e FROM SocietyElection e
            WHERE e.societyId = :societyId
              AND (:status IS NULL OR e.status = :status)
              AND (:q IS NULL OR LOWER(e.title) LIKE :q)
            ORDER BY e.createdAt DESC
            """)
    Page<SocietyElection> search(@Param("societyId") UUID societyId,
                                 @Param("status") String status,
                                 @Param("q") String q,
                                 Pageable pageable);
}
