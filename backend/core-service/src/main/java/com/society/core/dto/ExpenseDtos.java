package com.society.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.time.LocalDate;

public class ExpenseDtos {

    public record CreateExpenseRequest(
            @NotBlank String category,
            @NotBlank String title,
            String description,
            @NotNull @DecimalMin(value = "0.0", inclusive = false) BigDecimal amount,
            @NotNull LocalDate expenseDate,
            String paymentMode,
            String vendorName
    ) {}

    public record ExpenseResponse(
            String id,
            String category,
            String title,
            String description,
            BigDecimal amount,
            LocalDate expenseDate,
            String paymentMode,
            String vendorName
    ) {}
}
