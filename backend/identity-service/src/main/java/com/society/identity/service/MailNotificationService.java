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
            @Value("${app.mail.from:societywale.in@gmail.com}") String fromAddress,
            @Value("${app.mail.owner-inbox:societywale.in@gmail.com}") String ownerInbox,
            @Value("${app.mail.app-url:https://societywale.in}") String appUrl) {
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
            helper.setSubject("Welcome to SocietyWale — payment confirmed · " + societyName);
            helper.setText("""
                    Dear %s,

                    Welcome to SocietyWale — your society workspace is ready.

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
                    Amount: %s
                    Paid at: %s

                    Your official SocietyWale payment receipt is attached as a PDF.

                    ----------------------------------------
                    NEXT STEPS
                    ----------------------------------------
                    1) Sign in at %s/login
                    2) Open Dashboard and add committee contacts
                    3) Set the monthly maintenance amount
                    4) Share your society code so residents can join

                    Need help? Reply to this email or write to %s.

                    Warm regards,
                    Team SocietyWale
                    %s
                    """.formatted(
                    adminName,
                    societyName,
                    societyCode,
                    appUrl,
                    appUrl,
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
            owner.setSubject("[SocietyWale] New paid society — " + societyName);
            owner.setText("""
                    New society signup (payment received)

                    Society name: %s
                    Society code: %s
                    City: %s
                    Admin name: %s
                    Admin email: %s

                    Payment status: Paid
                    Amount: %s
                    Payment ID: %s
                    Order ID: %s
                    """.formatted(
                    societyName,
                    societyCode,
                    safeCity,
                    adminName,
                    adminEmail,
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
            welcome.setSubject("Welcome to " + societyName + " on SocietyWale");
            welcome.setText("""
                    Dear %s,

                    Welcome to SocietyWale.

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
                    Team SocietyWale
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

    private static String normalizeAppUrl(String url) {
        if (url == null || url.isBlank()) {
            return "https://societywale.in";
        }
        String cleaned = url.trim().replaceAll("/+$", "");
        if (cleaned.contains("localhost") || cleaned.contains("127.0.0.1")) {
            return "https://societywale.in";
        }
        return cleaned;
    }
}
