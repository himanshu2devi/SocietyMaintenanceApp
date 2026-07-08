package com.society.identity.web;

import com.society.identity.dto.MemberDtos.*;
import com.society.identity.security.AuthenticatedUser;
import com.society.identity.service.MemberService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/members")
public class MemberController {

    private final MemberService memberService;

    public MemberController(MemberService memberService) {
        this.memberService = memberService;
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MemberResponse> add(@AuthenticationPrincipal AuthenticatedUser user,
                                              @Valid @RequestBody AddMemberRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(memberService.addMember(user.societyId(), req));
    }

    @GetMapping
    public ResponseEntity<List<MemberResponse>> list(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(memberService.listMembers(user.societyId()));
    }

    @DeleteMapping("/{memberId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> deactivate(@AuthenticationPrincipal AuthenticatedUser user,
                                           @PathVariable UUID memberId) {
        memberService.deactivateMember(user.societyId(), memberId);
        return ResponseEntity.noContent().build();
    }
}
