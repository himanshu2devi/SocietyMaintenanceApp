package com.society.core.repository;

import com.society.core.domain.NoticeRead;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface NoticeReadRepository extends JpaRepository<NoticeRead, UUID> {
    List<NoticeRead> findBySocietyIdAndMemberIdAndNoticeIdIn(
            UUID societyId, UUID memberId, Collection<UUID> noticeIds);

    Optional<NoticeRead> findByNoticeIdAndMemberId(UUID noticeId, UUID memberId);

    long countBySocietyIdAndMemberIdAndNoticeIdIn(UUID societyId, UUID memberId, Collection<UUID> noticeIds);

    void deleteByNoticeId(UUID noticeId);
}
