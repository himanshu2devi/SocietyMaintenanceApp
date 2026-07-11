package com.society.identity.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class MemberDtos {

    public record AddMemberRequest(
            @NotBlank String fullName,
            @NotBlank String flatNumber,
            @NotBlank String mobile,
            String email,
            String password
    ) {}

    public record UpdateMemberRequest(
            @NotBlank String fullName,
            @NotBlank String flatNumber,
            @NotBlank String mobile,
            String email
    ) {}

    /** If newPassword is blank, password is reset to the member's mobile number. */
    public record ResetMemberPasswordRequest(
            @Size(min = 6, message = "Password must be at least 6 characters") String newPassword
    ) {}

    public record ResetMemberPasswordResponse(
            String memberId,
            String fullName,
            String email,
            String temporaryPassword,
            String message
    ) {}

    public record MemberResponse(
            String id,
            String fullName,
            String flatNumber,
            String mobile,
            String email,
            String role,
            boolean active
    ) {}
}
