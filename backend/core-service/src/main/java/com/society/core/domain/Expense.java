package com.society.core.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "expenses",
        indexes = {
                @Index(name = "idx_expense_society_date", columnList = "society_id,expense_date"),
                @Index(name = "idx_expense_society_period", columnList = "society_id,fiscal_year,fiscal_month")
        })
public class Expense {

    @Id
    @GeneratedValue
    private UUID id;

    @Column(name = "society_id", nullable = false)
    private UUID societyId;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 1000)
    private String description;

    @Column(nullable = false, precision = 14, scale = 2)
    private BigDecimal amount;

    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate;

    @Column(name = "payment_mode", length = 30)
    private String paymentMode;

    @Column(name = "vendor_name", length = 150)
    private String vendorName;

    /** Invoice / bill reference from vendor; display "N/A" when blank. */
    @Column(name = "bill_id", length = 80)
    private String billId;

    @Column(name = "recorded_by", nullable = false)
    private UUID recordedBy;

    @Column(name = "fiscal_year", nullable = false)
    private int fiscalYear;

    @Column(name = "fiscal_month", nullable = false)
    private int fiscalMonth;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    @PreUpdate
    void deriveFiscalPeriod() {
        if (expenseDate != null) {
            this.fiscalYear = expenseDate.getYear();
            this.fiscalMonth = expenseDate.getMonthValue();
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getSocietyId() { return societyId; }
    public void setSocietyId(UUID societyId) { this.societyId = societyId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public String getPaymentMode() { return paymentMode; }
    public void setPaymentMode(String paymentMode) { this.paymentMode = paymentMode; }
    public String getVendorName() { return vendorName; }
    public void setVendorName(String vendorName) { this.vendorName = vendorName; }
    public String getBillId() { return billId; }
    public void setBillId(String billId) { this.billId = billId; }
    public UUID getRecordedBy() { return recordedBy; }
    public void setRecordedBy(UUID recordedBy) { this.recordedBy = recordedBy; }
    public int getFiscalYear() { return fiscalYear; }
    public void setFiscalYear(int fiscalYear) { this.fiscalYear = fiscalYear; }
    public int getFiscalMonth() { return fiscalMonth; }
    public void setFiscalMonth(int fiscalMonth) { this.fiscalMonth = fiscalMonth; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
