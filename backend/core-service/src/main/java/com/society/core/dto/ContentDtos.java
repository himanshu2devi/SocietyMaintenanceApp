package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class ContentDtos {

    public record CreateNoticeRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 250, message = "Title must be 3–250 characters")
            String title,
            @NotBlank(message = "Message is required")
            @Size(min = 3, max = 4000, message = "Message must be 3–4000 characters")
            String body,
            String priority
    ) {}

    public record UpdateNoticeRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 250, message = "Title must be 3–250 characters")
            String title,
            @NotBlank(message = "Message is required")
            @Size(min = 3, max = 4000, message = "Message must be 3–4000 characters")
            String body,
            String priority
    ) {}

    public record NoticeResponse(
            String id,
            String title,
            String body,
            String priority,
            String createdByName,
            Instant createdAt,
            Instant notifiedAt,
            boolean unread
    ) {}

    public record UnreadNoticesResponse(long count) {}

    public record CreateRuleRequest(
            @NotBlank(message = "Category is required")
            @Size(min = 2, max = 80, message = "Category must be 2–80 characters")
            String category,
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 250, message = "Title must be 3–250 characters")
            String title,
            @NotBlank(message = "Rule text is required")
            @Size(min = 3, max = 4000, message = "Rule text must be 3–4000 characters")
            String ruleText
    ) {}

    public record UpdateRuleRequest(
            @NotBlank(message = "Category is required")
            @Size(min = 2, max = 80, message = "Category must be 2–80 characters")
            String category,
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 250, message = "Title must be 3–250 characters")
            String title,
            @NotBlank(message = "Rule text is required")
            @Size(min = 3, max = 4000, message = "Rule text must be 3–4000 characters")
            String ruleText
    ) {}

    public record RuleResponse(
            String id,
            String category,
            String title,
            String ruleText,
            Instant createdAt
    ) {}
}
