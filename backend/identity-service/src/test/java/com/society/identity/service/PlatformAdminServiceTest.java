package com.society.identity.service;

import com.society.identity.domain.Role;
import com.society.identity.domain.Society;
import com.society.identity.domain.User;
import com.society.identity.dto.PlatformAdminDtos.DashboardResponse;
import com.society.identity.dto.PlatformAdminDtos.PageResponse;
import com.society.identity.dto.PlatformAdminDtos.SocietyRow;
import com.society.identity.dto.PlatformAdminDtos.UserRow;
import com.society.identity.repository.SocietyRepository;
import com.society.identity.repository.SubscriptionPaymentRepository;
import com.society.identity.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PlatformAdminServiceTest {

    @Mock SocietyRepository societyRepository;
    @Mock UserRepository userRepository;
    @Mock SubscriptionPaymentRepository subscriptionPaymentRepository;

    PlatformAdminService service;

    @BeforeEach
    void setUp() {
        service = new PlatformAdminService(societyRepository, userRepository, subscriptionPaymentRepository);
    }

    @Test
    void dashboardCountsActiveAndInactiveSocieties() {
        Society active = new Society();
        active.setId(UUID.randomUUID());
        active.setSubscriptionExpiresAt(Instant.now().plusSeconds(86400));
        Society expired = new Society();
        expired.setId(UUID.randomUUID());
        expired.setSubscriptionExpiresAt(Instant.now().minusSeconds(86400));
        when(societyRepository.findAll()).thenReturn(List.of(active, expired));
        when(userRepository.count()).thenReturn(10L);
        when(userRepository.countByRole(Role.MEMBER)).thenReturn(7L);
        when(userRepository.countByRole(Role.ADMIN)).thenReturn(2L);
        when(userRepository.countByRole(Role.PLATFORM_ADMIN)).thenReturn(1L);
        when(subscriptionPaymentRepository.countByStatusIn(any())).thenReturn(3L);

        DashboardResponse dash = service.dashboard();
        assertEquals(2, dash.totalSocieties());
        assertEquals(1, dash.activeSocieties());
        assertEquals(1, dash.inactiveSocieties());
        assertEquals(7, dash.totalMembers());
        assertEquals(1, dash.platformAdmins());
    }

    @Test
    void usersResponseNeverIncludesPasswordHash() {
        User member = new User();
        member.setId(UUID.randomUUID());
        member.setFullName("Asha");
        member.setEmail("asha@example.com");
        member.setMobile("9876543210");
        member.setFlatNumber("A-1");
        member.setRole(Role.MEMBER);
        member.setActive(true);
        member.setPasswordHash("SECRET_HASH_MUST_NOT_LEAK");
        member.setSocietyId(UUID.randomUUID());
        member.setCreatedAt(Instant.now());

        Society society = new Society();
        society.setId(member.getSocietyId());
        society.setName("Green Residency");
        society.setSocietyCode("GREEN01");

        when(userRepository.searchForPlatform(isNull(), isNull(), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(member)));
        when(societyRepository.findAllById(any())).thenReturn(List.of(society));

        PageResponse<UserRow> page = service.users(null, null, 0, 20);
        assertEquals(1, page.content().size());
        UserRow row = page.content().get(0);
        assertEquals("Asha", row.fullName());
        assertEquals("9876543210", row.mobile());
        assertEquals("Green Residency", row.societyName());
        String jsonLike = row.toString();
        assertFalse(jsonLike.contains("SECRET_HASH"));
        assertFalse(jsonLike.toLowerCase().contains("password"));
    }

    @Test
    void societiesSearchReturnsRows() {
        Society s = new Society();
        s.setId(UUID.randomUUID());
        s.setName("Lake View");
        s.setSocietyCode("LAKE1");
        s.setCreatedAt(Instant.now());
        when(societyRepository.search(eq("lake"), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(s)));
        when(userRepository.countMembersAndAdminsBySocietyIds(any()))
                .thenReturn(List.<Object[]>of(new Object[]{s.getId(), 5L, 1L}));

        PageResponse<SocietyRow> page = service.societies("lake", 0, 20);
        assertEquals(1, page.content().size());
        assertEquals(5, page.content().get(0).memberCount());
        assertEquals(1, page.content().get(0).adminCount());
    }
}
