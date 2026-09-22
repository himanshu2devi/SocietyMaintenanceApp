package com.society.core.repository;

import com.society.core.domain.ElectionPosition;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ElectionPositionRepository extends JpaRepository<ElectionPosition, UUID> {

    Optional<ElectionPosition> findByIdAndSocietyId(UUID id, UUID societyId);

    List<ElectionPosition> findByElectionIdAndSocietyIdOrderBySortOrderAscTitleAsc(UUID electionId, UUID societyId);

    boolean existsByElectionIdAndSocietyIdAndTitleIgnoreCase(UUID electionId, UUID societyId, String title);

    void deleteByElectionIdAndSocietyId(UUID electionId, UUID societyId);
}
