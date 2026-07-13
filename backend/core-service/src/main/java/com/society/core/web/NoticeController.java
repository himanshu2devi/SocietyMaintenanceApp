package com.society.core.web;

import com.society.core.dto.ContentDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.service.ContentService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notices")
public class NoticeController {

    private final ContentService service;

    public NoticeController(ContentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<NoticeResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user) {
        boolean memberView = "MEMBER".equals(user.role());
        return ResponseEntity.ok(service.listNotices(user.societyId(), user.userId(), memberView));
    }

    @GetMapping("/unread-count")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<UnreadNoticesResponse> unreadCount(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.unreadCount(user.societyId(), user.userId()));
    }

    @PostMapping("/mark-read")
    @PreAuthorize("hasRole('MEMBER')")
    public ResponseEntity<UnreadNoticesResponse> markRead(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.markAllRead(user.societyId(), user.userId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateNoticeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createNotice(user.societyId(), user.userId(), user.name(), req));
    }

    @PostMapping("/{id}/notify")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponse> notifyMembers(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        return ResponseEntity.ok(service.notifyMembers(user.societyId(), id));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponse> update(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateNoticeRequest req) {
        return ResponseEntity.ok(service.updateNotice(user.societyId(), id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser user,
            @PathVariable UUID id) {
        service.deleteNotice(user.societyId(), id);
        return ResponseEntity.noContent().build();
    }
}
