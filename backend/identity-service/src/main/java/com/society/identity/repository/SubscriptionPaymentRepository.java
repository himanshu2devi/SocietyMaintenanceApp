package com.society.identity.repository;

import com.society.identity.domain.PaymentStatus;
import com.society.identity.domain.SubscriptionPayment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.Collection;
import java.util.Optional;
import java.util.UUID;

public interface SubscriptionPaymentRepository extends JpaRepository<SubscriptionPayment, UUID> {

    Optional<SubscriptionPayment> findByRazorpayOrderId(String razorpayOrderId);

    Optional<SubscriptionPayment> findByRazorpayPaymentId(String razorpayPaymentId);

    boolean existsByRazorpayPaymentIdAndStatus(String razorpayPaymentId, PaymentStatus status);

    @Query("SELECT COUNT(p) FROM SubscriptionPayment p WHERE p.status IN :statuses")
    long countByStatusIn(Collection<PaymentStatus> statuses);
}
