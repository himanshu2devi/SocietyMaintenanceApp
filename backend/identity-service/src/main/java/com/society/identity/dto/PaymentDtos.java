package com.society.identity.dto;

import com.society.identity.domain.BillingPeriod;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class PaymentDtos {

    /** Public config — no list prices; amount is agreed offline then entered at checkout. */
    public record SubscriptionPricingResponse(
            boolean enabled,
            String keyId,
            String currency,
            long minAmountPaise,
            long maxAmountPaise,
            String planLabel,
            String note,
            String contactPath
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
            String adminEmail,
            @NotNull(message = "Agreed amount is required")
            @Min(value = 100, message = "Amount must be at least ₹1")
            @Max(value = 50_000_000, message = "Amount looks too high — contact SocietySimplify support")
            Long amountPaise,
            @NotNull(message = "Select a plan: 3 months, 6 months, or 1 year")
            BillingPeriod billingPeriod
    ) {}

    public record CreateRenewalOrderRequest(
            @NotBlank(message = "Society code is required")
            @Size(min = 2, max = 40)
            String societyCode,
            @NotBlank(message = "Admin email is required")
            @Email
            String adminEmail,
            @NotNull(message = "Agreed amount is required")
            @Min(value = 100, message = "Amount must be at least ₹1")
            @Max(value = 50_000_000, message = "Amount looks too high — contact SocietySimplify support")
            Long amountPaise,
            @NotNull(message = "Select a plan: 3 months, 6 months, or 1 year")
            BillingPeriod billingPeriod
    ) {}

    public record CreateOrderResponse(
            String keyId,
            String orderId,
            long amountPaise,
            String amountDisplay,
            String currency,
            String receiptNumber,
            BillingPeriod billingPeriod,
            String planLabel
    ) {}

    public record ContactEnquiryRequest(
            @NotBlank(message = "Name is required")
            @Size(min = 2, max = 120)
            String name,
            @NotBlank(message = "Email is required")
            @Email
            String email,
            @NotBlank(message = "Mobile number is required")
            @Pattern(regexp = "^[6-9]\\d{9}$", message = "Enter a valid 10-digit Indian mobile number")
            String mobile,
            @Size(max = 150)
            String societyName,
            @Size(max = 80)
            String city,
            @Size(max = 40)
            String preferredPeriod,
            @NotBlank(message = "Tell us your requirements")
            @Size(min = 10, max = 2000)
            String message
    ) {}

    public record MessageResponse(String message) {}
}
