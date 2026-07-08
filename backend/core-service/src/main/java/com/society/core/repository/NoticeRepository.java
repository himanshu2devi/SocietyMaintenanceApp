package com.society.core.repository;

import com.society.core.domain.Notice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface NoticeRepository extends JpaRepository<Notice, UUID> {
    List<Notice> findBySocietyIdOrderByCreatedAtDesc(UUID societyId);
}
