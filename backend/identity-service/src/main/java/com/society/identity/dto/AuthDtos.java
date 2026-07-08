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
