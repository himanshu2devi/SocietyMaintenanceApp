package com.society.core.repository;

import com.society.core.domain.MemberAnnouncement;
import com.society.core.domain.ParkingAssignment;
import com.society.core.domain.ParkingSlot;
import com.society.core.domain.SocietyElection;
import com.society.core.domain.SocietyEvent;
import com.society.core.domain.SocietyMeeting;
import com.society.core.domain.SocietyPaymentQr;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.ActiveProfiles;

import java.time.LocalDate;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Every SocietySimplify list query must be scoped to the caller's society; society B must never
 * see society A's rows.
 */
@DataJpaTest
@ActiveProfiles("h2")
class SocietySimplifyTenantIsolationTest {

    private static final UUID SOCIETY_A = UUID.randomUUID();
    private static final UUID SOCIETY_B = UUID.randomUUID();
    private static final UUID USER_A = UUID.randomUUID();
    private static final UUID USER_B = UUID.randomUUID();

    private static final PageRequest PAGE = PageRequest.of(0, 50);

    @Autowired private SocietyEventRepository eventRepository;
    @Autowired private MemberAnnouncementRepository announcementRepository;
    @Autowired private ParkingSlotRepository slotRepository;
    @Autowired private ParkingAssignmentRepository assignmentRepository;
    @Autowired private SocietyMeetingRepository meetingRepository;
    @Autowired private SocietyElectionRepository electionRepository;
    @Autowired private SocietyPaymentQrRepository paymentQrRepository;

    @BeforeEach
    void seed() {
        eventRepository.save(event(SOCIETY_A, "Society A Diwali"));
        eventRepository.save(event(SOCIETY_B, "Society B Diwali"));

        announcementRepository.save(announcement(SOCIETY_A, USER_A, "A notice", "APPROVED"));
        announcementRepository.save(announcement(SOCIETY_B, USER_B, "B notice", "APPROVED"));

        ParkingSlot slotA = slotRepository.save(slot(SOCIETY_A, "A-101"));
        ParkingSlot slotB = slotRepository.save(slot(SOCIETY_B, "B-101"));
        assignmentRepository.save(assignment(SOCIETY_A, slotA.getId(), USER_A));
        assignmentRepository.save(assignment(SOCIETY_B, slotB.getId(), USER_B));

        meetingRepository.save(meeting(SOCIETY_A, "A AGM"));
        meetingRepository.save(meeting(SOCIETY_B, "B AGM"));

        electionRepository.save(election(SOCIETY_A, "A committee"));
        electionRepository.save(election(SOCIETY_B, "B committee"));

        paymentQrRepository.save(paymentQr(SOCIETY_A));
        paymentQrRepository.save(paymentQr(SOCIETY_B));
    }

    @Test
    void eventsAreScopedToTheCallersSociety() {
        var page = eventRepository.search(SOCIETY_A, null, null, null, null, PAGE);

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent()).allSatisfy(e -> assertThat(e.getSocietyId()).isEqualTo(SOCIETY_A));
        assertThat(page.getContent().get(0).getTitle()).isEqualTo("Society A Diwali");
    }

    @Test
    void memberAnnouncementFeedNeverCrossesSocieties() {
        var page = announcementRepository.findMemberFeed(SOCIETY_A, USER_A, PAGE);

        assertThat(page.getTotalElements()).isEqualTo(1);
        assertThat(page.getContent().get(0).getSocietyId()).isEqualTo(SOCIETY_A);
    }

    @Test
    void parkingSlotsAndAssignmentsAreScopedToTheCallersSociety() {
        var slots = slotRepository.search(SOCIETY_A, null, null, null, PAGE);
        assertThat(slots.getTotalElements()).isEqualTo(1);
        assertThat(slots.getContent().get(0).getSlotCode()).isEqualTo("A-101");

        var assignments = assignmentRepository.findBySocietyIdOrderByAssignedAtDesc(SOCIETY_A, PAGE);
        assertThat(assignments.getTotalElements()).isEqualTo(1);
        assertThat(assignments.getContent().get(0).getMemberUserId()).isEqualTo(USER_A);

        assertThat(assignmentRepository.findBySocietyIdAndMemberUserIdOrderByAssignedAtDesc(SOCIETY_A, USER_B))
                .isEmpty();
    }

    @Test
    void aSlotFromAnotherSocietyIsNotReachableById() {
        UUID slotBId = slotRepository.search(SOCIETY_B, null, null, null, PAGE)
                .getContent().get(0).getId();

        assertThat(slotRepository.findByIdAndSocietyId(slotBId, SOCIETY_A)).isEmpty();
        assertThat(slotRepository.findByIdAndSocietyId(slotBId, SOCIETY_B)).isPresent();
    }

    @Test
    void meetingsAndElectionsAreScopedToTheCallersSociety() {
        assertThat(meetingRepository.search(SOCIETY_A, null, null, null, null, null, PAGE).getTotalElements())
                .isEqualTo(1);
        assertThat(electionRepository.search(SOCIETY_A, null, null, PAGE).getContent())
                .singleElement()
                .satisfies(e -> assertThat(e.getTitle()).isEqualTo("A committee"));
    }

    @Test
    void paymentQrIsResolvedPerSociety() {
        assertThat(paymentQrRepository.findBySocietyId(SOCIETY_A))
                .get()
                .satisfies(qr -> assertThat(qr.getSocietyId()).isEqualTo(SOCIETY_A));
        assertThat(paymentQrRepository.findBySocietyId(UUID.randomUUID())).isEmpty();
    }

    private static SocietyEvent event(UUID societyId, String title) {
        SocietyEvent event = new SocietyEvent();
        event.setSocietyId(societyId);
        event.setTitle(title);
        event.setEventDate(LocalDate.of(2026, 11, 8));
        event.setCreatedBy(UUID.randomUUID());
        return event;
    }

    private static MemberAnnouncement announcement(UUID societyId, UUID authorId, String title, String status) {
        MemberAnnouncement announcement = new MemberAnnouncement();
        announcement.setSocietyId(societyId);
        announcement.setAuthorUserId(authorId);
        announcement.setTitle(title);
        announcement.setBody("Body of " + title);
        announcement.setStatus(status);
        return announcement;
    }

    private static ParkingSlot slot(UUID societyId, String slotCode) {
        ParkingSlot slot = new ParkingSlot();
        slot.setSocietyId(societyId);
        slot.setSlotCode(slotCode);
        slot.setCategory("ASSIGNED");
        slot.setStatus("ASSIGNED");
        slot.setCreatedBy(UUID.randomUUID());
        return slot;
    }

    private static ParkingAssignment assignment(UUID societyId, UUID slotId, UUID memberUserId) {
        ParkingAssignment assignment = new ParkingAssignment();
        assignment.setSocietyId(societyId);
        assignment.setSlotId(slotId);
        assignment.setMemberUserId(memberUserId);
        assignment.setFlatNumber("101");
        assignment.setActive(true);
        assignment.setAssignedBy(UUID.randomUUID());
        return assignment;
    }

    private static SocietyMeeting meeting(UUID societyId, String title) {
        SocietyMeeting meeting = new SocietyMeeting();
        meeting.setSocietyId(societyId);
        meeting.setTitle(title);
        meeting.setMeetingType("AGM");
        meeting.setMeetingDate(LocalDate.of(2026, 12, 1));
        meeting.setCreatedBy(UUID.randomUUID());
        return meeting;
    }

    private static SocietyElection election(UUID societyId, String title) {
        SocietyElection election = new SocietyElection();
        election.setSocietyId(societyId);
        election.setTitle(title);
        election.setStatus("DRAFT");
        election.setCreatedBy(UUID.randomUUID());
        return election;
    }

    private static SocietyPaymentQr paymentQr(UUID societyId) {
        SocietyPaymentQr qr = new SocietyPaymentQr();
        qr.setSocietyId(societyId);
        qr.setContentType("image/png");
        qr.setImageBase64("iVBORw0KGgo=");
        qr.setUpdatedBy(UUID.randomUUID());
        return qr;
    }
}
