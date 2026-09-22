package com.society.core.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parking_slots",
        uniqueConstraints = @UniqueConstraint(name = "uq_parking_slot_society_code",
                columnNames = {"society_id", "slot_code"}),
        indexes = @Index(name = "idx_parking_society", columnList = "society_id,category,status"))
public class ParkingSlot {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Column(name = "slot_code", nullable = false, length = 40)
    private String slotCode;

    /** COMMON or ASSIGNED. */
    @Column(nullable = false, length = 20)
    private String category = "ASSIGNED";

    @Column(name = "building_wing", length = 80)
    private String buildingWing;

    /** AVAILABLE, ASSIGNED or UNAVAILABLE. */
    @Column(nullable = false, length = 20)
    private String status = "AVAILABLE";

    @Column(length = 500)
    private String notes;

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
    public String getSlotCode() { return slotCode; }
    public void setSlotCode(String slotCode) { this.slotCode = slotCode; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getBuildingWing() { return buildingWing; }
    public void setBuildingWing(String buildingWing) { this.buildingWing = buildingWing; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
