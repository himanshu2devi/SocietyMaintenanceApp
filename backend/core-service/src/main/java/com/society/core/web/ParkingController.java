package com.society.core.web;

import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.ParkingDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.security.SocietyScope;
import com.society.core.service.ParkingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/parking")
public class ParkingController {

    private final ParkingService service;

    public ParkingController(ParkingService service) {
        this.service = service;
    }

    // ---------- slots ----------

    @GetMapping("/slots")
    public ResponseEntity<PageResponse<ParkingSlotResponse>> listSlots(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(service.listSlots(SocietyScope.require(user), category, status, q, pageable));
    }

    @GetMapping("/slots/{slotId}")
    public ResponseEntity<ParkingSlotResponse> getSlot(@AuthenticationPrincipal AuthenticatedUser user,
                                                       @PathVariable UUID slotId) {
        return ResponseEntity.ok(service.getSlot(SocietyScope.require(user), slotId));
    }

    @PostMapping("/slots")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParkingSlotResponse> createSlot(@AuthenticationPrincipal AuthenticatedUser user,
                                                          @Valid @RequestBody UpsertParkingSlotRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createSlot(SocietyScope.require(user), user.userId(), req));
    }

    @PutMapping("/slots/{slotId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParkingSlotResponse> updateSlot(@AuthenticationPrincipal AuthenticatedUser user,
                                                          @PathVariable UUID slotId,
                                                          @Valid @RequestBody UpsertParkingSlotRequest req) {
        return ResponseEntity.ok(service.updateSlot(SocietyScope.require(user), slotId, req));
    }

    @DeleteMapping("/slots/{slotId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deleteSlot(@AuthenticationPrincipal AuthenticatedUser user,
                                           @PathVariable UUID slotId) {
        service.deleteSlot(SocietyScope.require(user), slotId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/slots/{slotId}/mark-unavailable")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParkingSlotResponse> markUnavailable(@AuthenticationPrincipal AuthenticatedUser user,
                                                               @PathVariable UUID slotId) {
        return ResponseEntity.ok(service.markUnavailable(SocietyScope.require(user), slotId));
    }

    @PostMapping("/slots/{slotId}/mark-available")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParkingSlotResponse> markAvailable(@AuthenticationPrincipal AuthenticatedUser user,
                                                             @PathVariable UUID slotId) {
        return ResponseEntity.ok(service.markAvailable(SocietyScope.require(user), slotId));
    }

    // ---------- assignments ----------

    @PostMapping("/slots/{slotId}/assign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParkingAssignmentResponse> assign(@AuthenticationPrincipal AuthenticatedUser user,
                                                            @PathVariable UUID slotId,
                                                            @Valid @RequestBody AssignParkingSlotRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.assign(SocietyScope.require(user), user.userId(), slotId, req));
    }

    @PostMapping("/slots/{slotId}/unassign")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ParkingAssignmentResponse> unassign(@AuthenticationPrincipal AuthenticatedUser user,
                                                              @PathVariable UUID slotId,
                                                              @RequestBody(required = false) @Valid UnassignParkingSlotRequest req) {
        return ResponseEntity.ok(service.unassign(SocietyScope.require(user), slotId, req));
    }

    @GetMapping("/slots/{slotId}/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<ParkingAssignmentResponse>> slotHistory(@AuthenticationPrincipal AuthenticatedUser user,
                                                                       @PathVariable UUID slotId) {
        return ResponseEntity.ok(service.listSlotHistory(SocietyScope.require(user), slotId));
    }

    @GetMapping("/assignments")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<ParkingAssignmentResponse>> listAssignments(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) Boolean active,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(service.listAssignments(SocietyScope.require(user), active, pageable));
    }

    /** A member can only ever see the slots allotted to their own user id. */
    @GetMapping("/my-assignments")
    public ResponseEntity<List<ParkingAssignmentResponse>> myAssignments(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.listMyAssignments(SocietyScope.require(user), user.userId()));
    }
}
