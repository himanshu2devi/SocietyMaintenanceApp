package com.society.identity.service;

import com.razorpay.Order;
import com.razorpay.Payment;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import com.society.identity.domain.BillingPeriod;
import com.society.identity.domain.PaymentStatus;
import com.society.identity.domain.Role;
import com.society.identity.domain.Society;
import com.society.identity.domain.SubscriptionPayment;
import com.society.identity.domain.User;
import com.society.identity.dto.PaymentDtos.*;
import com.society.identity.exception.ApiExceptions.*;
import com.society.identity.repository.SocietyRepository;
import com.society.identity.repository.SubscriptionPaymentRepository;
import com.society.identity.repository.UserRepository;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.HexFormat;
import java.util.UUID;

@Service
public class RazorpayPaymentService {

    private static final Logger log = LoggerFactory.getLogger(RazorpayPaymentService.class);
    private static final DateTimeFormatter RECEIPT_DAY =
            DateTimeFormatter.ofPattern("yyyyMMdd").withZone(ZoneId.of("Asia/Kolkata"));

    public static final long MIN_AMOUNT_PAISE = 100L;
    public static final long MAX_AMOUNT_PAISE = 50_000_000L;

    private final SubscriptionPaymentRepository paymentRepository;
    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;

    private final String keyId;
    private final String keySecret;
    private final String webhookSecret;
    private final String currency;

    public RazorpayPaymentService(
            SubscriptionPaymentRepository paymentRepository,
            SocietyRepository societyRepository,
            UserRepository userRepository,
            @Value("${app.razorpay.key-id:}") String keyId,
            @Value("${app.razorpay.key-secret:}") String keySecret,
            @Value("${app.razorpay.webhook-secret:}") String webhookSecret,
            @Value("${app.razorpay.currency:INR}") String currency) {
        this.paymentRepository = paymentRepository;
        this.societyRepository = societyRepository;
        this.userRepository = userRepository;
        this.keyId = sanitizeKey(keyId);
        this.keySecret = sanitizeKey(keySecret);
        this.webhookSecret = sanitizeKey(webhookSecret);
        this.currency = currency == null || currency.isBlank() ? "INR" : currency.trim().toUpperCase();

        if (isConfigured()) {
            String mode = this.keyId.startsWith("rzp_test_") ? "TEST"
                    : this.keyId.startsWith("rzp_live_") ? "LIVE" : "UNKNOWN";
            log.info("Razorpay configured: mode={}, keyIdPrefix={}…{}, secretLength={}",
                    mode,
                    this.keyId.substring(0, Math.min(12, this.keyId.length())),
                    this.keyId.length() > 8 ? this.keyId.substring(this.keyId.length() - 4) : "",
                    this.keySecret.length());
        } else {
            log.warn("Razorpay is NOT configured — set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET");
        }
    }

    private static String sanitizeKey(String value) {
        if (value == null) {
            return "";
        }
        return value.trim().replace(" ", "").replace("\r", "").replace("\n", "");
    }

    public boolean isConfigured() {
        return StringUtils.hasText(keyId) && StringUtils.hasText(keySecret);
    }

    public SubscriptionPricingResponse pricing() {
        return new SubscriptionPricingResponse(
                isConfigured(),
                isConfigured() ? keyId : null,
                currency,
                MIN_AMOUNT_PAISE,
                MAX_AMOUNT_PAISE,
                "Custom society workspace",
                "Choose 3 months, 6 months, or 1 year. Pricing is finalised with SocietySimplify after discussion — enter the agreed amount at checkout and pay only on this platform via Razorpay. Never pay agents or individuals directly.",
                "/contact"
        );
    }

    private static final ZoneId BILLING_ZONE = ZoneId.of("Asia/Kolkata");

    public static String planLabel(BillingPeriod period) {
        if (period == null) {
            return "Society workspace";
        }
        return switch (period) {
            case QUARTERLY -> "3-month society workspace";
            case SIX_MONTHS -> "6-month society workspace";
            case YEARLY -> "1-year society workspace";
        };
    }

    public static int monthsFor(BillingPeriod period) {
        if (period == null) {
            return 12;
        }
        return switch (period) {
            case QUARTERLY -> 3;
            case SIX_MONTHS -> 6;
            case YEARLY -> 12;
        };
    }

    /**
     * Calendar months in Asia/Kolkata (Instant cannot plus Months directly).
     */
    public static Instant expiresAtFrom(Instant from, BillingPeriod period) {
        Instant base = from == null ? Instant.now() : from;
        return base.atZone(BILLING_ZONE).plusMonths(monthsFor(period)).toInstant();
    }

    /** Extend from max(now, currentExpiry) so early renewals add full term. */
    public static Instant renewExpiresAt(Instant currentExpiry, BillingPeriod period) {
        Instant start = Instant.now();
        if (currentExpiry != null && currentExpiry.isAfter(start)) {
            start = currentExpiry;
        }
        return expiresAtFrom(start, period);
    }

    @Transactional
    public CreateOrderResponse createOrder(CreateOrderRequest req) {
        if (!isConfigured()) {
            throw new BadRequestException(
                    "Online payments are not configured yet. Please contact SocietySimplify support.");
        }

        String societyCode = req.societyCode().trim();
        String adminEmail = req.adminEmail().trim().toLowerCase();
        long amountPaise = req.amountPaise();
        BillingPeriod period = req.billingPeriod();
        validateAmount(amountPaise);

        if (societyRepository.existsBySocietyCode(societyCode)) {
            throw new ConflictException("Society code already registered. Choose another code or sign in.");
        }
        if (userRepository.existsByEmail(adminEmail)) {
            throw new ConflictException("Email already in use. Sign in, or use a different email.");
        }

        return createRazorpayOrder(
                req.societyName().trim(),
                societyCode,
                req.adminName().trim(),
                adminEmail,
                amountPaise,
                period,
                "societysimplify_signup"
        );
    }

    @Transactional
    public CreateOrderResponse createRenewalOrder(CreateRenewalOrderRequest req) {
        if (!isConfigured()) {
            throw new BadRequestException(
                    "Online payments are not configured yet. Please contact SocietySimplify support.");
        }

        String societyCode = req.societyCode().trim();
        String adminEmail = req.adminEmail().trim().toLowerCase();
        long amountPaise = req.amountPaise();
        BillingPeriod period = req.billingPeriod();
        validateAmount(amountPaise);

        Society society = societyRepository.findBySocietyCode(societyCode)
                .orElseThrow(() -> new NotFoundException("Society code not found."));
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BadRequestException("Admin email not found for this society."));
        if (!admin.getSocietyId().equals(society.getId()) || admin.getRole() != Role.ADMIN) {
            throw new BadRequestException("Use the committee admin email registered for this society.");
        }

        return createRazorpayOrder(
                society.getName(),
                societyCode,
                admin.getFullName(),
                adminEmail,
                amountPaise,
                period,
                "societysimplify_renewal"
        );
    }

    private CreateOrderResponse createRazorpayOrder(
            String societyName,
            String societyCode,
            String adminName,
            String adminEmail,
            long amountPaise,
            BillingPeriod period,
            String product) {
        String receipt = "sw" + RECEIPT_DAY.format(Instant.now())
                + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountPaise);
            orderRequest.put("currency", currency);
            orderRequest.put("receipt", receipt);
            orderRequest.put("payment_capture", 1);
            JSONObject notes = new JSONObject();
            notes.put("societyCode", societyCode);
            notes.put("adminEmail", adminEmail);
            notes.put("societyName", societyName);
            notes.put("billingPeriod", period.name());
            notes.put("product", product);
            orderRequest.put("notes", notes);

            Order order = client.orders.create(orderRequest);
            String orderId = order.get("id");

            SubscriptionPayment payment = new SubscriptionPayment();
            payment.setRazorpayOrderId(orderId);
            payment.setAmountPaise(amountPaise);
            payment.setBillingPeriod(period);
            payment.setCurrency(currency);
            payment.setStatus(PaymentStatus.CREATED);
            payment.setSocietyCode(societyCode);
            payment.setAdminEmail(adminEmail);
            payment.setAdminName(adminName);
            payment.setSocietyName(societyName);
            payment.setReceiptNumber(receipt);
            paymentRepository.save(payment);

            return new CreateOrderResponse(
                    keyId,
                    orderId,
                    amountPaise,
                    formatInr(amountPaise),
                    currency,
                    receipt,
                    period,
                    planLabel(period)
            );
        } catch (RazorpayException ex) {
            String detail = ex.getMessage() == null ? "" : ex.getMessage();
            log.error("Razorpay order creation failed: {}", detail);
            if (detail.toLowerCase().contains("authentication failed")
                    || detail.toLowerCase().contains("invalid key")
                    || detail.contains("BAD_REQUEST_ERROR:Authentication")) {
                throw new BadRequestException(
                        "Razorpay authentication failed. Check RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET, then restart identity.");
            }
            if (detail.toLowerCase().contains("amount")) {
                throw new BadRequestException(
                        "Razorpay rejected the payment amount. Check the agreed amount and try again.");
            }
            throw new BadRequestException(
                    "Could not start payment with Razorpay. Please try again in a moment.");
        }
    }

    private static void validateAmount(long amountPaise) {
        if (amountPaise < MIN_AMOUNT_PAISE || amountPaise > MAX_AMOUNT_PAISE) {
            throw new BadRequestException(
                    "Enter a valid agreed amount between "
                            + formatInr(MIN_AMOUNT_PAISE) + " and " + formatInr(MAX_AMOUNT_PAISE) + ".");
        }
    }

    @Transactional
    public SubscriptionPayment verifyAndMarkPaid(String orderId, String paymentId, String signature) {
        if (!isConfigured()) {
            throw new BadRequestException("Online payments are not configured yet.");
        }
        if (!StringUtils.hasText(orderId) || !StringUtils.hasText(paymentId) || !StringUtils.hasText(signature)) {
            throw new BadRequestException("Payment confirmation is incomplete. Please complete Pay Now again.");
        }

        SubscriptionPayment local = paymentRepository.findByRazorpayOrderId(orderId.trim())
                .orElseThrow(() -> new BadRequestException(
                        "Unknown payment order. Please start Pay Now again."));

        if (local.getStatus() == PaymentStatus.CONSUMED) {
            throw new ConflictException(
                    "This payment was already used. Please sign in, or start a new renewal payment.");
        }
        if (local.getStatus() == PaymentStatus.FAILED) {
            throw new BadRequestException("This payment failed. Please try Pay Now again.");
        }

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", orderId.trim());
            attributes.put("razorpay_payment_id", paymentId.trim());
            attributes.put("razorpay_signature", signature.trim());
            boolean valid = Utils.verifyPaymentSignature(attributes, keySecret);
            if (!valid) {
                throw new BadRequestException("Payment signature mismatch. Payment was not accepted.");
            }
        } catch (RazorpayException ex) {
            log.warn("Razorpay signature verification error: {}", ex.getMessage());
            throw new BadRequestException("Could not verify payment. Please try again or contact support.");
        }

        final UUID localId = local.getId();
        paymentRepository.findByRazorpayPaymentId(paymentId.trim()).ifPresent(existing -> {
            if (!existing.getId().equals(localId) && existing.getStatus() == PaymentStatus.CONSUMED) {
                throw new ConflictException("This payment was already used. Contact support if you were charged twice.");
            }
        });

        try {
            RazorpayClient client = new RazorpayClient(keyId, keySecret);
            Payment remote = client.payments.fetch(paymentId.trim());
            String status = remote.get("status");
            int amount = remote.get("amount");
            String remoteOrderId = remote.get("order_id");

            if (!orderId.trim().equals(remoteOrderId)) {
                throw new BadRequestException("Payment does not match the checkout order.");
            }
            if (amount != local.getAmountPaise()) {
                throw new BadRequestException("Paid amount does not match the checkout order.");
            }
            if (!"captured".equalsIgnoreCase(status) && !"authorized".equalsIgnoreCase(status)) {
                throw new BadRequestException(
                        "Payment is not complete yet (status: " + status + "). Wait a moment and retry.");
            }
        } catch (RazorpayException ex) {
            log.warn("Razorpay payment fetch failed for {}: {}", paymentId, ex.getMessage());
            throw new BadRequestException(
                    "Could not confirm payment with the bank gateway. Check your internet and retry.");
        }

        local.setRazorpayPaymentId(paymentId.trim());
        local.setRazorpaySignature(signature.trim());
        if (local.getStatus() != PaymentStatus.PAID) {
            local.setStatus(PaymentStatus.PAID);
            local.setPaidAt(Instant.now());
        }
        return paymentRepository.save(local);
    }

    @Transactional
    public SubscriptionPayment consumeForRegistration(
            SubscriptionPayment paid,
            String societyCode,
            String adminEmail,
            UUID societyId) {
        if (paid.getStatus() == PaymentStatus.CONSUMED) {
            throw new ConflictException("This payment was already used to create a workspace. Please sign in.");
        }
        if (paid.getStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Payment is not confirmed yet.");
        }
        if (!paid.getSocietyCode().equalsIgnoreCase(societyCode.trim())) {
            throw new BadRequestException("Society code does not match the paid checkout. Use the same details.");
        }
        if (!paid.getAdminEmail().equalsIgnoreCase(adminEmail.trim())) {
            throw new BadRequestException("Email does not match the paid checkout. Use the same admin email.");
        }
        paid.setStatus(PaymentStatus.CONSUMED);
        paid.setSocietyId(societyId);
        return paymentRepository.save(paid);
    }

    @Transactional
    public SubscriptionPayment consumeForRenewal(SubscriptionPayment paid, Society society, String adminEmail) {
        if (paid.getStatus() == PaymentStatus.CONSUMED) {
            throw new ConflictException("This payment was already applied. Please sign in.");
        }
        if (paid.getStatus() != PaymentStatus.PAID) {
            throw new BadRequestException("Payment is not confirmed yet.");
        }
        if (!paid.getSocietyCode().equalsIgnoreCase(society.getSocietyCode())) {
            throw new BadRequestException("Society code does not match this payment.");
        }
        if (!paid.getAdminEmail().equalsIgnoreCase(adminEmail.trim())) {
            throw new BadRequestException("Email does not match this payment.");
        }
        BillingPeriod period = paid.getBillingPeriod() == null ? BillingPeriod.YEARLY : paid.getBillingPeriod();
        society.setBillingPeriod(period);
        society.setSubscriptionExpiresAt(renewExpiresAt(society.getSubscriptionExpiresAt(), period));
        societyRepository.save(society);

        paid.setStatus(PaymentStatus.CONSUMED);
        paid.setSocietyId(society.getId());
        return paymentRepository.save(paid);
    }

    public void applyNewSubscription(Society society, SubscriptionPayment payment) {
        BillingPeriod period = payment.getBillingPeriod() == null ? BillingPeriod.YEARLY : payment.getBillingPeriod();
        Instant paidAt = payment.getPaidAt() == null ? Instant.now() : payment.getPaidAt();
        society.setBillingPeriod(period);
        society.setSubscriptionExpiresAt(expiresAtFrom(paidAt, period));
    }

    @Transactional
    public void handleWebhook(String payload, String signatureHeader) {
        if (!StringUtils.hasText(webhookSecret)) {
            log.warn("Razorpay webhook received but RAZORPAY_WEBHOOK_SECRET is not set — ignored");
            return;
        }
        if (!StringUtils.hasText(signatureHeader) || !verifyWebhookSignature(payload, signatureHeader)) {
            throw new UnauthorizedException("Invalid Razorpay webhook signature");
        }

        JSONObject body = new JSONObject(payload);
        String event = body.optString("event");
        if (!"payment.captured".equals(event) && !"order.paid".equals(event)) {
            return;
        }

        JSONObject paymentEntity = body.optJSONObject("payload") != null
                && body.getJSONObject("payload").optJSONObject("payment") != null
                ? body.getJSONObject("payload").getJSONObject("payment").optJSONObject("entity")
                : null;
        if (paymentEntity == null) {
            return;
        }

        String paymentId = paymentEntity.optString("id");
        String orderId = paymentEntity.optString("order_id");
        int amount = paymentEntity.optInt("amount");
        if (!StringUtils.hasText(orderId)) {
            return;
        }

        paymentRepository.findByRazorpayOrderId(orderId).ifPresent(local -> {
            if (local.getStatus() == PaymentStatus.CONSUMED || local.getStatus() == PaymentStatus.PAID) {
                return;
            }
            if (amount > 0 && amount != local.getAmountPaise()) {
                log.warn("Webhook amount mismatch for order {}: expected {}, got {}",
                        orderId, local.getAmountPaise(), amount);
                return;
            }
            local.setRazorpayPaymentId(paymentId);
            local.setStatus(PaymentStatus.PAID);
            local.setPaidAt(Instant.now());
            paymentRepository.save(local);
            log.info("Webhook marked order {} as PAID", orderId);
        });
    }

    private boolean verifyWebhookSignature(String payload, String signatureHeader) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
            String expected = HexFormat.of().formatHex(hash);
            return constantTimeEquals(expected, signatureHeader.trim());
        } catch (Exception ex) {
            log.warn("Webhook signature verify failed: {}", ex.getMessage());
            return false;
        }
    }

    private static boolean constantTimeEquals(String a, String b) {
        if (a == null || b == null || a.length() != b.length()) {
            return false;
        }
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    public static String formatInr(long amountPaise) {
        long rupees = amountPaise / 100;
        long paise = Math.abs(amountPaise % 100);
        if (paise == 0) {
            return "₹" + String.format("%,d", rupees);
        }
        return "₹" + String.format("%,d", rupees) + "." + String.format("%02d", paise);
    }
}
