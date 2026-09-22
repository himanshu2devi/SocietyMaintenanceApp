package com.society.core.service;

import com.society.core.domain.ParkingAssignment;
import com.society.core.domain.ParkingSlot;
import com.society.core.dto.ParkingDtos.AssignParkingSlotRequest;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.ParkingAssignmentRepository;
import com.society.core.repository.ParkingSlotRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
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
class ParkingServiceTest {

    private static final UUID SOCIETY_A = UUID.randomUUID();
    private static final UUID SOCIETY_B = UUID.randomUUID();
    private static final UUID ADMIN = UUID.randomUUID();

    @Mock
    private ParkingSlotRepository slotRepository;

    @Mock
    private ParkingAssignmentRepository assignmentRepository;

    @InjectMocks
    private ParkingService service;

    private UUID slotId;
    private ParkingSlot slot;

    @BeforeEach
    void setUp() {
        slotId = UUID.randomUUID();
        slot = new ParkingSlot();
        slot.setId(slotId);
        slot.setSocietyId(SOCIETY_A);
        slot.setSlotCode("A-101");
        slot.setCategory("ASSIGNED");
        slot.setStatus("AVAILABLE");
        slot.setCreatedBy(ADMIN);
    }

    @Test
    void assignRejectsSlotThatAlreadyHasAnActiveAssignment() {
        when(slotRepository.findByIdAndSocietyId(slotId, SOCIETY_A)).thenReturn(Optional.of(slot));
        when(assignmentRepository.findActiveForSlot(SOCIETY_A, slotId))
                .thenReturn(Optional.of(activeAssignment()));

        assertThatThrownBy(() -> service.assign(SOCIETY_A, ADMIN, slotId, request(null)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already has an active assignment");

        verify(assignmentRepository, never()).save(any());
    }

    @Test
    void assignReleasesPreviousAssignmentWhenReplaceRequested() {
        ParkingAssignment previous = activeAssignment();
        when(slotRepository.findByIdAndSocietyId(slotId, SOCIETY_A)).thenReturn(Optional.of(slot));
        when(assignmentRepository.findActiveForSlot(SOCIETY_A, slotId)).thenReturn(Optional.of(previous));
        when(assignmentRepository.save(any(ParkingAssignment.class))).thenAnswer(inv -> inv.getArgument(0));

        service.assign(SOCIETY_A, ADMIN, slotId, request(true));

        assertThat(previous.isActive()).isFalse();
        assertThat(previous.getUnassignedAt()).isNotNull();
        verify(assignmentRepository).saveAndFlush(previous);

        ArgumentCaptor<ParkingAssignment> captor = ArgumentCaptor.forClass(ParkingAssignment.class);
        verify(assignmentRepository).save(captor.capture());
        assertThat(captor.getValue().isActive()).isTrue();
        assertThat(captor.getValue().getSocietyId()).isEqualTo(SOCIETY_A);
        assertThat(slot.getStatus()).isEqualTo("ASSIGNED");
    }

    @Test
    void assignSucceedsForFreeSlotAndMarksItAssigned() {
        when(slotRepository.findByIdAndSocietyId(slotId, SOCIETY_A)).thenReturn(Optional.of(slot));
        when(assignmentRepository.findActiveForSlot(SOCIETY_A, slotId)).thenReturn(Optional.empty());
        when(assignmentRepository.save(any(ParkingAssignment.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.assign(SOCIETY_A, ADMIN, slotId, request(null));

        assertThat(response.active()).isTrue();
        assertThat(response.slotCode()).isEqualTo("A-101");
        assertThat(slot.getStatus()).isEqualTo("ASSIGNED");
        verify(slotRepository).save(slot);
    }

    @Test
    void assignRejectsSlotMarkedUnavailable() {
        slot.setStatus("UNAVAILABLE");
        when(slotRepository.findByIdAndSocietyId(slotId, SOCIETY_A)).thenReturn(Optional.of(slot));

        assertThatThrownBy(() -> service.assign(SOCIETY_A, ADMIN, slotId, request(null)))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("unavailable");
    }

    @Test
    void assignCannotReachASlotBelongingToAnotherSociety() {
        when(slotRepository.findByIdAndSocietyId(slotId, SOCIETY_B)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.assign(SOCIETY_B, ADMIN, slotId, request(null)))
                .isInstanceOf(NotFoundException.class);

        verify(assignmentRepository, never()).save(any());
    }

    @Test
    void deleteSlotIsBlockedWhileAnAssignmentIsActive() {
        when(slotRepository.findByIdAndSocietyId(slotId, SOCIETY_A)).thenReturn(Optional.of(slot));
        when(assignmentRepository.countActiveForSlot(SOCIETY_A, slotId)).thenReturn(1L);

        assertThatThrownBy(() -> service.deleteSlot(SOCIETY_A, slotId))
                .isInstanceOf(ConflictException.class);

        verify(slotRepository, never()).delete(any());
    }

    private ParkingAssignment activeAssignment() {
        ParkingAssignment assignment = new ParkingAssignment();
        assignment.setId(UUID.randomUUID());
        assignment.setSocietyId(SOCIETY_A);
        assignment.setSlotId(slotId);
        assignment.setMemberUserId(UUID.randomUUID());
        assignment.setFlatNumber("101");
        assignment.setActive(true);
        assignment.setAssignedBy(ADMIN);
        return assignment;
    }

    private static AssignParkingSlotRequest request(Boolean replaceExisting) {
        return new AssignParkingSlotRequest(UUID.randomUUID(), "Asha Rao", "202",
                "MH12AB1234", "CAR", null, replaceExisting);
    }
}
