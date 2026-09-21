package com.society.identity.web;

import com.society.identity.dto.PaymentDtos.*;
import com.society.identity.service.MailNotificationService;
import com.society.identity.service.RazorpayPaymentService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/payments")
public class PaymentController {

    private final RazorpayPaymentService paymentService;
    private final MailNotificationService mailNotificationService;

    public PaymentController(
            RazorpayPaymentService paymentService,
            MailNotificationService mailNotificationService) {
        this.paymentService = paymentService;
        this.mailNotificationService = mailNotificationService;
    }

    @GetMapping("/subscription/config")
    public ResponseEntity<SubscriptionPricingResponse> config() {
        return ResponseEntity.ok(paymentService.pricing());
    }

    @PostMapping("/razorpay/create-order")
    public ResponseEntity<CreateOrderResponse> createOrder(@Valid @RequestBody CreateOrderRequest req) {
        return ResponseEntity.ok(paymentService.createOrder(req));
    }

    @PostMapping("/razorpay/create-renewal-order")
    public ResponseEntity<CreateOrderResponse> createRenewalOrder(
            @Valid @RequestBody CreateRenewalOrderRequest req) {
        return ResponseEntity.ok(paymentService.createRenewalOrder(req));
    }

    @PostMapping("/contact-enquiry")
    public ResponseEntity<MessageResponse> contactEnquiry(@Valid @RequestBody ContactEnquiryRequest req) {
        mailNotificationService.sendContactEnquiry(req);
        return ResponseEntity.ok(new MessageResponse(
                "Thanks — your enquiry was sent to SocietySimplify. We will contact you shortly."));
    }

    @PostMapping("/razorpay/webhook")
    public ResponseEntity<Void> webhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        paymentService.handleWebhook(payload, signature);
        return ResponseEntity.ok().build();
    }
}
