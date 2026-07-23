package com.society.core.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

/**
 * Timeline of per-member maintenance amounts when society uses VARIABLE billing.
 * Unique per (society, member, effective-from period) — same pattern as society rate schedules.
 * Historical maintenance_charges.amount is never rewritten when this changes.
 */
@Entity
@Table(name = "member_maintenance_defaults",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_member_maint_default_effective",
                columnNames = {"society_id", "member_id", "effective_from_year", "effective_from_month"}),
        indexes = {
                @Index(name = "idx_member_maint_society", columnList = "society_id"),
                @Index(name = "idx_member_maint_flat", columnList = "society_id,flat_number"),
                @Index(name = "idx_member_maint_effective",
                        columnList = "society_id,member_id,effective_from_year,effective_from_month")
        })
public class MemberMaintenanceDefault {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Column(name = "member_id", nullable = false)
    private UUID memberId;

    @Column(name = "flat_number", nullable = false, length = 40)
    private String flatNumber;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "effective_from_year", nullable = false, columnDefinition = "integer default 2000")
    private int effectiveFromYear = 2000;

    @Column(name = "effective_from_month", nullable = false, columnDefinition = "integer default 1")
    private int effectiveFromMonth = 1;

    @Column(name = "updated_by", nullable = false)
    private UUID updatedBy;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt = Instant.now();

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @PreUpdate
    void touch() {
        this.updatedAt = Instant.now();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSocietyId() { return societyId; }
    public void setSocietyId(UUID societyId) { this.societyId = societyId; }
    public UUID getMemberId() { return memberId; }
    public void setMemberId(UUID memberId) { this.memberId = memberId; }
    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public int getEffectiveFromYear() { return effectiveFromYear; }
    public void setEffectiveFromYear(int effectiveFromYear) { this.effectiveFromYear = effectiveFromYear; }
    public int getEffectiveFromMonth() { return effectiveFromMonth; }
    public void setEffectiveFromMonth(int effectiveFromMonth) { this.effectiveFromMonth = effectiveFromMonth; }
    public UUID getUpdatedBy() { return updatedBy; }
    public void setUpdatedBy(UUID updatedBy) { this.updatedBy = updatedBy; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
