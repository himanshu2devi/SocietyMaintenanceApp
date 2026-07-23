package com.society.core.dto;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;
import java.time.Instant;

public class MaintenanceDtos {

    /** Record a flat-wise maintenance collection (creates or marks a charge PAID). */
    public record RecordCollectionRequest(
            @NotBlank String flatNumber,
            @NotNull @Min(2000) @Max(2100) Integer billingYear,
            @NotNull @Min(1) @Max(12) Integer billingMonth,
            @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal amount,
            @NotBlank String paymentMode,
            String notes,
            String memberId,
            String transactionReference
    ) {}

    /** Create a charge for a flat and mark it as PENDING. */
    public record MarkPendingRequest(
            @NotBlank String flatNumber,
            @NotNull @Min(2000) @Max(2100) Integer billingYear,
            @NotNull @Min(1) @Max(12) Integer billingMonth,
            @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal amount,
            String notes,
            String memberId
    ) {}

    public record MaintenanceChargeResponse(
            String id,
            String flatNumber,
            String memberId,
            int billingYear,
            int billingMonth,
            BigDecimal amount,
            String status,
            String paymentMode,
            Instant paidAt,
            String notes,
            String transactionReference
    ) {}
}
