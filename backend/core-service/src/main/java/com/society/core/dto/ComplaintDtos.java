package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;

public class ComplaintDtos {

    public record CreateComplaintRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 250, message = "Title must be 3–250 characters")
            String title,
            @NotBlank(message = "Description is required")
            @Size(min = 3, max = 4000, message = "Description must be 3–4000 characters")
            String description,
            @Size(max = 80, message = "Category must be at most 80 characters")
            String category,
            String priority
    ) {}

    public record UpdateComplaintRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 250, message = "Title must be 3–250 characters")
            String title,
            @NotBlank(message = "Description is required")
            @Size(min = 3, max = 4000, message = "Description must be 3–4000 characters")
            String description,
            @Size(max = 80, message = "Category must be at most 80 characters")
            String category,
            String priority,
            String status,
            @Size(max = 2000, message = "Admin notes must be at most 2000 characters")
            String adminNotes
    ) {}

    public record ComplaintResponse(
            String id,
            String title,
            String description,
            String category,
            String status,
            String priority,
            String createdBy,
            String createdByName,
            String createdByRole,
            String flatNumber,
            String adminNotes,
            Instant createdAt,
            Instant updatedAt,
            boolean editable
    ) {}
}
