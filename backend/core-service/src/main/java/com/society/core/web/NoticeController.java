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
        return ResponseEntity.ok(service.listNotices(user.societyId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<NoticeResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateNoticeRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createNotice(user.societyId(), user.userId(), user.name(), req));
    }
}
