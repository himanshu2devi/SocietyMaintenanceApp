package com.society.core.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * Election administration record. SocietySimplify records nominations, candidates and
 * committee-declared results only; it deliberately does not run electronic voting.
 */
@Entity
@Table(name = "society_elections",
        indexes = @Index(name = "idx_elections_society", columnList = "society_id,status"))
public class SocietyElection {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "nomination_start")
    private Instant nominationStart;

    @Column(name = "nomination_end")
    private Instant nominationEnd;

    @Column(name = "voting_start")
    private Instant votingStart;

    @Column(name = "voting_end")
    private Instant votingEnd;

    /** DRAFT, NOMINATIONS_OPEN, VOTING_OPEN, CLOSED or RESULTS_PUBLISHED. */
    @Column(nullable = false, length = 30)
    private String status = "DRAFT";

    @Column(name = "result_summary", columnDefinition = "TEXT")
    private String resultSummary;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @PreUpdate
    void onUpdate() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSocietyId() { return societyId; }
    public void setSocietyId(UUID societyId) { this.societyId = societyId; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Instant getNominationStart() { return nominationStart; }
    public void setNominationStart(Instant nominationStart) { this.nominationStart = nominationStart; }
    public Instant getNominationEnd() { return nominationEnd; }
    public void setNominationEnd(Instant nominationEnd) { this.nominationEnd = nominationEnd; }
    public Instant getVotingStart() { return votingStart; }
    public void setVotingStart(Instant votingStart) { this.votingStart = votingStart; }
    public Instant getVotingEnd() { return votingEnd; }
    public void setVotingEnd(Instant votingEnd) { this.votingEnd = votingEnd; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getResultSummary() { return resultSummary; }
    public void setResultSummary(String resultSummary) { this.resultSummary = resultSummary; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
