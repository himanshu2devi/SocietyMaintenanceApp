package com.society.core.web;

import com.society.core.dto.PaymentQrDtos.*;
import com.society.core.security.AuthenticatedUser;
import com.society.core.security.SocietyScope;
import com.society.core.service.PaymentQrService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payment-qr")
public class PaymentQrController {

    private final PaymentQrService service;

    public PaymentQrController(PaymentQrService service) {
        this.service = service;
    }

    /** Members and admins both need the QR to pay / verify maintenance. */
    @GetMapping
    public ResponseEntity<PaymentQrResponse> get(@AuthenticationPrincipal AuthenticatedUser user) {
        return ResponseEntity.ok(service.get(SocietyScope.require(user)));
    }

    @PutMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<PaymentQrResponse> upsert(@AuthenticationPrincipal AuthenticatedUser user,
                                                    @Valid @RequestBody UpsertPaymentQrRequest req) {
        return ResponseEntity.ok(service.upsert(SocietyScope.require(user), user.userId(), req));
    }

    @DeleteMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal AuthenticatedUser user) {
        service.delete(SocietyScope.require(user));
        return ResponseEntity.noContent().build();
    }
}
