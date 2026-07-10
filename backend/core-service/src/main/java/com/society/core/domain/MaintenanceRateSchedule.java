package com.society.core.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "maintenance_rate_schedules",
        uniqueConstraints = @UniqueConstraint(
                name = "uq_rate_society_effective",
                columnNames = {"society_id", "effective_from_year", "effective_from_month"}),
        indexes = @Index(name = "idx_rate_society_effective",
                columnList = "society_id,effective_from_year,effective_from_month"))
public class MaintenanceRateSchedule {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;

    @Column(name = "effective_from_year", nullable = false)
    private int effectiveFromYear;

    @Column(name = "effective_from_month", nullable = false)
    private int effectiveFromMonth;

    @Column(length = 500)
    private String notes;

    @Column(name = "created_by", nullable = false)
    private UUID createdBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSocietyId() { return societyId; }
    public void setSocietyId(UUID societyId) { this.societyId = societyId; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public int getEffectiveFromYear() { return effectiveFromYear; }
    public void setEffectiveFromYear(int effectiveFromYear) { this.effectiveFromYear = effectiveFromYear; }
    public int getEffectiveFromMonth() { return effectiveFromMonth; }
    public void setEffectiveFromMonth(int effectiveFromMonth) { this.effectiveFromMonth = effectiveFromMonth; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public UUID getCreatedBy() { return createdBy; }
    public void setCreatedBy(UUID createdBy) { this.createdBy = createdBy; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
