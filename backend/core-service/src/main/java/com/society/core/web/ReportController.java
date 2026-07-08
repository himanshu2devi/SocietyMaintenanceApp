package com.society.core.web;

import com.society.core.dto.ReportDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.service.ReportService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/v1/reports")
public class ReportController {

    private final ReportService service;

    public ReportController(ReportService service) {
        this.service = service;
    }

    @GetMapping("/monthly")
    public ResponseEntity<MonthlyReport> monthly(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam int year,
            @RequestParam int month) {
        return ResponseEntity.ok(service.monthlyReport(user.societyId(), year, month));
    }

    @GetMapping("/annual")
    public ResponseEntity<AnnualBalanceSheet> annual(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam int year,
            @RequestParam(required = false) BigDecimal openingBalance) {
        return ResponseEntity.ok(service.annualBalanceSheet(user.societyId(), year, openingBalance));
    }
}
