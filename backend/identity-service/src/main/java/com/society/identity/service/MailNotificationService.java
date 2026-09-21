package com.society.identity.service;

import com.society.identity.domain.SubscriptionPayment;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

@Service
public class MailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(MailNotificationService.class);
    private static final DateTimeFormatter PAID_AT =
            DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a z").withZone(ZoneId.of("Asia/Kolkata"));

    private final JavaMailSender mailSender;
    private final PaymentReceiptPdfService paymentReceiptPdfService;
    private final boolean enabled;
    private final String fromAddress;
    private final String ownerInbox;
    private final String appUrl;

    public MailNotificationService(
            JavaMailSender mailSender,
            PaymentReceiptPdfService paymentReceiptPdfService,
            @Value("${app.mail.enabled:false}") boolean enabled,
            @Value("${app.mail.from:contact.societysimplify@gmail.com}") String fromAddress,
            @Value("${app.mail.owner-inbox:contact.societysimplify@gmail.com}") String ownerInbox,
            @Value("${app.mail.app-url:https://societysimplify.vercel.app}") String appUrl) {
        this.mailSender = mailSender;
        this.paymentReceiptPdfService = paymentReceiptPdfService;
        this.enabled = enabled;
        this.fromAddress = fromAddress;
        this.ownerInbox = ownerInbox;
        this.appUrl = normalizeAppUrl(appUrl);
    }

    public boolean isEnabled() {
        return enabled;
    }

    @Async
    public void sendSocietyRegisteredEmails(
            String adminName,
            String adminEmail,
            String societyName,
            String societyCode,
            String city,
            SubscriptionPayment payment) {
        if (!enabled) {
            log.info("Mail disabled — skipped society registration emails for {}", societyCode);
            return;
        }

        String safeCity = (city == null || city.isBlank()) ? "—" : city.trim();
        String amount = payment != null
                ? RazorpayPaymentService.formatInr(payment.getAmountPaise())
                : "—";
        String plan = payment != null && payment.getBillingPeriod() != null
                ? RazorpayPaymentService.planLabel(payment.getBillingPeriod())
                : "Society workspace";
        String paymentId = payment != null && payment.getRazorpayPaymentId() != null
                ? payment.getRazorpayPaymentId()
                : "—";
        String orderId = payment != null && payment.getRazorpayOrderId() != null
                ? payment.getRazorpayOrderId()
                : "—";
        String paidAt = payment != null && payment.getPaidAt() != null
                ? PAID_AT.format(payment.getPaidAt())
                : "—";

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(adminEmail);
            helper.setSubject("Welcome to SocietySimplify — payment confirmed · " + societyName);
            helper.setText("""
                    Dear %s,

                    Welcome to SocietySimplify — your society workspace is ready.

                    ----------------------------------------
                    WORKSPACE
                    ----------------------------------------
                    Society: %s
                    Society code: %s
                    Website: %s
                    Sign in: %s/login

                    ----------------------------------------
                    PAYMENT
                    ----------------------------------------
                    Status: Paid
                    Plan: %s
                    Amount: %s
                    Paid at: %s

                    Your official SocietySimplify payment receipt is attached as a PDF.

                    ----------------------------------------
                    NEXT STEPS
                    ----------------------------------------
                    1) Sign in at %s/login
                    2) Open Dashboard and add committee contacts
                    3) Set the monthly maintenance amount
                    4) Share your society code so residents can join

                    Need help? Reply to this email or write to %s.

                    Warm regards,
                    Team SocietySimplify
                    %s
                    """.formatted(
                    adminName,
                    societyName,
                    societyCode,
                    appUrl,
                    appUrl,
                    plan,
                    amount,
                    paidAt,
                    appUrl,
                    fromAddress,
                    appUrl), false);

            if (payment != null) {
                byte[] pdfBytes = paymentReceiptPdfService.generate(
                        adminName, adminEmail, societyName, societyCode, payment);
                String filename = paymentReceiptPdfService.filename(
                        payment.getReceiptNumber(), societyCode);
                helper.addAttachment(filename, new ByteArrayResource(pdfBytes), "application/pdf");
            }

            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            log.warn("Failed sending admin welcome email (with PDF) to {}: {}", adminEmail, ex.getMessage());
        }

        try {
            SimpleMailMessage owner = new SimpleMailMessage();
            owner.setFrom(fromAddress);
            owner.setTo(ownerInbox);
            owner.setSubject("[SocietySimplify] New paid society — " + societyName);
            owner.setText("""
                    New society signup (payment received)

                    Society name: %s
                    Society code: %s
                    City: %s
                    Admin name: %s
                    Admin email: %s

                    Payment status: Paid
                    Plan: %s
                    Amount: %s
                    Payment ID: %s
                    Order ID: %s
                    """.formatted(
                    societyName,
                    societyCode,
                    safeCity,
                    adminName,
                    adminEmail,
                    plan,
                    amount,
                    paymentId,
                    orderId));
            mailSender.send(owner);
        } catch (Exception ex) {
            log.warn("Failed sending owner notification for society {}: {}", societyCode, ex.getMessage());
        }
    }

    @Async
    public void sendMemberWelcomeEmail(
            String memberName,
            String memberEmail,
            String societyName,
            String societyCode,
            String flatNumber) {
        if (!enabled) {
            log.info("Mail disabled — skipped member welcome email for {}", memberEmail);
            return;
        }

        try {
            SimpleMailMessage welcome = new SimpleMailMessage();
            welcome.setFrom(fromAddress);
            welcome.setTo(memberEmail);
            welcome.setSubject("Welcome to " + societyName + " on SocietySimplify");
            welcome.setText("""
                    Dear %s,

                    Welcome to SocietySimplify.

                    You have joined:
                    • Society: %s
                    • Society code: %s
                    • Flat / unit: %s

                    Website: %s
                    Sign in: %s/login

                    After signing in you can view dues, notices, society bank details,
                    raise payment claims, and submit complaints to your committee.

                    Questions? Contact your society committee, or email %s.

                    Warm regards,
                    Team SocietySimplify
                    %s
                    """.formatted(
                    memberName,
                    societyName,
                    societyCode,
                    flatNumber,
                    appUrl,
                    appUrl,
                    fromAddress,
                    appUrl));
            mailSender.send(welcome);
        } catch (Exception ex) {
            log.warn("Failed sending member welcome email to {}: {}", memberEmail, ex.getMessage());
        }
    }

    public void sendContactEnquiry(com.society.identity.dto.PaymentDtos.ContactEnquiryRequest req) {
        if (!enabled) {
            log.info("Mail disabled — contact enquiry from {} not emailed (enable MAIL_ENABLED)", req.email());
            // Still accept the enquiry locally so UX works when SMTP is off (dev).
            return;
        }
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(ownerInbox);
            msg.setReplyTo(req.email().trim());
            String society = req.societyName() == null || req.societyName().isBlank()
                    ? "—" : req.societyName().trim();
            msg.setSubject("[SocietySimplify] Pricing enquiry — " + society);
            msg.setText("""
                    New Get-in-touch enquiry (dynamic pricing)

                    Name: %s
                    Email: %s
                    Mobile: %s
                    Society: %s
                    City: %s
                    Preferred period: %s

                    Requirements / expectations:
                    %s

                    ---
                    Reply to the customer email above to continue the discussion, then complete payment on SocietySimplify.
                    """.formatted(
                    req.name().trim(),
                    req.email().trim(),
                    req.mobile() == null || req.mobile().isBlank() ? "—" : req.mobile().trim(),
                    society,
                    req.city() == null || req.city().isBlank() ? "—" : req.city().trim(),
                    req.preferredPeriod() == null || req.preferredPeriod().isBlank() ? "—" : req.preferredPeriod().trim(),
                    req.message().trim()));
            mailSender.send(msg);
        } catch (Exception ex) {
            log.warn("Failed sending contact enquiry email: {}", ex.getMessage());
            throw new com.society.identity.exception.ApiExceptions.BadRequestException(
                    "Could not send your enquiry right now. Please email " + ownerInbox + " directly.");
        }
    }

    @Async
    public void sendSubscriptionRenewedEmails(
            String adminName,
            String adminEmail,
            String societyName,
            String societyCode,
            java.time.Instant expiresAt,
            SubscriptionPayment payment) {
        if (!enabled) {
            log.info("Mail disabled — skipped renewal emails for {}", societyCode);
            return;
        }

        String amount = payment != null
                ? RazorpayPaymentService.formatInr(payment.getAmountPaise())
                : "—";
        String plan = payment != null && payment.getBillingPeriod() != null
                ? RazorpayPaymentService.planLabel(payment.getBillingPeriod())
                : "Society workspace";
        String paidAt = payment != null && payment.getPaidAt() != null
                ? PAID_AT.format(payment.getPaidAt())
                : "—";
        String expires = expiresAt == null ? "—" : PAID_AT.format(expiresAt);

        try {
            MimeMessage mimeMessage = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(adminEmail);
            helper.setSubject("SocietySimplify subscription renewed — " + societyName);
            helper.setText("""
                    Dear %s,

                    Thank you — your SocietySimplify subscription payment is confirmed.

                    Society: %s
                    Society code: %s
                    Plan: %s
                    Amount: %s
                    Paid at: %s
                    Access until: %s

                    Your payment receipt is attached as a PDF.
                    Sign in: %s/login

                    Warm regards,
                    Team SocietySimplify
                    """.formatted(
                    adminName, societyName, societyCode, plan, amount, paidAt, expires, appUrl), false);

            if (payment != null) {
                byte[] pdfBytes = paymentReceiptPdfService.generate(
                        adminName, adminEmail, societyName, societyCode, payment);
                String filename = paymentReceiptPdfService.filename(
                        payment.getReceiptNumber(), societyCode);
                helper.addAttachment(filename, new ByteArrayResource(pdfBytes), "application/pdf");
            }
            mailSender.send(mimeMessage);
        } catch (Exception ex) {
            log.warn("Failed sending renewal email to {}: {}", adminEmail, ex.getMessage());
        }

        try {
            SimpleMailMessage owner = new SimpleMailMessage();
            owner.setFrom(fromAddress);
            owner.setTo(ownerInbox);
            owner.setSubject("[SocietySimplify] Renewal paid — " + societyName);
            owner.setText("""
                    Subscription renewed

                    Society: %s (%s)
                    Admin: %s <%s>
                    Plan: %s
                    Amount: %s
                    Access until: %s
                    """.formatted(
                    societyName, societyCode, adminName, adminEmail, plan, amount, expires));
            mailSender.send(owner);
        } catch (Exception ex) {
            log.warn("Failed sending owner renewal notice for {}: {}", societyCode, ex.getMessage());
        }
    }

    private static String normalizeAppUrl(String url) {
        if (url == null || url.isBlank()) {
            return "https://societysimplify.vercel.app";
        }
        String cleaned = url.trim().replaceAll("/+$", "");
        if (cleaned.contains("localhost") || cleaned.contains("127.0.0.1")) {
            return "https://societysimplify.vercel.app";
        }
        return cleaned;
    }
}
