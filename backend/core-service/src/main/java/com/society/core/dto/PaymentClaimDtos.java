package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;

import java.math.BigDecimal;
import java.time.Instant;

public class PaymentClaimDtos {

    /**
     * Submit with either chargeId, or billingYear + billingMonth (creates pending charge if needed).
     */
    public record SubmitPaymentClaimRequest(
            String chargeId,
            Integer billingYear,
            Integer billingMonth,
            @NotBlank String paymentMode,
            String referenceNumber,
            String notes
    ) {}

    public record ReviewPaymentClaimRequest(
            @NotBlank String decision,
            String reviewNotes,
            String paymentMode
    ) {}

    public record PaymentClaimResponse(
            String id,
            String chargeId,
            String memberId,
            String memberName,
            String flatNumber,
            BigDecimal amount,
            String paymentMode,
            String referenceNumber,
            String notes,
            String status,
            String reviewNotes,
            Integer billingYear,
            Integer billingMonth,
            Instant createdAt,
            Instant reviewedAt
    ) {}
}
