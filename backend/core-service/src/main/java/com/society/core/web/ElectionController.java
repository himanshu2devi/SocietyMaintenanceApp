package com.society.core.web;

import com.society.core.dto.CommonDtos.PageResponse;
import com.society.core.dto.ElectionDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.security.SocietyScope;
import com.society.core.service.ElectionService;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Election administration API. Members can read elections, positions, candidates and the
 * committee-recorded results; there are deliberately no vote-casting endpoints.
 */
@RestController
@RequestMapping("/api/v1/elections")
public class ElectionController {

    private final ElectionService service;

    public ElectionController(ElectionService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<PageResponse<ElectionSummaryResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q,
            @PageableDefault(size = 50) Pageable pageable) {
        return ResponseEntity.ok(service.list(SocietyScope.require(user), status, q, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ElectionDetailResponse> get(@AuthenticationPrincipal AuthenticatedUser user,
                                                      @PathVariable UUID id) {
        return ResponseEntity.ok(service.get(SocietyScope.require(user), id));
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionDetailResponse> create(@AuthenticationPrincipal AuthenticatedUser user,
                                                         @Valid @RequestBody UpsertElectionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.create(SocietyScope.require(user), user.userId(), req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionDetailResponse> update(@AuthenticationPrincipal AuthenticatedUser user,
                                                         @PathVariable UUID id,
                                                         @Valid @RequestBody UpsertElectionRequest req) {
        return ResponseEntity.ok(service.update(SocietyScope.require(user), id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user,
                                       @PathVariable UUID id) {
        service.delete(SocietyScope.require(user), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionDetailResponse> updateStatus(@AuthenticationPrincipal AuthenticatedUser user,
                                                               @PathVariable UUID id,
                                                               @Valid @RequestBody UpdateElectionStatusRequest req) {
        return ResponseEntity.ok(service.updateStatus(SocietyScope.require(user), id, req));
    }

    @PostMapping("/{id}/positions")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionDetailResponse> addPosition(@AuthenticationPrincipal AuthenticatedUser user,
                                                              @PathVariable UUID id,
                                                              @Valid @RequestBody UpsertPositionRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addPosition(SocietyScope.require(user), id, req));
    }

    @DeleteMapping("/{id}/positions/{positionId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionDetailResponse> deletePosition(@AuthenticationPrincipal AuthenticatedUser user,
                                                                 @PathVariable UUID id,
                                                                 @PathVariable UUID positionId) {
        return ResponseEntity.ok(service.deletePosition(SocietyScope.require(user), id, positionId));
    }

    @PostMapping("/{id}/candidates")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionDetailResponse> addCandidate(@AuthenticationPrincipal AuthenticatedUser user,
                                                               @PathVariable UUID id,
                                                               @Valid @RequestBody UpsertCandidateRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(service.addCandidate(SocietyScope.require(user), id, req));
    }

    @DeleteMapping("/{id}/candidates/{candidateId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionDetailResponse> deleteCandidate(@AuthenticationPrincipal AuthenticatedUser user,
                                                                  @PathVariable UUID id,
                                                                  @PathVariable UUID candidateId) {
        return ResponseEntity.ok(service.deleteCandidate(SocietyScope.require(user), id, candidateId));
    }

    /** Records the outcome declared offline by the society. No ballots are accepted here. */
    @PostMapping("/{id}/results")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ElectionDetailResponse> publishResults(@AuthenticationPrincipal AuthenticatedUser user,
                                                                 @PathVariable UUID id,
                                                                 @Valid @RequestBody PublishResultsRequest req) {
        return ResponseEntity.ok(service.publishResults(SocietyScope.require(user), id, req));
    }
}
