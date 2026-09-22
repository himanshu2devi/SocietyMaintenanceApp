package com.society.identity.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Responses for the SocietySimplify platform-owner console.
 * Never include passwords, hashes, tokens, or payment secrets.
 */
public class PlatformAdminDtos {

    public record PageResponse<T>(
            List<T> content,
            int page,
            int size,
            long totalElements,
            int totalPages,
            boolean first,
            boolean last
    ) {}

    public record DashboardResponse(
            long totalSocieties,
            long activeSocieties,
            long inactiveSocieties,
            long totalUsers,
            long totalMembers,
            long totalAdmins,
            long platformAdmins,
            long paidSubscriptions,
            Instant generatedAt
    ) {}

    public record StatsResponse(
            long totalSocieties,
            long activeSocieties,
            long inactiveSocieties,
            long totalUsers,
            long totalMembers,
            long totalAdmins,
            long activeUsers,
            long inactiveUsers,
            long subscriptionPaymentsCreated,
            long subscriptionPaymentsPaid,
            Instant generatedAt
    ) {}

    public record SocietyRow(
            UUID id,
            String societyCode,
            String name,
            String address,
            String city,
            String billingPeriod,
            Instant subscriptionExpiresAt,
            boolean subscriptionActive,
            Instant createdAt,
            long memberCount,
            long adminCount
    ) {}

    public record UserRow(
            UUID id,
            String fullName,
            String email,
            String mobile,
            String flatNumber,
            String role,
            boolean active,
            Instant createdAt,
            UUID societyId,
            String societyName,
            String societyCode
    ) {}

    public record SubscriptionRow(
            UUID id,
            String societyCode,
            String societyName,
            UUID societyId,
            String adminEmail,
            String adminName,
            String billingPeriod,
            long amountPaise,
            String currency,
            String status,
            Instant paidAt,
            Instant createdAt,
            Instant subscriptionExpiresAt,
            boolean societySubscriptionActive
    ) {}
}
