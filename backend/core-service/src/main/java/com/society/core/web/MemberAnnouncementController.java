package com.society.core.web;

import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.MemberAnnouncementDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.security.SocietyScope;
import com.society.core.service.MemberAnnouncementService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/member-announcements")
public class MemberAnnouncementController {

    private final MemberAnnouncementService service;

    public MemberAnnouncementController(MemberAnnouncementService service) {
        this.service = service;
    }

    /** Admins see everything for their society; members see approved posts plus their own. */
    @GetMapping
    public ResponseEntity<PageResponse<MemberAnnouncementResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String status,
            @PageableDefault(size = 50) Pageable pageable) {
        UUID societyId = SocietyScope.require(user);
        if ("ADMIN".equals(user.role())) {
            return ResponseEntity.ok(service.listForAdmin(societyId, status, pageable));
        }
        return ResponseEntity.ok(service.listForMember(societyId, user.userId(), pageable));
    }

    @GetMapping("/mine")
    public ResponseEntity<PageResponse<MemberAnnouncementResponse>> mine(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(service.listOwn(SocietyScope.require(user), user.userId(), pageable));
    }

    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PageResponse<MemberAnnouncementResponse>> pending(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(
                service.listForAdmin(SocietyScope.require(user), "PENDING_APPROVAL", pageable));
    }

    @GetMapping("/pending-count")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PendingCountResponse> pendingCount(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.pendingCount(SocietyScope.require(user)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberAnnouncementResponse> get(@AuthenticationPrincipal AuthenticatedUser user,
                                                          @PathVariable UUID id) {
        return ResponseEntity.ok(
                service.get(SocietyScope.require(user), user.userId(), user.role(), id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MEMBER','ADMIN')")
    public ResponseEntity<MemberAnnouncementResponse> submit(@AuthenticationPrincipal AuthenticatedUser user,
                                                             @Valid @RequestBody SubmitAnnouncementRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.submit(
                SocietyScope.require(user), user.userId(), user.name(), user.flatNumber(), req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MEMBER','ADMIN')")
    public ResponseEntity<MemberAnnouncementResponse> updateOwn(@AuthenticationPrincipal AuthenticatedUser user,
                                                                @PathVariable UUID id,
                                                                @Valid @RequestBody SubmitAnnouncementRequest req) {
        return ResponseEntity.ok(service.updateOwn(SocietyScope.require(user), user.userId(), id, req));
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MemberAnnouncementResponse> approve(@AuthenticationPrincipal AuthenticatedUser user,
                                                              @PathVariable UUID id,
                                                              @RequestBody(required = false) @Valid ReviewAnnouncementRequest req) {
        return ResponseEntity.ok(service.approve(SocietyScope.require(user), user.userId(), id, req));
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MemberAnnouncementResponse> reject(@AuthenticationPrincipal AuthenticatedUser user,
                                                             @PathVariable UUID id,
                                                             @RequestBody(required = false) @Valid ReviewAnnouncementRequest req) {
        return ResponseEntity.ok(service.reject(SocietyScope.require(user), user.userId(), id, req));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user,
                                       @PathVariable UUID id) {
        service.delete(SocietyScope.require(user), user.userId(), user.role(), id);
        return ResponseEntity.noContent().build();
    }
}
