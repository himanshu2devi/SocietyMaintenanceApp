package com.society.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public class MaintenanceRateDtos {

    public record UpsertMaintenanceRateRequest(
            @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal amount,
            @NotNull @Min(2000) @Max(2100) Integer effectiveFromYear,
            @NotNull @Min(1) @Max(12) Integer effectiveFromMonth,
            String notes
    ) {}

    public record MaintenanceRateResponse(
            String id,
            BigDecimal amount,
            int effectiveFromYear,
            int effectiveFromMonth,
            String notes,
            String createdAt
    ) {}

    public record EffectiveRateResponse(
            BigDecimal amount,
            Integer effectiveFromYear,
            Integer effectiveFromMonth,
            boolean configured
    ) {}
}
