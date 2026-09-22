package com.society.core.web;

import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.MeetingDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.security.SocietyScope;
import com.society.core.service.MeetingService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/meetings")
public class MeetingController {

    private final MeetingService service;

    public MeetingController(MeetingService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PageResponse<MeetingResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String meetingType,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(
                service.list(SocietyScope.require(user), meetingType, status, from, to, q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MeetingResponse> get(@AuthenticationPrincipal AuthenticatedUser user,
                                               @PathVariable UUID id) {
        return ResponseEntity.ok(service.get(SocietyScope.require(user), id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MeetingResponse> create(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @Valid @RequestBody UpsertMeetingRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(SocietyScope.require(user), user.userId(), req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MeetingResponse> update(@AuthenticationPrincipal AuthenticatedUser user,
                                                  @PathVariable UUID id,
                                                  @Valid @RequestBody UpsertMeetingRequest req) {
        return ResponseEntity.ok(service.update(SocietyScope.require(user), id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user,
                                       @PathVariable UUID id) {
        service.delete(SocietyScope.require(user), id);
        return ResponseEntity.noContent().build();
    }
}
