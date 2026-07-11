package com.society.identity.web;

import com.society.identity.dto.AuthDtos.*;
import com.society.identity.security.AuthenticatedUser;
import com.society.identity.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterSocietyRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerSociety(req));
    }

    @PostMapping("/register-member")
    public ResponseEntity<AuthResponse> registerMember(@Valid @RequestBody RegisterMemberRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(authService.registerMember(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest req) {
        return ResponseEntity.ok(authService.resetPasswordWithIdentity(req));
    }

    @GetMapping("/me")
    public ResponseEntity<AuthenticatedUser> me(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(user);
    }
}
