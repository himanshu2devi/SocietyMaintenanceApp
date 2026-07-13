package com.society.core.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "complaints",
        indexes = {
                @Index(name = "idx_complaints_society_created", columnList = "society_id,created_at"),
                @Index(name = "idx_complaints_society_status", columnList = "society_id,status")
        })
public class Complaint {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Column(nullable = false, length = 250)
    private String title;

    @Column(nullable = false, length = 4000)
    private String description;

    @Column(nullable = false, length = 80)
    private String category = "General";

    @Column(nullable = false, length = 20)
    private String status = "OPEN";

    @Column(nullable = false, length = 20)
    private String priority = "NORMAL";

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_by_name", length = 150)
    private String createdByName;

    @Column(name = "created_by_role", length = 20)
    private String createdByRole;

    @Column(name = "flat_number", length = 30)
    private String flatNumber;

    @Column(name = "admin_notes", length = 2000)
    private String adminNotes;

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
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public String getCreatedByRole() { return createdByRole; }
    public void setCreatedByRole(String createdByRole) { this.createdByRole = createdByRole; }
    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }
    public String getAdminNotes() { return adminNotes; }
    public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
