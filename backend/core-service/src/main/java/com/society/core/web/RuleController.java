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
@RequestMapping("/api/v1/rules")
public class RuleController {

    private final ContentService service;

    public RuleController(ContentService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<RuleResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.listRules(user.societyId()));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RuleResponse> create(
            @AuthenticationPrincipal AuthenticatedUser user,
            @Valid @RequestBody CreateRuleRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.createRule(user.societyId(), user.userId(), req));
    }
}
