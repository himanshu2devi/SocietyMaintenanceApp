package com.society.core.repository;

import com.society.core.domain.MemberAnnouncement;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.UUID;

public interface MemberAnnouncementRepository extends JpaRepository<MemberAnnouncement, UUID> {

    Optional<MemberAnnouncement> findByIdAndSocietyId(UUID id, UUID societyId);

    Page<MemberAnnouncement> findBySocietyIdOrderByCreatedAtDesc(UUID societyId, Pageable pageable);

    Page<MemberAnnouncement> findBySocietyIdAndStatusOrderByCreatedAtDesc(UUID societyId, String status, Pageable pageable);

    Page<MemberAnnouncement> findBySocietyIdAndAuthorUserIdOrderByCreatedAtDesc(UUID societyId, UUID authorUserId, Pageable pageable);

    long countBySocietyIdAndStatus(UUID societyId, String status);

    /** Member feed: everything approved for the society plus the member's own submissions. */
    @Query("""
            SELECT a FROM MemberAnnouncement a
            WHERE a.societyId = :societyId
              AND (a.status = 'APPROVED' OR a.authorUserId = :userId)
            ORDER BY a.createdAt DESC
            """)
    Page<MemberAnnouncement> findMemberFeed(@Param("societyId") UUID societyId,
                                            @Param("userId") UUID userId,
                                            Pageable pageable);
}
