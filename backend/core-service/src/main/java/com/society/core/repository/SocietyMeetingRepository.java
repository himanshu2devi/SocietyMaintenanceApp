package com.society.core.repository;

import com.society.core.domain.SocietyMeeting;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SocietyMeetingRepository extends JpaRepository<SocietyMeeting, UUID> {

    Optional<SocietyMeeting> findByIdAndSocietyId(UUID id, UUID societyId);

    List<SocietyMeeting> findBySocietyIdOrderByMeetingDateDesc(UUID societyId);

    @Query("""
            SELECT m FROM SocietyMeeting m
            WHERE m.societyId = :societyId
              AND (:meetingType IS NULL OR m.meetingType = :meetingType)
              AND (:status IS NULL OR m.status = :status)
              AND (:from IS NULL OR m.meetingDate >= :from)
              AND (:to IS NULL OR m.meetingDate <= :to)
              AND (:q IS NULL OR LOWER(m.title) LIKE :q OR LOWER(COALESCE(m.location, '')) LIKE :q)
            ORDER BY m.meetingDate DESC, m.createdAt DESC
            """)
    Page<SocietyMeeting> search(@Param("societyId") UUID societyId,
                                @Param("meetingType") String meetingType,
                                @Param("status") String status,
                                @Param("from") LocalDate from,
                                @Param("to") LocalDate to,
                                @Param("q") String q,
                                Pageable pageable);
}
