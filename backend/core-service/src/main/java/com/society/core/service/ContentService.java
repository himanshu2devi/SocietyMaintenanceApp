package com.society.core.service;

import com.society.core.domain.Notice;
import com.society.core.domain.SocietyRule;
import com.society.core.dto.ContentDtos.*;
import com.society.core.repository.NoticeRepository;
import com.society.core.repository.SocietyRuleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ContentService {

    private final NoticeRepository noticeRepository;
    private final SocietyRuleRepository ruleRepository;

    public ContentService(NoticeRepository noticeRepository, SocietyRuleRepository ruleRepository) {
        this.noticeRepository = noticeRepository;
        this.ruleRepository = ruleRepository;
    }

    @Transactional
    public NoticeResponse createNotice(UUID societyId, UUID createdBy, String createdByName,
                                       CreateNoticeRequest req) {
        Notice n = new Notice();
        n.setSocietyId(societyId);
        n.setTitle(req.title());
        n.setBody(req.body());
        n.setPriority(req.priority() == null ? "NORMAL" : req.priority());
        n.setCreatedBy(createdBy);
        n.setCreatedByName(createdByName);
        return toNoticeResponse(noticeRepository.save(n));
    }

    @Transactional(readOnly = true)
    public List<NoticeResponse> listNotices(UUID societyId) {
        return noticeRepository.findBySocietyIdOrderByCreatedAtDesc(societyId)
                .stream().map(ContentService::toNoticeResponse).toList();
    }

    @Transactional
    public RuleResponse createRule(UUID societyId, UUID createdBy, CreateRuleRequest req) {
        SocietyRule r = new SocietyRule();
        r.setSocietyId(societyId);
        r.setCategory(req.category());
        r.setTitle(req.title());
        r.setRuleText(req.ruleText());
        r.setCreatedBy(createdBy);
        return toRuleResponse(ruleRepository.save(r));
    }

    @Transactional(readOnly = true)
    public List<RuleResponse> listRules(UUID societyId) {
        return ruleRepository.findBySocietyIdOrderByCategoryAscTitleAsc(societyId)
                .stream().map(ContentService::toRuleResponse).toList();
    }

    static NoticeResponse toNoticeResponse(Notice n) {
        return new NoticeResponse(
                n.getId().toString(), n.getTitle(), n.getBody(),
                n.getPriority(), n.getCreatedByName(), n.getCreatedAt());
    }

    static RuleResponse toRuleResponse(SocietyRule r) {
        return new RuleResponse(
                r.getId().toString(), r.getCategory(), r.getTitle(),
                r.getRuleText(), r.getCreatedAt());
    }
}
