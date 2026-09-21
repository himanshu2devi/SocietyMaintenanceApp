package com.society.identity.domain;

/**
 * SocietySimplify workspace subscription length after a successful Razorpay payment.
 * QUARTERLY = 3 months; SIX_MONTHS = 6 months; YEARLY = 12 months.
 */
public enum BillingPeriod {
    QUARTERLY,
    SIX_MONTHS,
    YEARLY
}
