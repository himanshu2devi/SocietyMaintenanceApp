package com.society.identity.dto;

import jakarta.validation.constraints.NotBlank;

public class MemberDtos {

    public record AddMemberRequest(
            @NotBlank String fullName,
            @NotBlank String flatNumber,
            @NotBlank String mobile,
            String email,
            String password
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
