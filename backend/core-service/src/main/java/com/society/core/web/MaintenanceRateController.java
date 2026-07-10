package com.society.core.web;

import com.society.core.dto.MaintenanceRateDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.service.MaintenanceRateService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/maintenance-rates")
public class MaintenanceRateController {

    private final MaintenanceRateService service;

    public MaintenanceRateController(MaintenanceRateService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MaintenanceRateResponse>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.list(user.societyId()));
    }

    @GetMapping("/effective")
    public ResponseEntity<EffectiveRateResponse> effective(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(service.effective(user.societyId(), year, month));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MaintenanceRateResponse> setRate(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody UpsertMaintenanceRateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.setRate(user.societyId(), user.userId(), req));
    }
}
