package com.society.core.domain;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "parking_assignments",
        indexes = {
                @Index(name = "idx_parking_assign_society", columnList = "society_id,active"),
                @Index(name = "idx_parking_assign_slot", columnList = "slot_id,active"),
                @Index(name = "idx_parking_assign_member", columnList = "society_id,member_user_id,active")
        })
public class ParkingAssignment {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Column(name = "slot_id", nullable = false)
    private UUID slotId;

    @Column(name = "member_user_id")
    private UUID memberUserId;

    @Column(name = "member_name", length = 150)
    private String memberName;

    @Column(name = "flat_number", length = 30)
    private String flatNumber;

    @Column(name = "vehicle_number", length = 40)
    private String vehicleNumber;

    @Column(name = "vehicle_type", length = 40)
    private String vehicleType;

    @Column(nullable = false)
    private boolean active = true;

    @Column(name = "assigned_at", nullable = false, updatable = false)
    private Instant assignedAt = Instant.now();

    @Column(name = "unassigned_at")
    private Instant unassignedAt;

    @Column(length = 500)
    private String notes;

    @Column(name = "assigned_by", nullable = false)
    private UUID assignedBy;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSocietyId() { return societyId; }
    public void setSocietyId(UUID societyId) { this.societyId = societyId; }
    public UUID getSlotId() { return slotId; }
    public void setSlotId(UUID slotId) { this.slotId = slotId; }
    public UUID getMemberUserId() { return memberUserId; }
    public void setMemberUserId(UUID memberUserId) { this.memberUserId = memberUserId; }
    public String getMemberName() { return memberName; }
    public void setMemberName(String memberName) { this.memberName = memberName; }
    public String getFlatNumber() { return flatNumber; }
    public void setFlatNumber(String flatNumber) { this.flatNumber = flatNumber; }
    public String getVehicleNumber() { return vehicleNumber; }
    public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
    public String getVehicleType() { return vehicleType; }
    public void setVehicleType(String vehicleType) { this.vehicleType = vehicleType; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Instant getAssignedAt() { return assignedAt; }
    public void setAssignedAt(Instant assignedAt) { this.assignedAt = assignedAt; }
    public Instant getUnassignedAt() { return unassignedAt; }
    public void setUnassignedAt(Instant unassignedAt) { this.unassignedAt = unassignedAt; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public UUID getAssignedBy() { return assignedBy; }
    public void setAssignedBy(UUID assignedBy) { this.assignedBy = assignedBy; }
}
