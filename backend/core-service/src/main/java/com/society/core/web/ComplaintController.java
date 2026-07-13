package com.society.core.web;

import com.society.core.dto.ComplaintDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/complaints")
public class ComplaintController {

    private final ComplaintService service;

    public ComplaintController(ComplaintService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.list(user.societyId(), user.userId(), user.role()));
    }

    @PostMapping
    public ResponseEntity<ComplaintResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateComplaintRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(
                        user.societyId(),
                        user.userId(),
                        user.name(),
                        user.role(),
                        user.flatNumber(),
                        req));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ComplaintResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateComplaintRequest req) {
        return ResponseEntity.ok(service.update(user.societyId(), user.userId(), user.role(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        service.delete(user.societyId(), user.userId(), user.role(), id);
        return ResponseEntity.noContent().build();
    }
}
