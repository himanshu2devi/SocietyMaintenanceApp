package com.society.core.repository;

import com.society.core.domain.SocietyPaymentQr;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SocietyPaymentQrRepository extends JpaRepository<SocietyPaymentQr, UUID> {
    Optional<SocietyPaymentQr> findBySocietyId(UUID societyId);

    void deleteBySocietyId(UUID societyId);
}
