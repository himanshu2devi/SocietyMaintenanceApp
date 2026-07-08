package com.society.core.repository;

import com.society.core.domain.SocietyRule;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface SocietyRuleRepository extends JpaRepository<SocietyRule, UUID> {
    List<SocietyRule> findBySocietyIdOrderByCategoryAscTitleAsc(UUID societyId);
}
