package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;

import java.time.Instant;

public class ContentDtos {

    public record CreateNoticeRequest(
            @NotBlank String title,
            @NotBlank String body,
            String priority
    ) {}

    public record NoticeResponse(
            String id,
            String title,
            String body,
            String priority,
            String createdByName,
            Instant createdAt
    ) {}

    public record CreateRuleRequest(
            @NotBlank String category,
            @NotBlank String title,
            @NotBlank String ruleText
    ) {}

    public record RuleResponse(
            String id,
            String category,
            String title,
            String ruleText,
            Instant createdAt
    ) {}
}
