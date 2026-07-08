package com.society.core.dto;

import java.math.BigDecimal;
import java.util.List;

public class ReportDtos {

    public record CategoryAmount(String category, BigDecimal amount) {}

    public record MonthlyReport(
            int year,
            int month,
            BigDecimal maintenanceCollected,
            BigDecimal maintenancePending,
            BigDecimal totalExpenses,
            BigDecimal netSurplusDeficit,
            List<CategoryAmount> expenseBreakdown
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
