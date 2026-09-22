package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public class ElectionDtos {

    /**
     * SocietySimplify records election administration and committee-declared results only.
     * No ballots are cast, stored or tallied by this service.
     */
    public static final boolean ELECTRONIC_VOTING_ENABLED = false;

    public static final String VOTING_NOTICE =
            "SocietySimplify supports election administration and results recording only. "
                    + "Electronic voting is not enabled — votes must be cast and counted offline by the society, "
                    + "and the committee records the outcome here.";

    public record UpsertElectionRequest(
            @NotBlank(message = "Title is required")
            @Size(min = 3, max = 200, message = "Title must be 3–200 characters")
            String title,
            @Size(max = 8000, message = "Description must be at most 8000 characters")
            String description,
            Instant nominationStart,
            Instant nominationEnd,
            Instant votingStart,
            Instant votingEnd
    ) {}

    public record UpsertPositionRequest(
            @NotBlank(message = "Position title is required")
            @Size(min = 2, max = 120, message = "Position title must be 2–120 characters")
            String title,
            Integer sortOrder
    ) {}

    public record UpsertCandidateRequest(
            @NotNull(message = "Position is required")
            UUID positionId,
            @NotBlank(message = "Candidate name is required")
            @Size(min = 2, max = 150, message = "Candidate name must be 2–150 characters")
            String fullName,
            @Size(max = 30, message = "Flat number must be at most 30 characters")
            String flatNumber,
            @Size(max = 4000, message = "Candidate profile must be at most 4000 characters")
            String profileText
    ) {}

    public record UpdateElectionStatusRequest(
            @NotBlank(message = "Status is required")
            String status
    ) {}

    public record PublishResultsRequest(
            List<UUID> winnerCandidateIds,
            @Size(max = 8000, message = "Result summary must be at most 8000 characters")
            String resultSummary
    ) {}

    public record ElectionPositionResponse(
            String id,
            String title,
            int sortOrder,
            List<ElectionCandidateResponse> candidates
    ) {}

    public record ElectionCandidateResponse(
            String id,
            String positionId,
            String fullName,
            String flatNumber,
            String profileText,
            boolean winner,
            Instant createdAt
    ) {}

    public record ElectionSummaryResponse(
            String id,
            String title,
            String description,
            String status,
            Instant nominationStart,
            Instant nominationEnd,
            Instant votingStart,
            Instant votingEnd,
            Instant createdAt,
            Instant updatedAt
    ) {}

    public record ElectionDetailResponse(
            String id,
            String title,
            String description,
            String status,
            Instant nominationStart,
            Instant nominationEnd,
            Instant votingStart,
            Instant votingEnd,
            String resultSummary,
            List<ElectionPositionResponse> positions,
            Instant createdAt,
            Instant updatedAt,
            boolean electronicVotingEnabled,
            String votingNotice
    ) {}
}
