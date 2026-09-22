package com.society.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public class EventDtos {

    public record UpsertEventRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 200, message = "Title must be 3–200 characters")
            String title,
            @Size(max = 4000, message = "Description must be at most 4000 characters")
            String description,
            @NotNull(message = "Event date is required")
            LocalDate eventDate,
            @JsonFormat(pattern = "HH:mm[:ss]")
            LocalTime startTime,
            @JsonFormat(pattern = "HH:mm[:ss]")
            LocalTime endTime,
            @Size(max = 250, message = "Location must be at most 250 characters")
            String location,
            @Size(max = 150, message = "Organizer must be at most 150 characters")
            String organizer,
            @Size(max = 500, message = "Image URL must be at most 500 characters")
            String imageUrl,
            String status
    ) {}

    public record EventResponse(
            String id,
            String title,
            String description,
            LocalDate eventDate,
            @JsonFormat(pattern = "HH:mm:ss") LocalTime startTime,
            @JsonFormat(pattern = "HH:mm:ss") LocalTime endTime,
            String location,
            String organizer,
            String imageUrl,
            String status,
            String createdBy,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
