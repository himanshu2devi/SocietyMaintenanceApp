package com.society.core.repository;

import com.society.core.domain.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    List<Expense> findBySocietyIdOrderByExpenseDateDesc(UUID societyId);

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
            WHERE e.societyId = :societyId AND e.fiscalYear = :year AND e.fiscalMonth = :month
            """)
    BigDecimal sumForMonth(@Param("societyId") UUID societyId,
                           @Param("year") int year,
                           @Param("month") int month);

    @Query("""
            SELECT COALESCE(SUM(e.amount), 0) FROM Expense e
            WHERE e.societyId = :societyId AND e.fiscalYear = :year
            """)
    BigDecimal sumForYear(@Param("societyId") UUID societyId, @Param("year") int year);

    @Query("""
            SELECT e.category AS category, COALESCE(SUM(e.amount), 0) AS total
            FROM Expense e
            WHERE e.societyId = :societyId AND e.fiscalYear = :year AND e.fiscalMonth = :month
            GROUP BY e.category ORDER BY SUM(e.amount) DESC
            """)
    List<CategoryTotal> categoryBreakdownForMonth(@Param("societyId") UUID societyId,
                                                  @Param("year") int year,
                                                  @Param("month") int month);

    interface CategoryTotal {
        String getCategory();
        BigDecimal getTotal();
    }
}
