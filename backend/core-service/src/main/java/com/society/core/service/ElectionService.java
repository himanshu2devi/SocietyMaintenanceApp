package com.society.core.service;

import com.society.core.domain.ElectionCandidate;
import com.society.core.domain.ElectionPosition;
import com.society.core.domain.SocietyElection;
import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.ElectionDtos;
import com.society.core.dto.ElectionDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.exception.ApiExceptions.ConflictException;
import com.society.core.exception.ApiExceptions.NotFoundException;
import com.society.core.repository.ElectionCandidateRepository;
import com.society.core.repository.ElectionPositionRepository;
import com.society.core.repository.SocietyElectionRepository;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Election administration only. The service records nominations, candidates and the
 * committee-declared outcome; it never accepts or tallies ballots.
 */
@Service
public class ElectionService {

    static final String DRAFT = "DRAFT";
    static final String NOMINATIONS_OPEN = "NOMINATIONS_OPEN";
    static final String VOTING_OPEN = "VOTING_OPEN";
    static final String CLOSED = "CLOSED";
    static final String RESULTS_PUBLISHED = "RESULTS_PUBLISHED";

    static final Set<String> STATUSES =
            Set.of(DRAFT, NOMINATIONS_OPEN, VOTING_OPEN, CLOSED, RESULTS_PUBLISHED);

    /** Elections only ever move forward through the administration lifecycle. */
    static final Map<String, Set<String>> ALLOWED_TRANSITIONS = Map.of(
            DRAFT, Set.of(NOMINATIONS_OPEN, CLOSED),
            NOMINATIONS_OPEN, Set.of(VOTING_OPEN, CLOSED),
            VOTING_OPEN, Set.of(CLOSED),
            CLOSED, Set.of(RESULTS_PUBLISHED),
            RESULTS_PUBLISHED, Set.of()
    );

    private final SocietyElectionRepository electionRepository;
    private final ElectionPositionRepository positionRepository;
    private final ElectionCandidateRepository candidateRepository;

    public ElectionService(SocietyElectionRepository electionRepository,
                           ElectionPositionRepository positionRepository,
                           ElectionCandidateRepository candidateRepository) {
        this.electionRepository = electionRepository;
        this.positionRepository = positionRepository;
        this.candidateRepository = candidateRepository;
    }

    // ---------- elections ----------

    @Transactional(readOnly = true)
    public PageResponse<ElectionSummaryResponse> list(UUID societyId, String status, String q, Pageable pageable) {
        return PageResponse.of(
                electionRepository.search(societyId, normalizeStatusFilter(status), likeOrNull(q), pageable),
                ElectionService::toSummary);
    }

    @Transactional(readOnly = true)
    public ElectionDetailResponse get(UUID societyId, UUID id) {
        return toDetail(findOwned(societyId, id));
    }

    @Transactional
    public ElectionDetailResponse create(UUID societyId, UUID createdBy, UpsertElectionRequest req) {
        SocietyElection election = new SocietyElection();
        election.setSocietyId(societyId);
        election.setCreatedBy(createdBy);
        election.setStatus(DRAFT);
        apply(election, req);
        return toDetail(electionRepository.save(election));
    }

    @Transactional
    public ElectionDetailResponse update(UUID societyId, UUID id, UpsertElectionRequest req) {
        SocietyElection election = findOwned(societyId, id);
        if (RESULTS_PUBLISHED.equals(election.getStatus())) {
            throw new ConflictException("Published elections can no longer be edited.");
        }
        apply(election, req);
        return toDetail(electionRepository.save(election));
    }

    @Transactional
    public void delete(UUID societyId, UUID id) {
        SocietyElection election = findOwned(societyId, id);
        candidateRepository.deleteByElectionIdAndSocietyId(id, societyId);
        positionRepository.deleteByElectionIdAndSocietyId(id, societyId);
        electionRepository.delete(election);
    }

    @Transactional
    public ElectionDetailResponse updateStatus(UUID societyId, UUID id, UpdateElectionStatusRequest req) {
        SocietyElection election = findOwned(societyId, id);
        String target = normalizeStatus(req.status());
        String current = election.getStatus();

        if (target.equals(current)) {
            return toDetail(election);
        }
        if (!ALLOWED_TRANSITIONS.getOrDefault(current, Set.of()).contains(target)) {
            throw new ConflictException("An election cannot move from " + current + " to " + target + ".");
        }
        if (RESULTS_PUBLISHED.equals(target) && election.getResultSummary() == null) {
            throw new BadRequestException("Record the results before publishing this election.");
        }
        election.setStatus(target);
        return toDetail(electionRepository.save(election));
    }

    // ---------- positions ----------

    @Transactional
    public ElectionDetailResponse addPosition(UUID societyId, UUID electionId, UpsertPositionRequest req) {
        SocietyElection election = findEditable(societyId, electionId);
        String title = requireText(req.title(), "Position title is required");
        if (positionRepository.existsByElectionIdAndSocietyIdAndTitleIgnoreCase(electionId, societyId, title)) {
            throw new ConflictException("Position " + title + " already exists for this election.");
        }
        ElectionPosition position = new ElectionPosition();
        position.setElectionId(electionId);
        position.setSocietyId(societyId);
        position.setTitle(title);
        position.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
        positionRepository.save(position);
        return toDetail(election);
    }

    @Transactional
    public ElectionDetailResponse deletePosition(UUID societyId, UUID electionId, UUID positionId) {
        SocietyElection election = findEditable(societyId, electionId);
        ElectionPosition position = findPosition(societyId, electionId, positionId);
        candidateRepository.deleteByPositionIdAndSocietyId(positionId, societyId);
        positionRepository.delete(position);
        return toDetail(election);
    }

    // ---------- candidates ----------

    @Transactional
    public ElectionDetailResponse addCandidate(UUID societyId, UUID electionId, UpsertCandidateRequest req) {
        SocietyElection election = findEditable(societyId, electionId);
        findPosition(societyId, electionId, req.positionId());

        ElectionCandidate candidate = new ElectionCandidate();
        candidate.setElectionId(electionId);
        candidate.setSocietyId(societyId);
        candidate.setPositionId(req.positionId());
        candidate.setFullName(requireText(req.fullName(), "Candidate name is required"));
        candidate.setFlatNumber(trimToNull(req.flatNumber()));
        candidate.setProfileText(trimToNull(req.profileText()));
        candidateRepository.save(candidate);
        return toDetail(election);
    }

    @Transactional
    public ElectionDetailResponse deleteCandidate(UUID societyId, UUID electionId, UUID candidateId) {
        SocietyElection election = findEditable(societyId, electionId);
        ElectionCandidate candidate = candidateRepository.findByIdAndSocietyId(candidateId, societyId)
                .filter(c -> c.getElectionId().equals(electionId))
                .orElseThrow(() -> new NotFoundException("Candidate not found"));
        candidateRepository.delete(candidate);
        return toDetail(election);
    }

    // ---------- results ----------

    /**
     * Records the outcome declared by the society's returning officer. Winners are marked by the
     * committee; no votes are counted here.
     */
    @Transactional
    public ElectionDetailResponse publishResults(UUID societyId, UUID electionId, PublishResultsRequest req) {
        SocietyElection election = findOwned(societyId, electionId);
        if (DRAFT.equals(election.getStatus()) || NOMINATIONS_OPEN.equals(election.getStatus())) {
            throw new ConflictException("Close the election before recording results.");
        }

        List<ElectionCandidate> candidates =
                candidateRepository.findByElectionIdAndSocietyIdOrderByFullNameAsc(electionId, societyId);
        Set<UUID> winners = req.winnerCandidateIds() == null ? Set.of() : Set.copyOf(req.winnerCandidateIds());

        Set<UUID> known = candidates.stream().map(ElectionCandidate::getId).collect(java.util.stream.Collectors.toSet());
        for (UUID winnerId : winners) {
            if (!known.contains(winnerId)) {
                throw new BadRequestException("A selected winner is not a candidate in this election.");
            }
        }

        candidates.forEach(c -> c.setWinner(winners.contains(c.getId())));
        candidateRepository.saveAll(candidates);

        String summary = trimToNull(req.resultSummary());
        if (summary == null && winners.isEmpty()) {
            throw new BadRequestException("Provide the winners or a result summary.");
        }
        election.setResultSummary(summary == null ? "Results recorded by the committee." : summary);
        election.setStatus(RESULTS_PUBLISHED);
        return toDetail(electionRepository.save(election));
    }

    // ---------- helpers ----------

    private SocietyElection findOwned(UUID societyId, UUID id) {
        return electionRepository.findByIdAndSocietyId(id, societyId)
                .orElseThrow(() -> new NotFoundException("Election not found"));
    }

    private SocietyElection findEditable(UUID societyId, UUID id) {
        SocietyElection election = findOwned(societyId, id);
        if (RESULTS_PUBLISHED.equals(election.getStatus())) {
            throw new ConflictException("Published elections can no longer be edited.");
        }
        return election;
    }

    private ElectionPosition findPosition(UUID societyId, UUID electionId, UUID positionId) {
        if (positionId == null) {
            throw new BadRequestException("Position is required");
        }
        return positionRepository.findByIdAndSocietyId(positionId, societyId)
                .filter(p -> p.getElectionId().equals(electionId))
                .orElseThrow(() -> new NotFoundException("Election position not found"));
    }

    private void apply(SocietyElection election, UpsertElectionRequest req) {
        election.setTitle(requireText(req.title(), "Title is required"));
        election.setDescription(trimToNull(req.description()));
        if (req.nominationStart() != null && req.nominationEnd() != null
                && !req.nominationEnd().isAfter(req.nominationStart())) {
            throw new BadRequestException("Nomination end must be after nomination start");
        }
        if (req.votingStart() != null && req.votingEnd() != null
                && !req.votingEnd().isAfter(req.votingStart())) {
            throw new BadRequestException("Voting end must be after voting start");
        }
        election.setNominationStart(req.nominationStart());
        election.setNominationEnd(req.nominationEnd());
        election.setVotingStart(req.votingStart());
        election.setVotingEnd(req.votingEnd());
    }

    static String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new BadRequestException("Status is required");
        }
        String value = status.trim().toUpperCase(Locale.ROOT).replace(' ', '_');
        if (!STATUSES.contains(value)) {
            throw new BadRequestException(
                    "Status must be DRAFT, NOMINATIONS_OPEN, VOTING_OPEN, CLOSED or RESULTS_PUBLISHED");
        }
        return value;
    }

    private static String normalizeStatusFilter(String status) {
        if (status == null || status.isBlank()) return null;
        return normalizeStatus(status);
    }

    private static String requireText(String value, String message) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(message);
        }
        return value.trim();
    }

    private static String likeOrNull(String q) {
        if (q == null || q.isBlank()) return null;
        return "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
    }

    private static String trimToNull(String value) {
        if (value == null) return null;
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private ElectionDetailResponse toDetail(SocietyElection election) {
        UUID electionId = election.getId();
        List<ElectionPositionResponse> positions = List.of();
        if (electionId != null) {
            List<ElectionCandidate> candidates =
                    candidateRepository.findByElectionIdAndSocietyIdOrderByFullNameAsc(electionId, election.getSocietyId());
            positions = positionRepository
                    .findByElectionIdAndSocietyIdOrderBySortOrderAscTitleAsc(electionId, election.getSocietyId())
                    .stream()
                    .map(p -> new ElectionPositionResponse(
                            p.getId().toString(),
                            p.getTitle(),
                            p.getSortOrder(),
                            candidates.stream()
                                    .filter(c -> p.getId().equals(c.getPositionId()))
                                    .map(ElectionService::toCandidate)
                                    .toList()))
                    .toList();
        }

        return new ElectionDetailResponse(
                electionId == null ? null : electionId.toString(),
                election.getTitle(),
                election.getDescription(),
                election.getStatus(),
                election.getNominationStart(),
                election.getNominationEnd(),
                election.getVotingStart(),
                election.getVotingEnd(),
                election.getResultSummary(),
                positions,
                election.getCreatedAt(),
                election.getUpdatedAt(),
                ElectionDtos.ELECTRONIC_VOTING_ENABLED,
                ElectionDtos.VOTING_NOTICE
        );
    }

    static ElectionCandidateResponse toCandidate(ElectionCandidate c) {
        return new ElectionCandidateResponse(
                c.getId() == null ? null : c.getId().toString(),
                c.getPositionId() == null ? null : c.getPositionId().toString(),
                c.getFullName(),
                c.getFlatNumber(),
                c.getProfileText(),
                c.isWinner(),
                c.getCreatedAt()
        );
    }

    static ElectionSummaryResponse toSummary(SocietyElection e) {
        return new ElectionSummaryResponse(
                e.getId() == null ? null : e.getId().toString(),
                e.getTitle(),
                e.getDescription(),
                e.getStatus(),
                e.getNominationStart(),
                e.getNominationEnd(),
                e.getVotingStart(),
                e.getVotingEnd(),
                e.getCreatedAt(),
                e.getUpdatedAt()
        );
    }
}
