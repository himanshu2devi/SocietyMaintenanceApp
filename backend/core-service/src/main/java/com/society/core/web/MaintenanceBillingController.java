package com.society.core.web;

import com.society.core.dto.MaintenanceBillingDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.service.MaintenanceBillingService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/maintenance-billing")
public class MaintenanceBillingController {

    private final MaintenanceBillingService service;

    public MaintenanceBillingController(MaintenanceBillingService service) {
        this.service = service;
    }

    @GetMapping("/settings")
    public ResponseEntity<BillingSettingsResponse> settings(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.getSettings(user.societyId()));
    }

    @PostMapping("/settings/mode")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<BillingSettingsResponse> chooseMode(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody ChooseBillingModeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.chooseMode(user.societyId(), user.userId(), req));
    }

    @GetMapping("/member-defaults")
    public ResponseEntity<List<MemberDefaultResponse>> listDefaults(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.listMemberDefaults(user.societyId()));
    }

    @PutMapping("/member-defaults")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MemberDefaultResponse>> upsertDefaults(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody BulkUpsertMemberDefaultsRequest req) {
        return ResponseEntity.ok(service.upsertMemberDefaults(user.societyId(), user.userId(), req));
    }

    @GetMapping("/resolve")
    public ResponseEntity<ResolvedAmountResponse> resolve(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam int year,
            @RequestParam int month,
            @RequestParam(required = false) String memberId,
            @RequestParam(required = false) String flatNumber) {
        UUID mid = null;
        if (memberId != null && !memberId.isBlank()) {
            mid = UUID.fromString(memberId.trim());
        }
        return ResponseEntity.ok(service.resolveAmount(user.societyId(), mid, flatNumber, year, month));
    }
}
