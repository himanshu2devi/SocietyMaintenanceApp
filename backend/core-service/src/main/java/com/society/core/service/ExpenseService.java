package com.society.core.service;

import com.society.core.domain.Expense;
import com.society.core.dto.ExpenseDtos.*;
import com.society.core.repository.ExpenseRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class ExpenseService {

    private final ExpenseRepository repository;

    public ExpenseService(ExpenseRepository repository) {
        this.repository = repository;
    }

    @Transactional
    public ExpenseResponse create(UUID societyId, UUID recordedBy, CreateExpenseRequest req) {
        Expense e = new Expense();
        e.setSocietyId(societyId);
        e.setCategory(req.category());
        e.setTitle(req.title());
        e.setDescription(req.description());
        e.setAmount(req.amount());
        e.setExpenseDate(req.expenseDate());
        e.setPaymentMode(req.paymentMode() == null ? "CASH" : req.paymentMode());
        e.setVendorName(req.vendorName());
        e.setRecordedBy(recordedBy);
        return toResponse(repository.save(e));
    }

    @Transactional(readOnly = true)
    public List<ExpenseResponse> list(UUID societyId) {
        return repository.findBySocietyIdOrderByExpenseDateDesc(societyId)
                .stream().map(ExpenseService::toResponse).toList();
    }

    static ExpenseResponse toResponse(Expense e) {
        return new ExpenseResponse(
                e.getId().toString(),
                e.getCategory(),
                e.getTitle(),
                e.getDescription(),
                e.getAmount(),
                e.getExpenseDate(),
                e.getPaymentMode(),
                e.getVendorName()
        );
    }
}
