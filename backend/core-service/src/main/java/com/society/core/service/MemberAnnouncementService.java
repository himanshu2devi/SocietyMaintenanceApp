package com.society.core.service;

import com.society.core.domain.MemberAnnouncement;
import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.MemberAnnouncementDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.MemberAnnouncementRepository;
import com.society.core.repository.SocietyEventRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class MemberAnnouncementService {

    static final String PENDING = "PENDING_APPROVAL";
    static final String APPROVED = "APPROVED";
    static final String REJECTED = "REJECTED";
    static final Set<String> STATUSES = Set.of(PENDING, APPROVED, REJECTED);

    private final MemberAnnouncementRepository repository;
    private final SocietyEventRepository eventRepository;

    public MemberAnnouncementService(MemberAnnouncementRepository repository,
                                     SocietyEventRepository eventRepository) {
        this.repository = repository;
        this.eventRepository = eventRepository;
    }

    /** Member feed: approved announcements for the society plus the caller's own submissions. */
    @Transactional(readOnly = true)
    public PageResponse<MemberAnnouncementResponse> listForMember(UUID societyId, UUID userId, Pageable pageable) {
        return PageResponse.of(repository.findMemberFeed(societyId, userId, pageable),
                a -> toResponse(a, isAuthor(a, userId)));
    }

    /** Admin view: every announcement for the society, optionally filtered by status. */
    @Transactional(readOnly = true)
    public PageResponse<MemberAnnouncementResponse> listForAdmin(UUID societyId, String status, Pageable pageable) {
        String normalized = (status == null || status.isBlank()) ? null : normalizeStatus(status);
        var page = normalized == null
                ? repository.findBySocietyIdOrderByCreatedAtDesc(societyId, pageable)
                : repository.findBySocietyIdAndStatusOrderByCreatedAtDesc(societyId, normalized, pageable);
        return PageResponse.of(page, a -> toResponse(a, true));
    }

    @Transactional(readOnly = true)
    public PageResponse<MemberAnnouncementResponse> listOwn(UUID societyId, UUID userId, Pageable pageable) {
        return PageResponse.of(
                repository.findBySocietyIdAndAuthorUserIdOrderByCreatedAtDesc(societyId, userId, pageable),
                a -> toResponse(a, isAuthor(a, userId)));
    }

    @Transactional(readOnly = true)
    public PendingCountResponse pendingCount(UUID societyId) {
        return new PendingCountResponse(repository.countBySocietyIdAndStatus(societyId, PENDING));
    }

    @Transactional(readOnly = true)
    public MemberAnnouncementResponse get(UUID societyId, UUID userId, String role, UUID id) {
        MemberAnnouncement a = findOwned(societyId, id);
        if (!"ADMIN".equals(role) && !APPROVED.equals(a.getStatus()) && !isAuthor(a, userId)) {
            throw new NotFoundException("Announcement not found");
        }
        return toResponse(a, "ADMIN".equals(role) || isAuthor(a, userId));
    }

    @Transactional
    public MemberAnnouncementResponse submit(UUID societyId, UUID userId, String name, String flatNumber,
                                             SubmitAnnouncementRequest req) {
        MemberAnnouncement a = new MemberAnnouncement();
        a.setSocietyId(societyId);
        a.setAuthorUserId(userId);
        a.setAuthorName(name);
        a.setAuthorFlatNumber(flatNumber);
        a.setTitle(req.title().trim());
        a.setBody(req.body().trim());
        a.setRelatedEventId(resolveRelatedEvent(societyId, req.relatedEventId()));
        a.setStatus(PENDING);
        return toResponse(repository.save(a), true);
    }

    @Transactional
    public MemberAnnouncementResponse updateOwn(UUID societyId, UUID userId, UUID id, SubmitAnnouncementRequest req) {
        MemberAnnouncement a = findOwned(societyId, id);
        if (!isAuthor(a, userId)) {
            throw new BadRequestException("You can only edit your own announcements.");
        }
        if (!PENDING.equals(a.getStatus())) {
            throw new ConflictException("Reviewed announcements can no longer be edited.");
        }
        a.setTitle(req.title().trim());
        a.setBody(req.body().trim());
        a.setRelatedEventId(resolveRelatedEvent(societyId, req.relatedEventId()));
        return toResponse(repository.save(a), true);
    }

    @Transactional
    public void delete(UUID societyId, UUID userId, String role, UUID id) {
        MemberAnnouncement a = findOwned(societyId, id);
        boolean isAdmin = "ADMIN".equals(role);
        if (!isAdmin && !isAuthor(a, userId)) {
            throw new BadRequestException("You can only delete your own announcements.");
        }
        repository.delete(a);
    }

    @Transactional
    public MemberAnnouncementResponse approve(UUID societyId, UUID reviewerUserId, UUID id,
                                              ReviewAnnouncementRequest req) {
        return review(societyId, reviewerUserId, id, APPROVED, req);
    }

    @Transactional
    public MemberAnnouncementResponse reject(UUID societyId, UUID reviewerUserId, UUID id,
                                             ReviewAnnouncementRequest req) {
        return review(societyId, reviewerUserId, id, REJECTED, req);
    }

    private MemberAnnouncementResponse review(UUID societyId, UUID reviewerUserId, UUID id,
                                              String targetStatus, ReviewAnnouncementRequest req) {
        MemberAnnouncement a = findOwned(societyId, id);
        if (targetStatus.equals(a.getStatus())) {
            throw new ConflictException("This announcement is already " + targetStatus.toLowerCase(Locale.ROOT) + ".");
        }
        a.setStatus(targetStatus);
        a.setReviewerUserId(reviewerUserId);
        a.setReviewNote(req == null ? null : trimToNull(req.reviewNote()));
        a.setReviewedAt(Instant.now());
        return toResponse(repository.save(a), true);
    }

    private MemberAnnouncement findOwned(UUID societyId, UUID id) {
        return repository.findByIdAndSocietyId(id, societyId)
                .orElseThrow(() -> new NotFoundException("Announcement not found"));
    }

    private UUID resolveRelatedEvent(UUID societyId, UUID relatedEventId) {
        if (relatedEventId == null) return null;
        return eventRepository.findByIdAndSocietyId(relatedEventId, societyId)
                .orElseThrow(() -> new BadRequestException("Linked event was not found for this society"))
                .getId();
    }

    private static boolean isAuthor(MemberAnnouncement a, UUID userId) {
        return userId != null && userId.equals(a.getAuthorUserId());
    }

    static String normalizeStatus(String status) {
        String value = status.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if ("PENDING".equals(value)) value = PENDING;
        if (!STATUSES.contains(value)) {
            throw new BadRequestException("Status must be PENDING_APPROVAL, APPROVED or REJECTED");
        }
        return value;
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    static MemberAnnouncementResponse toResponse(MemberAnnouncement a, boolean editable) {
        return new MemberAnnouncementResponse(
                a.getId() == null ? null : a.getId().toString(),
                a.getTitle(),
                a.getBody(),
                a.getRelatedEventId() == null ? null : a.getRelatedEventId().toString(),
                a.getStatus(),
                a.getAuthorUserId() == null ? null : a.getAuthorUserId().toString(),
                a.getAuthorName(),
                a.getAuthorFlatNumber(),
                a.getReviewerUserId() == null ? null : a.getReviewerUserId().toString(),
                a.getReviewNote(),
                a.getReviewedAt(),
                a.getCreatedAt(),
                a.getUpdatedAt(),
                editable
        );
    }
}
