package com.society.core.service;

import com.society.core.domain.SocietyMeeting;
import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.MeetingDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.SocietyMeetingRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class MeetingService {

    static final Set<String> MEETING_TYPES =
            Set.of("GENERAL_BODY", "AGM", "COMMITTEE", "SPECIAL", "EMERGENCY");

    static final Set<String> STATUSES =
            Set.of("SCHEDULED", "COMPLETED", "CANCELLED", "POSTPONED");

    private final SocietyMeetingRepository repository;

    public MeetingService(SocietyMeetingRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<MeetingResponse> list(UUID societyId, String meetingType, String status,
                                              LocalDate from, LocalDate to, String q, Pageable pageable) {
        return PageResponse.of(
                repository.search(societyId,
                        normalizeOrNull(meetingType, MEETING_TYPES, typeMessage()),
                        normalizeOrNull(status, STATUSES, statusMessage()),
                        from, to, likeOrNull(q), pageable),
                MeetingService::toResponse);
    }

    @Transactional(readOnly = true)
    public MeetingResponse get(UUID societyId, UUID id) {
        return toResponse(findOwned(societyId, id));
    }

    @Transactional
    public MeetingResponse create(UUID societyId, UUID createdBy, UpsertMeetingRequest req) {
        SocietyMeeting meeting = new SocietyMeeting();
        meeting.setSocietyId(societyId);
        meeting.setCreatedBy(createdBy);
        apply(meeting, req);
        return toResponse(repository.save(meeting));
    }

    @Transactional
    public MeetingResponse update(UUID societyId, UUID id, UpsertMeetingRequest req) {
        SocietyMeeting meeting = findOwned(societyId, id);
        apply(meeting, req);
        return toResponse(repository.save(meeting));
    }

    @Transactional
    public void delete(UUID societyId, UUID id) {
        repository.delete(findOwned(societyId, id));
    }

    private SocietyMeeting findOwned(UUID societyId, UUID id) {
        return repository.findByIdAndSocietyId(id, societyId)
                .orElseThrow(() -> new NotFoundException("Meeting not found"));
    }

    private void apply(SocietyMeeting meeting, UpsertMeetingRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new BadRequestException("Title is required");
        }
        if (req.meetingDate() == null) {
            throw new BadRequestException("Meeting date is required");
        }
        meeting.setTitle(req.title().trim());
        meeting.setMeetingType(normalizeMeetingType(req.meetingType()));
        meeting.setMeetingDate(req.meetingDate());
        meeting.setStartTime(req.startTime());
        meeting.setLocation(trimToNull(req.location()));
        meeting.setAgenda(trimToNull(req.agenda()));
        meeting.setDescription(trimToNull(req.description()));
        meeting.setOrganizer(trimToNull(req.organizer()));
        meeting.setStatus(normalizeStatus(req.status()));
        meeting.setMinutes(trimToNull(req.minutes()));
        meeting.setAttachmentUrl(trimToNull(req.attachmentUrl()));
    }

    static String normalizeMeetingType(String meetingType) {
        if (meetingType == null || meetingType.isBlank()) {
            throw new BadRequestException(typeMessage());
        }
        String value = meetingType.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if ("GENERAL".equals(value)) value = "GENERAL_BODY";
        if (!MEETING_TYPES.contains(value)) {
            throw new BadRequestException(typeMessage());
        }
        return value;
    }

    static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "SCHEDULED";
        String value = status.trim().toUpperCase(Locale.ROOT);
        if (!STATUSES.contains(value)) {
            throw new BadRequestException(statusMessage());
        }
        return value;
    }

    private static String typeMessage() {
        return "Meeting type must be GENERAL_BODY, AGM, COMMITTEE, SPECIAL or EMERGENCY";
    }

    private static String statusMessage() {
        return "Meeting status must be SCHEDULED, COMPLETED, CANCELLED or POSTPONED";
    }

    private static String normalizeOrNull(String value, Set<String> allowed, String message) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if (!allowed.contains(normalized)) {
            throw new BadRequestException(message);
        }
        return normalized;
    }

    private static String likeOrNull(String q) {
        if (q == null || q.isBlank()) return null;
        return "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    static MeetingResponse toResponse(SocietyMeeting m) {
        return new MeetingResponse(
                m.getId() == null ? null : m.getId().toString(),
                m.getTitle(),
                m.getMeetingType(),
                m.getMeetingDate(),
                m.getStartTime(),
                m.getLocation(),
                m.getAgenda(),
                m.getDescription(),
                m.getOrganizer(),
                m.getStatus(),
                m.getMinutes(),
                m.getAttachmentUrl(),
                m.getCreatedBy() == null ? null : m.getCreatedBy().toString(),
                m.getCreatedAt(),
                m.getUpdatedAt()
        );
    }
}
