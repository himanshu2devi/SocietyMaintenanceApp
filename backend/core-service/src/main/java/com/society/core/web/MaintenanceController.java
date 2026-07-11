package com.society.core.web;

import com.society.core.dto.MaintenanceDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.service.MaintenanceService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/maintenance")
public class MaintenanceController {

    private final MaintenanceService service;

    public MaintenanceController(MaintenanceService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceChargeResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.list(user.societyId()));
    }

    @PostMapping("/collect")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceChargeResponse> recordCollection(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody RecordCollectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.recordCollection(user.societyId(), req));
    }

    @PostMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceChargeResponse> markPending(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody MarkPendingRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.markPending(user.societyId(), req));
    }

    @PatchMapping("/{chargeId}/paid")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceChargeResponse> markPaid(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID chargeId,
            @RequestParam String paymentMode) {
        return ResponseEntity.ok(service.markPaidById(user.societyId(), chargeId, paymentMode));
    }
}