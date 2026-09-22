package com.society.core.service;

import com.society.core.domain.ElectionCandidate;
import com.society.core.domain.SocietyElection;
import com.society.core.dto.ElectionDtos.PublishResultsRequest;
import com.society.core.dto.ElectionDtos.UpdateElectionStatusRequest;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.ElectionCandidateRepository;
import com.society.core.repository.ElectionPositionRepository;
import com.society.core.repository.SocietyElectionRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ElectionServiceTest {

    private static final UUID SOCIETY_A = UUID.randomUUID();
    private static final UUID SOCIETY_B = UUID.randomUUID();

    @Mock
    private SocietyElectionRepository electionRepository;

    @Mock
    private ElectionPositionRepository positionRepository;

    @Mock
    private ElectionCandidateRepository candidateRepository;

    @InjectMocks
    private ElectionService service;

    @Test
    void draftCanOpenNominations() {
        SocietyElection election = election("DRAFT");
        stub(election);

        var detail = service.updateStatus(SOCIETY_A, election.getId(), status("NOMINATIONS_OPEN"));

        assertThat(detail.status()).isEqualTo("NOMINATIONS_OPEN");
        assertThat(detail.electronicVotingEnabled()).isFalse();
    }

    @Test
    void draftCannotJumpStraightToVoting() {
        SocietyElection election = election("DRAFT");
        stub(election);

        assertThatThrownBy(() -> service.updateStatus(SOCIETY_A, election.getId(), status("VOTING_OPEN")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("cannot move from DRAFT to VOTING_OPEN");

        assertThat(election.getStatus()).isEqualTo("DRAFT");
    }

    @Test
    void closedElectionCannotReopen() {
        SocietyElection election = election("CLOSED");
        stub(election);

        assertThatThrownBy(() -> service.updateStatus(SOCIETY_A, election.getId(), status("VOTING_OPEN")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void publishedElectionIsTerminal() {
        SocietyElection election = election("RESULTS_PUBLISHED");
        stub(election);

        assertThatThrownBy(() -> service.updateStatus(SOCIETY_A, election.getId(), status("CLOSED")))
                .isInstanceOf(ConflictException.class);
    }

    @Test
    void publishingRequiresRecordedResults() {
        SocietyElection election = election("CLOSED");
        stub(election);

        assertThatThrownBy(() -> service.updateStatus(SOCIETY_A, election.getId(), status("RESULTS_PUBLISHED")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("Record the results");
    }

    @Test
    void resultsCannotBeRecordedBeforeTheElectionCloses() {
        SocietyElection election = election("NOMINATIONS_OPEN");
        stub(election);

        assertThatThrownBy(() -> service.publishResults(SOCIETY_A, election.getId(),
                new PublishResultsRequest(List.of(), "Summary")))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("Close the election");
    }

    @Test
    void recordingResultsMarksWinnersAndPublishes() {
        SocietyElection election = election("CLOSED");
        stub(election);

        ElectionCandidate winner = candidate(election.getId());
        ElectionCandidate other = candidate(election.getId());
        when(candidateRepository.findByElectionIdAndSocietyIdOrderByFullNameAsc(election.getId(), SOCIETY_A))
                .thenReturn(List.of(winner, other));

        var detail = service.publishResults(SOCIETY_A, election.getId(),
                new PublishResultsRequest(List.of(winner.getId()), "Chairperson elected unopposed."));

        assertThat(winner.isWinner()).isTrue();
        assertThat(other.isWinner()).isFalse();
        assertThat(detail.status()).isEqualTo("RESULTS_PUBLISHED");
        assertThat(detail.votingNotice()).contains("Electronic voting is not enabled");
    }

    @Test
    void winnersMustBeCandidatesOfThatElection() {
        SocietyElection election = election("CLOSED");
        stub(election);
        when(candidateRepository.findByElectionIdAndSocietyIdOrderByFullNameAsc(election.getId(), SOCIETY_A))
                .thenReturn(List.of(candidate(election.getId())));

        assertThatThrownBy(() -> service.publishResults(SOCIETY_A, election.getId(),
                new PublishResultsRequest(List.of(UUID.randomUUID()), "Summary")))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("not a candidate");

        verify(electionRepository, never()).save(any());
    }

    @Test
    void anotherSocietyCannotChangeThisElection() {
        UUID electionId = UUID.randomUUID();
        when(electionRepository.findByIdAndSocietyId(electionId, SOCIETY_B)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.updateStatus(SOCIETY_B, electionId, status("CLOSED")))
                .isInstanceOf(NotFoundException.class)
                .hasMessage("Election not found");
    }

    private void stub(SocietyElection election) {
        when(electionRepository.findByIdAndSocietyId(election.getId(), SOCIETY_A))
                .thenReturn(Optional.of(election));
        when(electionRepository.save(any(SocietyElection.class))).thenAnswer(inv -> inv.getArgument(0));
        when(positionRepository.findByElectionIdAndSocietyIdOrderBySortOrderAscTitleAsc(election.getId(), SOCIETY_A))
                .thenReturn(List.of());
        when(candidateRepository.findByElectionIdAndSocietyIdOrderByFullNameAsc(election.getId(), SOCIETY_A))
                .thenReturn(List.of());
    }

    private static SocietyElection election(String status) {
        SocietyElection election = new SocietyElection();
        election.setId(UUID.randomUUID());
        election.setSocietyId(SOCIETY_A);
        election.setTitle("Managing committee 2026");
        election.setStatus(status);
        election.setCreatedBy(UUID.randomUUID());
        return election;
    }

    private static ElectionCandidate candidate(UUID electionId) {
        ElectionCandidate candidate = new ElectionCandidate();
        candidate.setId(UUID.randomUUID());
        candidate.setElectionId(electionId);
        candidate.setSocietyId(SOCIETY_A);
        candidate.setPositionId(UUID.randomUUID());
        candidate.setFullName("Candidate " + UUID.randomUUID());
        return candidate;
    }

    private static UpdateElectionStatusRequest status(String status) {
        return new UpdateElectionStatusRequest(status);
    }
}
