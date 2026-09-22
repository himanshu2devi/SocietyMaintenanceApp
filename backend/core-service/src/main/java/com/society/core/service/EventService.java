package com.society.core.service;

import com.society.core.domain.SocietyEvent;
import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.EventDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.SocietyEventRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class EventService {

    static final Set<String> STATUSES = Set.of("SCHEDULED", "CANCELLED", "COMPLETED");

    private final SocietyEventRepository repository;

    public EventService(SocietyEventRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public PageResponse<EventResponse> list(UUID societyId, String status, LocalDate from,
                                            LocalDate to, String q, Pageable pageable) {
        return PageResponse.of(
                repository.search(societyId, normalizeStatusFilter(status), from, to, likeOrNull(q), pageable),
                EventService::toResponse);
    }

    @Transactional(readOnly = true)
    public EventResponse get(UUID societyId, UUID id) {
        return toResponse(findOwned(societyId, id));
    }

    @Transactional
    public EventResponse create(UUID societyId, UUID createdBy, UpsertEventRequest req) {
        SocietyEvent event = new SocietyEvent();
        event.setSocietyId(societyId);
        event.setCreatedBy(createdBy);
        apply(event, req);
        return toResponse(repository.save(event));
    }

    @Transactional
    public EventResponse update(UUID societyId, UUID id, UpsertEventRequest req) {
        SocietyEvent event = findOwned(societyId, id);
        apply(event, req);
        return toResponse(repository.save(event));
    }

    @Transactional
    public void delete(UUID societyId, UUID id) {
        repository.delete(findOwned(societyId, id));
    }

    private SocietyEvent findOwned(UUID societyId, UUID id) {
        return repository.findByIdAndSocietyId(id, societyId)
                .orElseThrow(() -> new NotFoundException("Event not found"));
    }

    private void apply(SocietyEvent event, UpsertEventRequest req) {
        if (req.title() == null || req.title().isBlank()) {
            throw new BadRequestException("Title is required");
        }
        if (req.eventDate() == null) {
            throw new BadRequestException("Event date is required");
        }
        if (req.startTime() != null && req.endTime() != null && !req.endTime().isAfter(req.startTime())) {
            throw new BadRequestException("End time must be after start time");
        }
        if (req.endTime() != null && req.startTime() == null) {
            throw new BadRequestException("Start time is required when an end time is set");
        }

        event.setTitle(req.title().trim());
        event.setDescription(trimToNull(req.description()));
        event.setEventDate(req.eventDate());
        event.setStartTime(req.startTime());
        event.setEndTime(req.endTime());
        event.setLocation(trimToNull(req.location()));
        event.setOrganizer(trimToNull(req.organizer()));
        event.setImageUrl(trimToNull(req.imageUrl()));
        event.setStatus(normalizeStatus(req.status()));
    }

    static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) return "SCHEDULED";
        String value = status.trim().toUpperCase(Locale.ROOT);
        if (!STATUSES.contains(value)) {
            throw new BadRequestException("Event status must be SCHEDULED, CANCELLED or COMPLETED");
        }
        return value;
    }

    private static String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank()) return null;
        return normalizeStatus(status);
    }

    static String likeOrNull(String q) {
        if (q == null || q.isBlank()) return null;
        return "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    static EventResponse toResponse(SocietyEvent e) {
        return new EventResponse(
                e.getId() == null ? null : e.getId().toString(),
                e.getTitle(),
                e.getDescription(),
                e.getEventDate(),
                e.getStartTime(),
                e.getEndTime(),
                e.getLocation(),
                e.getOrganizer(),
                e.getImageUrl(),
                e.getStatus(),
                e.getCreatedBy() == null ? null : e.getCreatedBy().toString(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
