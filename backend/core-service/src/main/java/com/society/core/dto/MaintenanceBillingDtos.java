package com.society.core.dto;

import com.society.core.domain.MaintenanceBillingMode;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public class MaintenanceBillingDtos {

    public record BillingSettingsResponse(
            boolean configured,
            MaintenanceBillingMode billingMode,
            String configuredAt
    ) {}

    public record ChooseBillingModeRequest(
            @NotNull MaintenanceBillingMode billingMode
    ) {}

    public record MemberDefaultResponse(
            String id,
            String memberId,
            String flatNumber,
            BigDecimal amount,
            int effectiveFromYear,
            int effectiveFromMonth,
            String updatedAt
    ) {}

    public record UpsertMemberDefaultRequest(
            @NotBlank String memberId,
            @NotBlank String flatNumber,
            @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal amount,
            @NotNull @Min(2000) @Max(2100) Integer effectiveFromYear,
            @NotNull @Min(1) @Max(12) Integer effectiveFromMonth
    ) {}

    public record BulkUpsertMemberDefaultsRequest(
            @NotEmpty @Valid List<UpsertMemberDefaultRequest> defaults
    ) {}

    public record ResolvedAmountResponse(
            BigDecimal amount,
            boolean configured,
            MaintenanceBillingMode billingMode,
            String source,
            Integer effectiveFromYear,
            Integer effectiveFromMonth
    ) {}
}
