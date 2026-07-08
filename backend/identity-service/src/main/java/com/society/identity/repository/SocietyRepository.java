package com.society.identity.repository;

import com.society.identity.domain.Society;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface SocietyRepository extends JpaRepository<Society, UUID> {
    boolean existsBySocietyCode(String societyCode);
    Optional<Society> findBySocietyCode(String societyCode);
}
