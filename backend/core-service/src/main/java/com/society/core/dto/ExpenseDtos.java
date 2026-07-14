package com.society.core.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

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
            String vendorName,
            @NotBlank(message = "Bill ID is required (enter N/A if not available)")
            @Size(max = 80, message = "Bill ID must be at most 80 characters")
            String billId
    ) {}

    public record ExpenseResponse(
            String id,
            String category,
            String title,
            String description,
            BigDecimal amount,
            LocalDate expenseDate,
            String paymentMode,
            String vendorName,
            String billId
    ) {}
}
