package com.society.identity.service;

import com.society.identity.domain.PaymentStatus;
import com.society.identity.domain.Role;
import com.society.identity.domain.Society;
import com.society.identity.domain.SubscriptionPayment;
import com.society.identity.domain.User;
import com.society.identity.dto.PlatformAdminDtos.*;
import com.society.identity.repository.SocietyRepository;
import com.society.identity.repository.SubscriptionPaymentRepository;
import com.society.identity.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.Instant;
import java.util.EnumSet;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class PlatformAdminService {

    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final SubscriptionPaymentRepository subscriptionPaymentRepository;

    public PlatformAdminService(SocietyRepository societyRepository,
                                UserRepository userRepository,
                                SubscriptionPaymentRepository subscriptionPaymentRepository) {
        this.societyRepository = societyRepository;
        this.userRepository = userRepository;
        this.subscriptionPaymentRepository = subscriptionPaymentRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse dashboard() {
        Instant now = Instant.now();
        List<Society> societies = societyRepository.findAll();
        long active = societies.stream().filter(Society::isSubscriptionActive).count();
        long inactive = societies.size() - active;
        long members = userRepository.countByRole(Role.MEMBER);
        long admins = userRepository.countByRole(Role.ADMIN);
        long platformAdmins = userRepository.countByRole(Role.PLATFORM_ADMIN);
        long paid = subscriptionPaymentRepository.countByStatusIn(EnumSet.of(PaymentStatus.PAID));
        return new DashboardResponse(
                societies.size(),
                active,
                inactive,
                userRepository.count(),
                members,
                admins,
                platformAdmins,
                paid,
                now
        );
    }

    @Transactional(readOnly = true)
    public StatsResponse stats() {
        Instant now = Instant.now();
        List<Society> societies = societyRepository.findAll();
        long active = societies.stream().filter(Society::isSubscriptionActive).count();
        return new StatsResponse(
                societies.size(),
                active,
                societies.size() - active,
                userRepository.count(),
                userRepository.countByRole(Role.MEMBER),
                userRepository.countByRole(Role.ADMIN),
                userRepository.countByActiveTrue(),
                userRepository.countByActiveFalse(),
                subscriptionPaymentRepository.count(),
                subscriptionPaymentRepository.countByStatusIn(EnumSet.of(PaymentStatus.PAID)),
                now
        );
    }

    @Transactional(readOnly = true)
    public PageResponse<SocietyRow> societies(String q, int page, int size) {
        PageRequest pr = pageRequest(page, size, "createdAt");
        Page<Society> result;
        if (StringUtils.hasText(q)) {
            String term = q.trim().toLowerCase();
            result = societyRepository.search(term, pr);
        } else {
            result = societyRepository.findAll(pr);
        }
        List<Society> content = result.getContent();
        Map<UUID, long[]> counts = memberAdminCounts(content.stream().map(Society::getId).toList());
        List<SocietyRow> rows = content.stream()
                .map(s -> {
                    long[] c = counts.getOrDefault(s.getId(), new long[]{0, 0});
                    return new SocietyRow(
                            s.getId(),
                            s.getSocietyCode(),
                            s.getName(),
                            s.getAddress(),
                            s.getCity(),
                            s.getBillingPeriod() == null ? null : s.getBillingPeriod().name(),
                            s.getSubscriptionExpiresAt(),
                            s.isSubscriptionActive(),
                            s.getCreatedAt(),
                            c[0],
                            c[1]
                    );
                })
                .toList();
        return pageResponse(rows, result);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserRow> users(String q, String role, int page, int size) {
        PageRequest pr = pageRequest(page, size, "createdAt");
        Role roleFilter = null;
        if (StringUtils.hasText(role)) {
            try {
                roleFilter = Role.valueOf(role.trim().toUpperCase());
            } catch (IllegalArgumentException ignored) {
                roleFilter = null;
            }
        }
        String term = StringUtils.hasText(q) ? q.trim().toLowerCase() : null;
        Page<User> result = userRepository.searchForPlatform(term, roleFilter, pr);
        Map<UUID, Society> societies = societyRepository.findAllById(
                        result.getContent().stream()
                                .map(User::getSocietyId)
                                .filter(id -> id != null)
                                .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Society::getId, s -> s));
        List<UserRow> rows = result.getContent().stream()
                .map(u -> {
                    Society s = u.getSocietyId() == null ? null : societies.get(u.getSocietyId());
                    return new UserRow(
                            u.getId(),
                            u.getFullName(),
                            u.getEmail(),
                            u.getMobile(),
                            u.getFlatNumber(),
                            u.getRole().name(),
                            u.isActive(),
                            u.getCreatedAt(),
                            u.getSocietyId(),
                            s != null ? s.getName() : null,
                            s != null ? s.getSocietyCode() : null
                    );
                })
                .toList();
        return pageResponse(rows, result);
    }

    @Transactional(readOnly = true)
    public PageResponse<SubscriptionRow> subscriptions(String q, int page, int size) {
        PageRequest pr = pageRequest(page, size, "createdAt");
        Page<SubscriptionPayment> result;
        if (StringUtils.hasText(q)) {
            result = subscriptionPaymentRepository.search(q.trim().toLowerCase(), pr);
        } else {
            result = subscriptionPaymentRepository.findAll(pr);
        }
        Map<UUID, Society> societies = societyRepository.findAllById(
                        result.getContent().stream()
                                .map(SubscriptionPayment::getSocietyId)
                                .filter(id -> id != null)
                                .collect(Collectors.toSet()))
                .stream()
                .collect(Collectors.toMap(Society::getId, s -> s));
        List<SubscriptionRow> rows = result.getContent().stream()
                .map(p -> {
                    Society s = p.getSocietyId() == null ? null : societies.get(p.getSocietyId());
                    return new SubscriptionRow(
                            p.getId(),
                            p.getSocietyCode(),
                            p.getSocietyName() != null ? p.getSocietyName() : (s != null ? s.getName() : null),
                            p.getSocietyId(),
                            p.getAdminEmail(),
                            p.getAdminName(),
                            p.getBillingPeriod() == null ? null : p.getBillingPeriod().name(),
                            p.getAmountPaise(),
                            p.getCurrency(),
                            p.getStatus() == null ? null : p.getStatus().name(),
                            p.getPaidAt(),
                            p.getCreatedAt(),
                            s != null ? s.getSubscriptionExpiresAt() : null,
                            s != null && s.isSubscriptionActive()
                    );
                })
                .toList();
        return pageResponse(rows, result);
    }

    private Map<UUID, long[]> memberAdminCounts(List<UUID> societyIds) {
        Map<UUID, long[]> map = new HashMap<>();
        if (societyIds.isEmpty()) {
            return map;
        }
        for (Object[] row : userRepository.countMembersAndAdminsBySocietyIds(societyIds)) {
            UUID societyId = (UUID) row[0];
            long members = ((Number) row[1]).longValue();
            long admins = ((Number) row[2]).longValue();
            map.put(societyId, new long[]{members, admins});
        }
        return map;
    }

    private static PageRequest pageRequest(int page, int size, String sortProperty) {
        int p = Math.max(page, 0);
        int s = Math.min(Math.max(size, 1), 100);
        return PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, sortProperty));
    }

    private static <T> PageResponse<T> pageResponse(List<T> content, Page<?> page) {
        return new PageResponse<>(
                content,
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast()
        );
    }
}
