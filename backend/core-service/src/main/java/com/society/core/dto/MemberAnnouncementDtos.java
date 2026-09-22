package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public class MemberAnnouncementDtos {

    public record SubmitAnnouncementRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 200, message = "Title must be 3–200 characters")
            String title,
            @NotBlank(message = "Announcement text is required")
            @Size(min = 3, max = 4000, message = "Announcement text must be 3–4000 characters")
            String body,
            UUID relatedEventId
    ) {}

    public record ReviewAnnouncementRequest(
            @Size(max = 500, message = "Review note must be at most 500 characters")
            String reviewNote
    ) {}

    public record MemberAnnouncementResponse(
            String id,
            String title,
            String body,
            String relatedEventId,
            String status,
            String authorUserId,
            String authorName,
            String authorFlatNumber,
            String reviewerUserId,
            String reviewNote,
            Instant reviewedAt,
            Instant createdAt,
            Instant updatedAt,
            boolean editable
    ) {}

    public record PendingCountResponse(long pending) {}
}
