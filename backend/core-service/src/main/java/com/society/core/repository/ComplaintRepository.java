package com.society.core.repository;

import com.society.core.domain.Complaint;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ComplaintRepository extends JpaRepository<Complaint, UUID> {
    List<Complaint> findBySocietyIdOrderByCreatedAtDesc(UUID societyId);

    Optional<Complaint> findByIdAndSocietyId(UUID id, UUID societyId);

    long countBySocietyIdAndStatus(UUID societyId, String status);
}
