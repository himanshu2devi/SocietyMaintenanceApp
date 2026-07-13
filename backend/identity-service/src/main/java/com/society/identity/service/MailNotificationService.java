package com.society.identity.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class MailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(MailNotificationService.class);

    private final JavaMailSender mailSender;
    private final boolean enabled;
    private final String fromAddress;
    private final String ownerInbox;
    private final String appUrl;

    public MailNotificationService(
            JavaMailSender mailSender,
            @Value("${app.mail.enabled:false}") boolean enabled,
            @Value("${app.mail.from:societywale.in@gmail.com}") String fromAddress,
            @Value("${app.mail.owner-inbox:societywale.in@gmail.com}") String ownerInbox,
            @Value("${app.mail.app-url:https://societywale.in}") String appUrl) {
        this.mailSender = mailSender;
        this.enabled = enabled;
        this.fromAddress = fromAddress;
        this.ownerInbox = ownerInbox;
        this.appUrl = appUrl;
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
            String city) {
        if (!enabled) {
            log.info("Mail disabled — skipped society registration emails for {}", societyCode);
            return;
        }

        String safeCity = (city == null || city.isBlank()) ? "—" : city.trim();

        try {
            SimpleMailMessage welcome = baseMessage();
            welcome.setTo(adminEmail);
            welcome.setSubject("Welcome to SocietyWale — " + societyName);
            welcome.setText("""
                    Dear %s,

                    Welcome to SocietyWale!

                    Your society workspace is ready:
                    • Society: %s
                    • Society code: %s
                    • Sign in: %s/login

                    Next steps for your committee:
                    1) Sign in and open your Dashboard
                    2) Publish committee contacts and bank details
                    3) Set the monthly maintenance amount
                    4) Share your society code so residents can join

                    Need help? Reply to this email or write to %s.

                    Warm regards,
                    Team SocietyWale
                    %s
                    """.formatted(adminName, societyName, societyCode, appUrl, fromAddress, appUrl));
            mailSender.send(welcome);
        } catch (Exception ex) {
            log.warn("Failed sending admin welcome email to {}: {}", adminEmail, ex.getMessage());
        }

        try {
            SimpleMailMessage owner = baseMessage();
            owner.setTo(ownerInbox);
            owner.setSubject("[SocietyWale] New society registered — " + societyName);
            owner.setText("""
                    New society signup on SocietyWale

                    Society name: %s
                    Society code: %s
                    City: %s
                    Admin name: %s
                    Admin email: %s

                    Review in your dashboard / CRM as needed.
                    """.formatted(societyName, societyCode, safeCity, adminName, adminEmail));
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
            SimpleMailMessage welcome = baseMessage();
            welcome.setTo(memberEmail);
            welcome.setSubject("Welcome to " + societyName + " on SocietyWale");
            welcome.setText("""
                    Dear %s,

                    Welcome to SocietyWale.

                    You have joined:
                    • Society: %s
                    • Society code: %s
                    • Flat / unit: %s
                    • Sign in: %s/login

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
                    fromAddress,
                    appUrl));
            mailSender.send(welcome);
        } catch (Exception ex) {
            log.warn("Failed sending member welcome email to {}: {}", memberEmail, ex.getMessage());
        }
    }

    private SimpleMailMessage baseMessage() {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setFrom(fromAddress);
        return message;
    }
}
