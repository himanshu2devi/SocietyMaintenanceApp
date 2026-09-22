package com.society.core.repository;

import com.society.core.domain.ElectionCandidate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ElectionCandidateRepository extends JpaRepository<ElectionCandidate, UUID> {

    Optional<ElectionCandidate> findByIdAndSocietyId(UUID id, UUID societyId);

    List<ElectionCandidate> findByElectionIdAndSocietyIdOrderByFullNameAsc(UUID electionId, UUID societyId);

    List<ElectionCandidate> findByPositionIdAndSocietyIdOrderByFullNameAsc(UUID positionId, UUID societyId);

    void deleteByElectionIdAndSocietyId(UUID electionId, UUID societyId);

    void deleteByPositionIdAndSocietyId(UUID positionId, UUID societyId);
}
