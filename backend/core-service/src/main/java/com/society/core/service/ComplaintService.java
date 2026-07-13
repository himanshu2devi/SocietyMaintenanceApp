package com.society.core.service;

import com.society.core.domain.Complaint;
import com.society.core.dto.ComplaintDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.ComplaintRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class ComplaintService {

    private static final Set<String> STATUSES = Set.of("OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED");
    private static final Set<String> PRIORITIES = Set.of("LOW", "NORMAL", "HIGH", "URGENT");

    private final ComplaintRepository repository;

    public ComplaintService(ComplaintRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ComplaintResponse> list(UUID societyId, UUID userId, String role) {
        return repository.findBySocietyIdOrderByCreatedAtDesc(societyId).stream()
                .map(c -> toResponse(c, canEdit(c, userId, role)))
                .toList();
    }

    @Transactional
    public ComplaintResponse create(UUID societyId, UUID userId, String name, String role,
                                    String flatNumber, CreateComplaintRequest req) {
        Complaint c = new Complaint();
        c.setSocietyId(societyId);
        c.setTitle(req.title().trim());
        c.setDescription(req.description().trim());
        c.setCategory(blankToDefault(req.category(), "General"));
        c.setPriority(normalizePriority(req.priority()));
        c.setStatus("OPEN");
        c.setCreatedBy(userId);
        c.setCreatedByName(name);
        c.setCreatedByRole(role);
        c.setFlatNumber(flatNumber);
        return toResponse(repository.save(c), true);
    }

    @Transactional
    public ComplaintResponse update(UUID societyId, UUID userId, String role,
                                    UUID id, UpdateComplaintRequest req) {
        Complaint c = repository.findByIdAndSocietyId(id, societyId)
                .orElseThrow(() -> new NotFoundException("Complaint not found"));
        if (!canEdit(c, userId, role)) {
            throw new BadRequestException("You can only edit your own complaints.");
        }

        c.setTitle(req.title().trim());
        c.setDescription(req.description().trim());
        c.setCategory(blankToDefault(req.category(), "General"));
        c.setPriority(normalizePriority(req.priority()));

        boolean isAdmin = "ADMIN".equals(role);
        if (isAdmin) {
            if (req.status() != null && !req.status().isBlank()) {
                c.setStatus(normalizeStatus(req.status()));
            }
            if (req.adminNotes() != null) {
                String notes = req.adminNotes().trim();
                c.setAdminNotes(notes.isEmpty() ? null : notes);
            }
        } else if (req.status() != null && !req.status().isBlank()
                && !normalizeStatus(req.status()).equals(c.getStatus())) {
            throw new BadRequestException("Only committee admins can change complaint status.");
        }

        return toResponse(repository.save(c), true);
    }

    @Transactional
    public void delete(UUID societyId, UUID userId, String role, UUID id) {
        Complaint c = repository.findByIdAndSocietyId(id, societyId)
                .orElseThrow(() -> new NotFoundException("Complaint not found"));
        if (!canEdit(c, userId, role)) {
            throw new BadRequestException("You can only delete your own complaints.");
        }
        repository.delete(c);
    }

    private static boolean canEdit(Complaint c, UUID userId, String role) {
        return "ADMIN".equals(role) || c.getCreatedBy().equals(userId);
    }

    private static String normalizeStatus(String status) {
        String value = status.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if ("INPROGRESS".equals(value)) value = "IN_PROGRESS";
        if (!STATUSES.contains(value)) {
            throw new BadRequestException("Invalid complaint status.");
        }
        return value;
    }

    private static String normalizePriority(String priority) {
        if (priority == null || priority.isBlank()) return "NORMAL";
        String value = priority.trim().toUpperCase(Locale.ROOT);
        if (!PRIORITIES.contains(value)) {
            throw new BadRequestException("Invalid complaint priority.");
        }
        return value;
    }

    private static String blankToDefault(String value, String fallback) {
        if (value == null || value.isBlank()) return fallback;
        return value.trim();
    }

    static ComplaintResponse toResponse(Complaint c, boolean editable) {
        return new ComplaintResponse(
                c.getId().toString(),
                c.getTitle(),
                c.getDescription(),
                c.getCategory(),
                c.getStatus(),
                c.getPriority(),
                c.getCreatedBy().toString(),
                c.getCreatedByName(),
                c.getCreatedByRole(),
                c.getFlatNumber(),
                c.getAdminNotes(),
                c.getCreatedAt(),
                c.getUpdatedAt(),
                editable
        );
    }
}
