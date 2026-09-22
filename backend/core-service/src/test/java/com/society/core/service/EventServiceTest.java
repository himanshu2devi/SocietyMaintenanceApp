package com.society.core.service;

import com.society.core.domain.SocietyEvent;
import com.society.core.dto.EventDtos.UpsertEventRequest;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.SocietyEventRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EventServiceTest {

    private static final UUID SOCIETY_A = UUID.randomUUID();
    private static final UUID SOCIETY_B = UUID.randomUUID();
    private static final UUID ADMIN = UUID.randomUUID();
    private static final LocalDate DATE = LocalDate.of(2026, 10, 2);

    @Mock
    private SocietyEventRepository repository;

    @InjectMocks
    private EventService service;

    @Test
    void rejectsEndTimeBeforeStartTime() {
        var req = request(DATE, LocalTime.of(18, 0), LocalTime.of(17, 0), "SCHEDULED");

        assertThatThrownBy(() -> service.create(SOCIETY_A, ADMIN, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("End time must be after start time");

        verify(repository, never()).save(any());
    }

    @Test
    void rejectsEndTimeEqualToStartTime() {
        var req = request(DATE, LocalTime.of(18, 0), LocalTime.of(18, 0), "SCHEDULED");

        assertThatThrownBy(() -> service.create(SOCIETY_A, ADMIN, req))
                .isInstanceOf(BadRequestException.class);
    }

    @Test
    void rejectsEndTimeWithoutStartTime() {
        var req = request(DATE, null, LocalTime.of(18, 0), "SCHEDULED");

        assertThatThrownBy(() -> service.create(SOCIETY_A, ADMIN, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Start time is required");
    }

    @Test
    void rejectsMissingEventDate() {
        var req = request(null, null, null, "SCHEDULED");

        assertThatThrownBy(() -> service.create(SOCIETY_A, ADMIN, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Event date is required");
    }

    @Test
    void rejectsUnknownStatus() {
        var req = request(DATE, null, null, "ARCHIVED");

        assertThatThrownBy(() -> service.create(SOCIETY_A, ADMIN, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("SCHEDULED, CANCELLED or COMPLETED");
    }

    @Test
    void createsEventWithDefaultStatusWhenNoneGiven() {
        when(repository.save(any(SocietyEvent.class))).thenAnswer(inv -> inv.getArgument(0));

        var response = service.create(SOCIETY_A, ADMIN,
                request(DATE, LocalTime.of(17, 0), LocalTime.of(20, 0), null));

        assertThat(response.status()).isEqualTo("SCHEDULED");
        assertThat(response.eventDate()).isEqualTo(DATE);
    }

    @Test
    void cannotUpdateAnEventOwnedByAnotherSociety() {
        UUID eventId = UUID.randomUUID();
        when(repository.findByIdAndSocietyId(eventId, SOCIETY_B)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update(SOCIETY_B, eventId, request(DATE, null, null, null)))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Event not found");
    }

    private static UpsertEventRequest request(LocalDate date, LocalTime start, LocalTime end, String status) {
        return new UpsertEventRequest("Ganesh Utsav", "Society celebration", date, start, end,
                "Clubhouse", "Cultural committee", null, status);
    }
}
