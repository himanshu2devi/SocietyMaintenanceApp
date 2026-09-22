package com.society.core.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "election_candidates",
        indexes = @Index(name = "idx_election_candidates", columnList = "election_id,position_id"))
public class ElectionCandidate {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "election_id", nullable = false)
    private UUID electionId;

    @Column(name = "position_id", nullable = false)
    private UUID positionId;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "flat_number", length = 30)
    private String flatNumber;

    @Column(name = "profile_text", columnDefinition = "TEXT")
    private String profileText;

    /** Set by the committee when recording results; no electronic vote tallying is performed. */
    @Column(name = "is_winner", nullable = false)
    private boolean winner = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getElectionId() { return electionId; }
    public void setElectionId(UUID electionId) { this.electionId = electionId; }
    public UUID getPositionId() { return positionId; }
    public void setPositionId(UUID positionId) { this.positionId = positionId; }
    public UUID getSocietyId() { return societyId; }
    public void setSocietyId(UUID societyId) { this.societyId = societyId; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }
    public String getProfileText() { return profileText; }
    public void setProfileText(String profileText) { this.profileText = profileText; }
    public boolean isWinner() { return winner; }
    public void setWinner(boolean winner) { this.winner = winner; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
