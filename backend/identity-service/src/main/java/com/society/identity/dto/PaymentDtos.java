package com.society.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PaymentDtos {

    public record SubscriptionPricingResponse(
            boolean enabled,
            String keyId,
            long amountPaise,
            String amountDisplay,
            String currency,
            int listPriceRupees,
            int offerPriceRupees,
            int earlyBirdLimit,
            long earlyBirdRemaining,
            boolean earlyBirdActive,
            String planLabel,
            String billingPeriod,
            String note
    ) {}

    public record CreateOrderRequest(
            @NotBlank(message = "Society name is required")
            @Size(min = 2, max = 150)
            String societyName,
            @NotBlank(message = "Society code is required")
            @Size(min = 2, max = 40)
            @Pattern(regexp = "^[A-Za-z0-9][A-Za-z0-9_-]*$", message = "Society code may use letters, numbers, hyphen and underscore")
            String societyCode,
            @NotBlank(message = "Full name is required")
            @Size(min = 2, max = 120)
            String adminName,
            @NotBlank(message = "Email is required")
            @Email(message = "Enter a valid email address")
            String adminEmail
    ) {}

    public record CreateOrderResponse(
            String keyId,
            String orderId,
            long amountPaise,
            String amountDisplay,
            String currency,
            String receiptNumber,
            int listPriceRupees,
            int offerPriceRupees,
            boolean earlyBirdActive,
            String planLabel
    ) {}
}
