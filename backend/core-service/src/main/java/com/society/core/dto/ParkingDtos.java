package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.UUID;

public class ParkingDtos {

    public record UpsertParkingSlotRequest(
            @NotBlank(message = "Slot code is required")
            @Size(max = 40, message = "Slot code must be at most 40 characters")
            String slotCode,
            @NotBlank(message = "Category is required")
            String category,
            @Size(max = 80, message = "Building / wing must be at most 80 characters")
            String buildingWing,
            String status,
            @Size(max = 500, message = "Notes must be at most 500 characters")
            String notes
    ) {}

    public record AssignParkingSlotRequest(
            UUID memberUserId,
            @Size(max = 150, message = "Member name must be at most 150 characters")
            String memberName,
            @Size(max = 30, message = "Flat number must be at most 30 characters")
            String flatNumber,
            @Size(max = 40, message = "Vehicle number must be at most 40 characters")
            String vehicleNumber,
            @Size(max = 40, message = "Vehicle type must be at most 40 characters")
            String vehicleType,
            @Size(max = 500, message = "Notes must be at most 500 characters")
            String notes,
            /** When true an existing active assignment is released before the new one is created. */
            Boolean replaceExisting
    ) {}

    public record UnassignParkingSlotRequest(
            @Size(max = 500, message = "Notes must be at most 500 characters")
            String notes
    ) {}

    public record ParkingSlotResponse(
            String id,
            String slotCode,
            String category,
            String buildingWing,
            String status,
            String notes,
            ParkingAssignmentResponse activeAssignment,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ParkingAssignmentResponse(
            String id,
            String slotId,
            String slotCode,
            String memberUserId,
            String memberName,
            String flatNumber,
            String vehicleNumber,
            String vehicleType,
            boolean active,
            Instant assignedAt,
            Instant unassignedAt,
            String notes
    ) {}
}
