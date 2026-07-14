package com.society.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Request/response payloads for authentication and registration.
 */
public class AuthDtos {

    public record RegisterSocietyRequest(
            @NotBlank(message = "Society name is required")
            @Size(min = 2, max = 150, message = "Society name must be 2–150 characters")
            String societyName,
            @NotBlank(message = "Society code is required")
            @Size(min = 2, max = 40, message = "Society code must be 2–40 characters")
            @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9_-]*$", message = "Society code may use letters, numbers, hyphen and underscore")
            String societyCode,
            @Size(max = 250, message = "Address is too long")
            String address,
            @Size(max = 100, message = "City is too long")
            String city,
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 120, message = "Full name must be 2–120 characters")
            String adminName,
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String adminEmail,
            @NotBlank(message = "Mobile number is required")
            @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String adminMobile,
            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8–72 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,72}$",
                    message = "Password must include uppercase, lowercase, a number, and a symbol"
            )
            String password,
            @NotBlank(message = "Complete payment before creating your workspace")
            String razorpayOrderId,
            @NotBlank(message = "Complete payment before creating your workspace")
            String razorpayPaymentId,
            @NotBlank(message = "Complete payment before creating your workspace")
            String razorpaySignature
    ) {}

    public record LoginRequest(
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,
            @NotBlank(message = "Password is required")
            String password
    ) {}

    /** Resident self-signup into an existing society using the society code. */
    public record RegisterMemberRequest(
            @NotBlank(message = "Society code is required")
            @Size(min = 2, max = 40, message = "Society code must be 2–40 characters")
            String societyCode,
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 120, message = "Full name must be 2–120 characters")
            String fullName,
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,
            @NotBlank(message = "Mobile number is required")
            @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String mobile,
            @NotBlank(message = "Flat number is required")
            @Size(min = 1, max = 30, message = "Flat number must be 1–30 characters")
            String flatNumber,
            @NotBlank(message = "Password is required")
            @Size(min = 8, max = 72, message = "Password must be 8–72 characters")
            @Pattern(
                    regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).{8,72}$",
                    message = "Password must include uppercase, lowercase, a number, and a symbol"
            )
            String password
    ) {}

    /**
     * Self-service password reset without email SMTP.
     * Verifies society code + email + mobile + flat number, then sets a new password.
     */
    public record ForgotPasswordRequest(
            @NotBlank(message = "Society code is required")
            String societyCode,
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String email,
            @NotBlank(message = "Mobile number is required")
            @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String mobile,
            @NotBlank(message = "Flat number is required")
            String flatNumber,
            @NotBlank(message = "New password is required")
            @Size(min = 6, max = 72, message = "Password must be 6–72 characters")
            String newPassword
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
            String societyName,
            String societyCode,
            String fullName,
            String email,
            String mobile,
            String flatNumber,
            String role
    ) {}
}
