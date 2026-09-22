package com.society.core.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;

public class MeetingDtos {

    public record UpsertMeetingRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 200, message = "Title must be 3–200 characters")
            String title,
            @NotBlank(message = "Meeting type is required")
            String meetingType,
            @NotNull(message = "Meeting date is required")
            LocalDate meetingDate,
            @JsonFormat(pattern = "HH:mm[:ss]")
            LocalTime startTime,
            @Size(max = 250, message = "Location must be at most 250 characters")
            String location,
            @Size(max = 8000, message = "Agenda must be at most 8000 characters")
            String agenda,
            @Size(max = 8000, message = "Description must be at most 8000 characters")
            String description,
            @Size(max = 150, message = "Organizer must be at most 150 characters")
            String organizer,
            String status,
            @Size(max = 20000, message = "Minutes must be at most 20000 characters")
            String minutes,
            @Size(max = 500, message = "Attachment URL must be at most 500 characters")
            String attachmentUrl
    ) {}

    public record MeetingResponse(
            String id,
            String title,
            String meetingType,
            LocalDate meetingDate,
            @JsonFormat(pattern = "HH:mm:ss") LocalTime startTime,
            String location,
            String agenda,
            String description,
            String organizer,
            String status,
            String minutes,
            String attachmentUrl,
            String createdBy,
            Instant createdAt,
            Instant updatedAt
    ) {}
}
