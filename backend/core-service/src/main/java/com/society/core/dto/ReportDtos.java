package com.society.core.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class ReportDtos {

    public record CategoryAmount(String category, BigDecimal amount) {}

    public record ExpenseLine(
            LocalDate expenseDate,
            String category,
            String title,
            String billId,
            BigDecimal amount
    ) {}

    public record MonthlyReport(
            int year,
            int month,
            BigDecimal maintenanceCollected,
            BigDecimal maintenancePending,
            BigDecimal totalExpenses,
            BigDecimal netSurplusDeficit,
            List<CategoryAmount> expenseBreakdown,
            List<ExpenseLine> expenseLines
    ) {}

    public record AnnualBalanceSheet(
            int year,
            BigDecimal openingBalance,
            BigDecimal totalIncome,
            BigDecimal totalExpenses,
            BigDecimal closingBalance,
            BigDecimal pendingDues,
            List<MonthlySummaryLine> monthlyLines
    ) {}

    public record MonthlySummaryLine(
            int month,
            BigDecimal income,
            BigDecimal expenses,
            BigDecimal net
    ) {}
}
