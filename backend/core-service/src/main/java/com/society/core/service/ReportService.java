package com.society.core.service;

import com.society.core.domain.MaintenanceStatus;
import com.society.core.dto.ReportDtos.*;
import com.society.core.repository.ExpenseRepository;
import com.society.core.repository.MaintenanceChargeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ReportService {

    private final MaintenanceChargeRepository maintenanceRepository;
    private final ExpenseRepository expenseRepository;

    public ReportService(MaintenanceChargeRepository maintenanceRepository,
                         ExpenseRepository expenseRepository) {
        this.maintenanceRepository = maintenanceRepository;
        this.expenseRepository = expenseRepository;
    }

    @Transactional(readOnly = true)
    public MonthlyReport monthlyReport(UUID societyId, int year, int month) {
        BigDecimal collected = maintenanceRepository
                .sumByStatusForMonth(societyId, MaintenanceStatus.PAID, year, month);
        BigDecimal pending = maintenanceRepository
                .sumByStatusForMonth(societyId, MaintenanceStatus.PENDING, year, month);
        BigDecimal expenses = expenseRepository.sumForMonth(societyId, year, month);

        List<CategoryAmount> breakdown = expenseRepository
                .categoryBreakdownForMonth(societyId, year, month)
                .stream()
                .map(ct -> new CategoryAmount(ct.getCategory(), ct.getTotal()))
                .toList();

        return new MonthlyReport(
                year, month, collected, pending, expenses,
                collected.subtract(expenses), breakdown);
    }

    @Transactional(readOnly = true)
    public AnnualBalanceSheet annualBalanceSheet(UUID societyId, int year, BigDecimal openingBalance) {
        BigDecimal opening = openingBalance == null ? BigDecimal.ZERO : openingBalance;
        BigDecimal totalIncome = maintenanceRepository
                .sumByStatusForYear(societyId, MaintenanceStatus.PAID, year);
        BigDecimal totalExpenses = expenseRepository.sumForYear(societyId, year);
        BigDecimal pending = maintenanceRepository
                .sumByStatusForYear(societyId, MaintenanceStatus.PENDING, year);

        List<MonthlySummaryLine> lines = new ArrayList<>();
        for (int m = 1; m <= 12; m++) {
            BigDecimal income = maintenanceRepository
                    .sumByStatusForMonth(societyId, MaintenanceStatus.PAID, year, m);
            BigDecimal exp = expenseRepository.sumForMonth(societyId, year, m);
            lines.add(new MonthlySummaryLine(m, income, exp, income.subtract(exp)));
        }

        BigDecimal closing = opening.add(totalIncome).subtract(totalExpenses);
        return new AnnualBalanceSheet(
                year, opening, totalIncome, totalExpenses, closing, pending, lines);
    }
}
