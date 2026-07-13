package com.society.core.service;

import com.society.core.domain.Notice;
import com.society.core.domain.NoticeRead;
import com.society.core.domain.SocietyRule;
import com.society.core.dto.ContentDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.NoticeReadRepository;
import com.society.core.repository.NoticeRepository;
import com.society.core.repository.SocietyRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ContentService {

    private final NoticeRepository noticeRepository;
    private final NoticeReadRepository noticeReadRepository;
    private final SocietyRuleRepository ruleRepository;

    public ContentService(NoticeRepository noticeRepository,
                          NoticeReadRepository noticeReadRepository,
                          SocietyRuleRepository ruleRepository) {
        this.noticeRepository = noticeRepository;
        this.noticeReadRepository = noticeReadRepository;
        this.ruleRepository = ruleRepository;
    }

    @Transactional
    public NoticeResponse createNotice(UUID societyId, UUID createdBy, String createdByName,
                                       CreateNoticeRequest req) {
        Notice n = new Notice();
        n.setSocietyId(societyId);
        n.setTitle(req.title().trim());
        n.setBody(req.body().trim());
        n.setPriority(req.priority() == null || req.priority().isBlank() ? "NORMAL" : req.priority().trim().toUpperCase());
        n.setCreatedBy(createdBy);
        n.setCreatedByName(createdByName);
        return toNoticeResponse(noticeRepository.save(n), false);
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> listNotices(UUID societyId, UUID memberId, boolean memberView) {
        List<Notice> notices = noticeRepository.findBySocietyIdOrderByCreatedAtDesc(societyId);
        Set<UUID> unreadIds = Set.of();
        if (memberView && memberId != null) {
            unreadIds = unreadNoticeIds(societyId, memberId, notices);
        }
        Set<UUID> finalUnread = unreadIds;
        return notices.stream()
                .map(n -> toNoticeResponse(n, finalUnread.contains(n.getId())))
                .toList();
    }

    @Transactional
    public NoticeResponse notifyMembers(UUID societyId, UUID noticeId) {
        Notice notice = noticeRepository.findByIdAndSocietyId(noticeId, societyId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));
        if (notice.getNotifiedAt() != null) {
            throw new BadRequestException("Members were already notified for this notice.");
        }
        notice.setNotifiedAt(Instant.now());
        return toNoticeResponse(noticeRepository.save(notice), false);
    }

    @Transactional
    public NoticeResponse updateNotice(UUID societyId, UUID noticeId, UpdateNoticeRequest req) {
        Notice notice = noticeRepository.findByIdAndSocietyId(noticeId, societyId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));
        notice.setTitle(req.title().trim());
        notice.setBody(req.body().trim());
        notice.setPriority(req.priority() == null || req.priority().isBlank()
                ? "NORMAL"
                : req.priority().trim().toUpperCase());
        return toNoticeResponse(noticeRepository.save(notice), false);
    }

    @Transactional
    public void deleteNotice(UUID societyId, UUID noticeId) {
        Notice notice = noticeRepository.findByIdAndSocietyId(noticeId, societyId)
                .orElseThrow(() -> new NotFoundException("Notice not found"));
        noticeReadRepository.deleteByNoticeId(notice.getId());
        noticeRepository.delete(notice);
    }

    @Transactional(readOnly = true)
    public UnreadNoticesResponse unreadCount(UUID societyId, UUID memberId) {
        List<Notice> notified = noticeRepository.findBySocietyIdAndNotifiedAtIsNotNullOrderByNotifiedAtDesc(societyId);
        return new UnreadNoticesResponse(unreadNoticeIds(societyId, memberId, notified).size());
    }

    @Transactional
    public UnreadNoticesResponse markAllRead(UUID societyId, UUID memberId) {
        List<Notice> notified = noticeRepository.findBySocietyIdAndNotifiedAtIsNotNullOrderByNotifiedAtDesc(societyId);
        Set<UUID> unread = unreadNoticeIds(societyId, memberId, notified);
        Instant now = Instant.now();
        for (UUID noticeId : unread) {
            NoticeRead read = new NoticeRead();
            read.setSocietyId(societyId);
            read.setNoticeId(noticeId);
            read.setMemberId(memberId);
            read.setReadAt(now);
            noticeReadRepository.save(read);
        }
        return new UnreadNoticesResponse(0);
    }

    @Transactional
    public RuleResponse createRule(UUID societyId, UUID createdBy, CreateRuleRequest req) {
        SocietyRule r = new SocietyRule();
        r.setSocietyId(societyId);
        r.setCategory(req.category().trim());
        r.setTitle(req.title().trim());
        r.setRuleText(req.ruleText().trim());
        r.setCreatedBy(createdBy);
        return toRuleResponse(ruleRepository.save(r));
    }

    @Transactional
    public RuleResponse updateRule(UUID societyId, UUID ruleId, UpdateRuleRequest req) {
        SocietyRule rule = ruleRepository.findByIdAndSocietyId(ruleId, societyId)
                .orElseThrow(() -> new NotFoundException("Rule not found"));
        rule.setCategory(req.category().trim());
        rule.setTitle(req.title().trim());
        rule.setRuleText(req.ruleText().trim());
        return toRuleResponse(ruleRepository.save(rule));
    }

    @Transactional
    public void deleteRule(UUID societyId, UUID ruleId) {
        SocietyRule rule = ruleRepository.findByIdAndSocietyId(ruleId, societyId)
                .orElseThrow(() -> new NotFoundException("Rule not found"));
        ruleRepository.delete(rule);
    }

    @Transactional(readOnly = true)
    public List<RuleResponse> listRules(UUID societyId) {
        return ruleRepository.findBySocietyIdOrderByCategoryAscTitleAsc(societyId)
                .stream().map(ContentService::toRuleResponse).toList();
    }

    private Set<UUID> unreadNoticeIds(UUID societyId, UUID memberId, List<Notice> notices) {
        List<UUID> notifiedIds = notices.stream()
                .filter(n -> n.getNotifiedAt() != null)
                .map(Notice::getId)
                .toList();
        if (notifiedIds.isEmpty()) {
            return Set.of();
        }
        Set<UUID> readIds = noticeReadRepository
                .findBySocietyIdAndMemberIdAndNoticeIdIn(societyId, memberId, notifiedIds)
                .stream()
                .map(NoticeRead::getNoticeId)
                .collect(Collectors.toSet());
        Set<UUID> unread = new HashSet<>(notifiedIds);
        unread.removeAll(readIds);
        return unread;
    }

    static NoticeResponse toNoticeResponse(Notice n, boolean unread) {
        return new NoticeResponse(
                n.getId().toString(),
                n.getTitle(),
                n.getBody(),
                n.getPriority(),
                n.getCreatedByName(),
                n.getCreatedAt(),
                n.getNotifiedAt(),
                unread
        );
    }

    static RuleResponse toRuleResponse(SocietyRule r) {
        return new RuleResponse(
                r.getId().toString(), r.getCategory(), r.getTitle(),
                r.getRuleText(), r.getCreatedAt());
    }
}
