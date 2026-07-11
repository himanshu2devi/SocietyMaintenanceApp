package com.society.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request/response payloads for authentication and registration.
 */
public class AuthDtos {

    public record RegisterSocietyRequest(
            @NotBlank String societyName,
            @NotBlank String societyCode,
            String address,
            String city,
            @NotBlank String adminName,
            @NotBlank @Email String adminEmail,
            @NotBlank String adminMobile,
            @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password
    ) {}

    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {}

    /** Resident self-signup into an existing society using the society code. */
    public record RegisterMemberRequest(
            @NotBlank String societyCode,
            @NotBlank String fullName,
            @NotBlank @Email String email,
            @NotBlank String mobile,
            @NotBlank String flatNumber,
            @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String password
    ) {}

    /**
     * Self-service password reset without email SMTP.
     * Verifies society code + email + mobile + flat number, then sets a new password.
     */
    public record ForgotPasswordRequest(
            @NotBlank String societyCode,
            @NotBlank @Email String email,
            @NotBlank String mobile,
            @NotBlank String flatNumber,
            @NotBlank @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
    ) {}

    public record MessageResponse(String message) {}

    public record AuthResponse(
            String token,
            String tokenType,
            UserView user
    ) {}

    public record UserView(
            String id,
            String societyId,
            String fullName,
            String email,
            String mobile,
            String flatNumber,
            String role
    ) {}
}
