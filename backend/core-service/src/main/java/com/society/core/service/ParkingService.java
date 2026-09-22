package com.society.core.service;

import com.society.core.domain.ParkingAssignment;
import com.society.core.domain.ParkingSlot;
import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.ParkingDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.ParkingAssignmentRepository;
import com.society.core.repository.ParkingSlotRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

@Service
public class ParkingService {

    static final String STATUS_AVAILABLE = "AVAILABLE";
    static final String STATUS_ASSIGNED = "ASSIGNED";
    static final String STATUS_UNAVAILABLE = "UNAVAILABLE";

    static final Set<String> CATEGORIES = Set.of("COMMON", "ASSIGNED");
    static final Set<String> STATUSES = Set.of(STATUS_AVAILABLE, STATUS_ASSIGNED, STATUS_UNAVAILABLE);

    private final ParkingSlotRepository slotRepository;
    private final ParkingAssignmentRepository assignmentRepository;

    public ParkingService(ParkingSlotRepository slotRepository,
                          ParkingAssignmentRepository assignmentRepository) {
        this.slotRepository = slotRepository;
        this.assignmentRepository = assignmentRepository;
    }

    // ---------- slots ----------

    @Transactional(readOnly = true)
    public PageResponse<ParkingSlotResponse> listSlots(UUID societyId, String category, String status,
                                                       String q, Pageable pageable) {
        var page = slotRepository.search(societyId,
                normalizeOrNull(category, CATEGORIES, "Category must be COMMON or ASSIGNED"),
                normalizeOrNull(status, STATUSES, "Status must be AVAILABLE, ASSIGNED or UNAVAILABLE"),
                likeOrNull(q), pageable);

        List<UUID> slotIds = page.getContent().stream().map(ParkingSlot::getId).toList();
        Map<UUID, ParkingAssignment> activeBySlot = new HashMap<>();
        if (!slotIds.isEmpty()) {
            assignmentRepository.findActiveForSlots(societyId, slotIds)
                    .forEach(a -> activeBySlot.put(a.getSlotId(), a));
        }
        return PageResponse.of(page, slot -> toSlotResponse(slot, activeBySlot.get(slot.getId())));
    }

    @Transactional(readOnly = true)
    public ParkingSlotResponse getSlot(UUID societyId, UUID slotId) {
        ParkingSlot slot = findSlot(societyId, slotId);
        return toSlotResponse(slot, assignmentRepository.findActiveForSlot(societyId, slotId).orElse(null));
    }

    @Transactional
    public ParkingSlotResponse createSlot(UUID societyId, UUID createdBy, UpsertParkingSlotRequest req) {
        String slotCode = requireSlotCode(req.slotCode());
        if (slotRepository.existsBySocietyIdAndSlotCodeIgnoreCase(societyId, slotCode)) {
            throw new ConflictException("A parking slot with code " + slotCode + " already exists.");
        }
        ParkingSlot slot = new ParkingSlot();
        slot.setSocietyId(societyId);
        slot.setCreatedBy(createdBy);
        slot.setSlotCode(slotCode);
        slot.setCategory(normalizeCategory(req.category()));
        slot.setBuildingWing(trimToNull(req.buildingWing()));
        slot.setNotes(trimToNull(req.notes()));
        slot.setStatus(normalizeSlotStatus(req.status(), STATUS_AVAILABLE));
        if (STATUS_ASSIGNED.equals(slot.getStatus())) {
            throw new BadRequestException("A new slot cannot start as ASSIGNED. Create it, then assign a member.");
        }
        return toSlotResponse(slotRepository.save(slot), null);
    }

    @Transactional
    public ParkingSlotResponse updateSlot(UUID societyId, UUID slotId, UpsertParkingSlotRequest req) {
        ParkingSlot slot = findSlot(societyId, slotId);
        String slotCode = requireSlotCode(req.slotCode());
        slotRepository.findBySocietyIdAndSlotCodeIgnoreCase(societyId, slotCode)
                .filter(existing -> !existing.getId().equals(slotId))
                .ifPresent(existing -> {
                    throw new ConflictException("A parking slot with code " + slotCode + " already exists.");
                });

        ParkingAssignment active = assignmentRepository.findActiveForSlot(societyId, slotId).orElse(null);
        String status = normalizeSlotStatus(req.status(), slot.getStatus());
        if (active != null && !STATUS_ASSIGNED.equals(status)) {
            throw new ConflictException("Release the active assignment before changing this slot's status.");
        }
        if (active == null && STATUS_ASSIGNED.equals(status)) {
            throw new BadRequestException("Assign a member to mark this slot as ASSIGNED.");
        }

        slot.setSlotCode(slotCode);
        slot.setCategory(normalizeCategory(req.category()));
        slot.setBuildingWing(trimToNull(req.buildingWing()));
        slot.setNotes(trimToNull(req.notes()));
        slot.setStatus(status);
        return toSlotResponse(slotRepository.save(slot), active);
    }

    @Transactional
    public void deleteSlot(UUID societyId, UUID slotId) {
        ParkingSlot slot = findSlot(societyId, slotId);
        if (assignmentRepository.countActiveForSlot(societyId, slotId) > 0) {
            throw new ConflictException("Release the active assignment before deleting this slot.");
        }
        assignmentRepository.deleteAll(
                assignmentRepository.findBySocietyIdAndSlotIdOrderByAssignedAtDesc(societyId, slotId));
        slotRepository.delete(slot);
    }

    @Transactional
    public ParkingSlotResponse markUnavailable(UUID societyId, UUID slotId) {
        ParkingSlot slot = findSlot(societyId, slotId);
        if (assignmentRepository.countActiveForSlot(societyId, slotId) > 0) {
            throw new ConflictException("Release the active assignment before marking this slot unavailable.");
        }
        slot.setStatus(STATUS_UNAVAILABLE);
        return toSlotResponse(slotRepository.save(slot), null);
    }

    @Transactional
    public ParkingSlotResponse markAvailable(UUID societyId, UUID slotId) {
        ParkingSlot slot = findSlot(societyId, slotId);
        if (assignmentRepository.countActiveForSlot(societyId, slotId) > 0) {
            throw new ConflictException("This slot is currently assigned. Unassign it first.");
        }
        slot.setStatus(STATUS_AVAILABLE);
        return toSlotResponse(slotRepository.save(slot), null);
    }

    // ---------- assignments ----------

    @Transactional
    public ParkingAssignmentResponse assign(UUID societyId, UUID assignedBy, UUID slotId,
                                            AssignParkingSlotRequest req) {
        ParkingSlot slot = findSlot(societyId, slotId);
        if (STATUS_UNAVAILABLE.equals(slot.getStatus())) {
            throw new ConflictException("This slot is marked unavailable and cannot be assigned.");
        }

        Optional<ParkingAssignment> existing = assignmentRepository.findActiveForSlot(societyId, slotId);
        boolean replace = Boolean.TRUE.equals(req.replaceExisting());
        if (existing.isPresent() && !replace) {
            throw new ConflictException(
                    "Slot " + slot.getSlotCode() + " already has an active assignment. Unassign it first.");
        }
        // Flush the release before inserting so the one-active-row-per-slot index never sees two.
        existing.ifPresent(previous -> {
            releaseAssignment(previous, null);
            assignmentRepository.saveAndFlush(previous);
        });

        ParkingAssignment assignment = new ParkingAssignment();
        assignment.setSocietyId(societyId);
        assignment.setSlotId(slotId);
        assignment.setMemberUserId(req.memberUserId());
        assignment.setMemberName(trimToNull(req.memberName()));
        assignment.setFlatNumber(trimToNull(req.flatNumber()));
        assignment.setVehicleNumber(trimToNull(req.vehicleNumber()));
        assignment.setVehicleType(trimToNull(req.vehicleType()));
        assignment.setNotes(trimToNull(req.notes()));
        assignment.setActive(true);
        assignment.setAssignedAt(Instant.now());
        assignment.setAssignedBy(assignedBy);

        if (assignment.getMemberUserId() == null && assignment.getFlatNumber() == null) {
            throw new BadRequestException("Provide the member or the flat number for this assignment.");
        }

        ParkingAssignment saved = assignmentRepository.save(assignment);
        slot.setStatus(STATUS_ASSIGNED);
        slotRepository.save(slot);
        return toAssignmentResponse(saved, slot.getSlotCode());
    }

    @Transactional
    public ParkingAssignmentResponse unassign(UUID societyId, UUID slotId, UnassignParkingSlotRequest req) {
        ParkingSlot slot = findSlot(societyId, slotId);
        ParkingAssignment active = assignmentRepository.findActiveForSlot(societyId, slotId)
                .orElseThrow(() -> new NotFoundException("This slot has no active assignment"));

        releaseAssignment(active, req == null ? null : trimToNull(req.notes()));
        ParkingAssignment saved = assignmentRepository.save(active);
        slot.setStatus(STATUS_AVAILABLE);
        slotRepository.save(slot);
        return toAssignmentResponse(saved, slot.getSlotCode());
    }

    @Transactional(readOnly = true)
    public PageResponse<ParkingAssignmentResponse> listAssignments(UUID societyId, Boolean active, Pageable pageable) {
        var page = active == null
                ? assignmentRepository.findBySocietyIdOrderByAssignedAtDesc(societyId, pageable)
                : assignmentRepository.findBySocietyIdAndActiveOrderByAssignedAtDesc(societyId, active, pageable);
        Map<UUID, String> slotCodes = slotCodeLookup(societyId, page.getContent());
        return PageResponse.of(page, a -> toAssignmentResponse(a, slotCodes.get(a.getSlotId())));
    }

    @Transactional(readOnly = true)
    public List<ParkingAssignmentResponse> listMyAssignments(UUID societyId, UUID memberUserId) {
        List<ParkingAssignment> assignments =
                assignmentRepository.findBySocietyIdAndMemberUserIdOrderByAssignedAtDesc(societyId, memberUserId);
        Map<UUID, String> slotCodes = slotCodeLookup(societyId, assignments);
        return assignments.stream().map(a -> toAssignmentResponse(a, slotCodes.get(a.getSlotId()))).toList();
    }

    @Transactional(readOnly = true)
    public List<ParkingAssignmentResponse> listSlotHistory(UUID societyId, UUID slotId) {
        ParkingSlot slot = findSlot(societyId, slotId);
        return assignmentRepository.findBySocietyIdAndSlotIdOrderByAssignedAtDesc(societyId, slotId)
                .stream().map(a -> toAssignmentResponse(a, slot.getSlotCode())).toList();
    }

    // ---------- helpers ----------

    private static void releaseAssignment(ParkingAssignment assignment, String notes) {
        assignment.setActive(false);
        assignment.setUnassignedAt(Instant.now());
        if (notes != null) {
            assignment.setNotes(notes);
        }
    }

    private Map<UUID, String> slotCodeLookup(UUID societyId, List<ParkingAssignment> assignments) {
        Map<UUID, String> codes = new HashMap<>();
        assignments.stream()
                .map(ParkingAssignment::getSlotId)
                .distinct()
                .forEach(slotId -> slotRepository.findByIdAndSocietyId(slotId, societyId)
                        .ifPresent(slot -> codes.put(slotId, slot.getSlotCode())));
        return codes;
    }

    private ParkingSlot findSlot(UUID societyId, UUID slotId) {
        return slotRepository.findByIdAndSocietyId(slotId, societyId)
                .orElseThrow(() -> new NotFoundException("Parking slot not found"));
    }

    private static String requireSlotCode(String slotCode) {
        if (slotCode == null || slotCode.isBlank()) {
            throw new BadRequestException("Slot code is required");
        }
        return slotCode.trim().toUpperCase(Locale.ROOT);
    }

    static String normalizeCategory(String category) {
        if (category == null || category.isBlank()) {
            throw new BadRequestException("Category must be COMMON or ASSIGNED");
        }
        String value = category.trim().toUpperCase(Locale.ROOT);
        if (!CATEGORIES.contains(value)) {
            throw new BadRequestException("Category must be COMMON or ASSIGNED");
        }
        return value;
    }

    private static String normalizeSlotStatus(String status, String fallback) {
        if (status == null || status.isBlank()) return fallback;
        String value = status.trim().toUpperCase(Locale.ROOT);
        if (!STATUSES.contains(value)) {
            throw new BadRequestException("Status must be AVAILABLE, ASSIGNED or UNAVAILABLE");
        }
        return value;
    }

    private static String normalizeOrNull(String value, Set<String> allowed, String message) {
        if (value == null || value.isBlank()) return null;
        String normalized = value.trim().toUpperCase(Locale.ROOT);
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

    static ParkingSlotResponse toSlotResponse(ParkingSlot slot, ParkingAssignment active) {
        return new ParkingSlotResponse(
                slot.getId() == null ? null : slot.getId().toString(),
                slot.getSlotCode(),
                slot.getCategory(),
                slot.getBuildingWing(),
                slot.getStatus(),
                slot.getNotes(),
                active == null ? null : toAssignmentResponse(active, slot.getSlotCode()),
                slot.getCreatedAt(),
                slot.getUpdatedAt()
        );
    }

    static ParkingAssignmentResponse toAssignmentResponse(ParkingAssignment a, String slotCode) {
        return new ParkingAssignmentResponse(
                a.getId() == null ? null : a.getId().toString(),
                a.getSlotId() == null ? null : a.getSlotId().toString(),
                slotCode,
                a.getMemberUserId() == null ? null : a.getMemberUserId().toString(),
                a.getMemberName(),
                a.getFlatNumber(),
                a.getVehicleNumber(),
                a.getVehicleType(),
                a.isActive(),
                a.getAssignedAt(),
                a.getUnassignedAt(),
                a.getNotes()
        );
    }
}
