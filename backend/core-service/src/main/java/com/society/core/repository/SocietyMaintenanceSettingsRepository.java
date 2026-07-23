package com.society.core.repository;

import com.society.core.domain.SocietyMaintenanceSettings;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SocietyMaintenanceSettingsRepository extends JpaRepository<SocietyMaintenanceSettings, UUID> {
    Optional<SocietyMaintenanceSettings> findBySocietyId(UUID societyId);
    boolean existsBySocietyId(UUID societyId);
}
