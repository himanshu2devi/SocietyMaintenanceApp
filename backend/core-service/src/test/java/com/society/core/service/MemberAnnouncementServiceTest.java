package com.society.core.service;

import com.society.core.domain.MemberAnnouncement;
import com.society.core.dto.MemberAnnouncementDtos.ReviewAnnouncementRequest;
import com.society.core.dto.MemberAnnouncementDtos.SubmitAnnouncementRequest;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.MemberAnnouncementRepository;
import com.society.core.repository.SocietyEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class MemberAnnouncementServiceTest {

    private static final UUID SOCIETY_A = UUID.randomUUID();
    private static final UUID SOCIETY_B = UUID.randomUUID();
    private static final UUID MEMBER = UUID.randomUUID();
    private static final UUID ADMIN = UUID.randomUUID();

    @Mock
    private MemberAnnouncementRepository repository;

    @Mock
    private SocietyEventRepository eventRepository;

    @InjectMocks
    private MemberAnnouncementService service;

    @Test
    void submissionStartsAsPendingApproval() {
        when(repository.save(any(MemberAnnouncement.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.submit(SOCIETY_A, MEMBER, "Asha Rao", "202",
                new SubmitAnnouncementRequest("Lost keys", "Found near gate 2", null));

        assertThat(response.status()).isEqualTo("PENDING_APPROVAL");
        assertThat(response.authorFlatNumber()).isEqualTo("202");
    }

    @Test
    void submissionCannotLinkAnEventFromAnotherSociety() {
        UUID eventId = UUID.randomUUID();
        when(eventRepository.findByIdAndSocietyId(eventId, SOCIETY_A)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.submit(SOCIETY_A, MEMBER, "Asha Rao", "202",
                new SubmitAnnouncementRequest("Lost keys", "Found near gate 2", eventId)))
                .isInstanceOf(BadRequestException.class);

        verify(repository, never()).save(any());
    }

    @Test
    void approvalRecordsTheReviewer() {
        MemberAnnouncement announcement = pending();
        when(repository.findByIdAndSocietyId(announcement.getId(), SOCIETY_A))
                .thenReturn(Optional.of(announcement));
        when(repository.save(any(MemberAnnouncement.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.approve(SOCIETY_A, ADMIN, announcement.getId(),
                new ReviewAnnouncementRequest("Looks good"));

        assertThat(response.status()).isEqualTo("APPROVED");
        assertThat(response.reviewerUserId()).isEqualTo(ADMIN.toString());
        assertThat(response.reviewedAt()).isNotNull();
    }

    @Test
    void anAlreadyRejectedAnnouncementCannotBeRejectedAgain() {
        MemberAnnouncement announcement = pending();
        announcement.setStatus("REJECTED");
        when(repository.findByIdAndSocietyId(announcement.getId(), SOCIETY_A))
                .thenReturn(Optional.of(announcement));

        assertThatThrownBy(() -> service.reject(SOCIETY_A, ADMIN, announcement.getId(), null))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void reviewedAnnouncementsCanNoLongerBeEditedByTheAuthor() {
        MemberAnnouncement announcement = pending();
        announcement.setStatus("APPROVED");
        when(repository.findByIdAndSocietyId(announcement.getId(), SOCIETY_A))
                .thenReturn(Optional.of(announcement));

        assertThatThrownBy(() -> service.updateOwn(SOCIETY_A, MEMBER, announcement.getId(),
                new SubmitAnnouncementRequest("Edited", "Edited body", null)))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void aMemberCannotEditSomeoneElsesAnnouncement() {
        MemberAnnouncement announcement = pending();
        when(repository.findByIdAndSocietyId(announcement.getId(), SOCIETY_A))
                .thenReturn(Optional.of(announcement));

        assertThatThrownBy(() -> service.updateOwn(SOCIETY_A, UUID.randomUUID(), announcement.getId(),
                new SubmitAnnouncementRequest("Edited", "Edited body", null)))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void anAdminOfAnotherSocietyCannotApproveThisAnnouncement() {
        UUID announcementId = UUID.randomUUID();
        when(repository.findByIdAndSocietyId(announcementId, SOCIETY_B)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.approve(SOCIETY_B, ADMIN, announcementId, null))
                .isInstanceOf(NotFoundException.class);
    }

    private static MemberAnnouncement pending() {
        MemberAnnouncement announcement = new MemberAnnouncement();
        announcement.setId(UUID.randomUUID());
        announcement.setSocietyId(SOCIETY_A);
        announcement.setAuthorUserId(MEMBER);
        announcement.setTitle("Lost keys");
        announcement.setBody("Found near gate 2");
        announcement.setStatus("PENDING_APPROVAL");
        return announcement;
    }
}
