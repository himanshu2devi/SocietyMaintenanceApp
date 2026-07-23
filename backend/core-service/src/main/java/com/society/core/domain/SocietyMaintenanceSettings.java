package com.society.core.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

/**
 * One row per society. Choosing SAME vs VARIABLE is a one-time committee setup.
 * Existing societies without a row are treated as SAME (backward compatible).
 */
@Entity
@Table(name = "society_maintenance_settings",
        uniqueConstraints = @UniqueConstraint(name = "uq_maint_settings_society", columnNames = "society_id"))
public class SocietyMaintenanceSettings {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Enumerated(EnumType.STRING)
    @Column(name = "billing_mode", nullable = false, length = 20)
    private MaintenanceBillingMode billingMode = MaintenanceBillingMode.SAME;

    @Column(name = "configured_at", nullable = false)
    private Instant configuredAt = Instant.now();

    @Column(name = "configured_by", nullable = false)
    private UUID configuredBy;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSocietyId() { return societyId; }
    public void setSocietyId(UUID societyId) { this.societyId = societyId; }
    public MaintenanceBillingMode getBillingMode() { return billingMode; }
    public void setBillingMode(MaintenanceBillingMode billingMode) { this.billingMode = billingMode; }
    public Instant getConfiguredAt() { return configuredAt; }
    public void setConfiguredAt(Instant configuredAt) { this.configuredAt = configuredAt; }
    public UUID getConfiguredBy() { return configuredBy; }
    public void setConfiguredBy(UUID configuredBy) { this.configuredBy = configuredBy; }
}
