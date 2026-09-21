package com.society.core.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.society.core.dto.SocietyAiDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import com.society.core.repository.ComplaintRepository;
import com.society.core.repository.NoticeRepository;
import com.society.core.repository.PaymentClaimRepository;
import com.society.core.repository.SocietyBankAccountRepository;
import com.society.core.service.MaintenanceOutstandingService.OutstandingSnapshot;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Service
public class SocietyAiService {

    private static final Set<String> LANGUAGES = Set.of("en", "hi", "mr");
    private static final String[] MONTHS_EN = {
            "", "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
    };

    private final AssistantService assistantService;
    private final MaintenanceOutstandingService outstandingService;
    private final PaymentClaimRepository claimRepository;
    private final ComplaintRepository complaintRepository;
    private final NoticeRepository noticeRepository;
    private final SocietyBankAccountRepository bankAccountRepository;
    private final ObjectMapper objectMapper;

    public SocietyAiService(
            AssistantService assistantService,
            MaintenanceOutstandingService outstandingService,
            PaymentClaimRepository claimRepository,
            ComplaintRepository complaintRepository,
            NoticeRepository noticeRepository,
            SocietyBankAccountRepository bankAccountRepository,
            ObjectMapper objectMapper) {
        this.assistantService = assistantService;
        this.outstandingService = outstandingService;
        this.claimRepository = claimRepository;
        this.complaintRepository = complaintRepository;
        this.noticeRepository = noticeRepository;
        this.bankAccountRepository = bankAccountRepository;
        this.objectMapper = objectMapper;
    }

    public boolean isConfigured() {
        return assistantService.isConfigured();
    }

    public DuesWhatsAppDraftResponse duesWhatsAppDraft(DuesWhatsAppDraftRequest req) {
        String language = normalizeLanguage(req.language());
        String period = MONTHS_EN[req.billingMonth()] + " " + req.billingYear();
        String amount = "₹" + req.amount().stripTrailingZeros().toPlainString();
        String system = """
                You write short WhatsApp collection reminders for Indian housing society committees.
                Output ONLY the message text — no quotes, no markdown, no labels, no explanation.
                Keep it polite, clear, and under 80 words.
                Include: greeting with member name, society name, flat, period, amount due,
                a simple soft request to please pay the dues,
                and ask them to inform the committee after payment.
                Do NOT mention bank details, UPI, payment apps, online/offline modes, or how/where to pay.
                Do not invent amounts that are not given.
                %s
                Keep person names, society names, flat numbers, and ₹ amounts as given.
                """.formatted(scriptInstruction(language));

        String user = """
                Language code: %s
                %s
                Society: %s
                Member: %s
                Flat: %s
                Mobile (optional): %s
                Period: %s
                Amount due: %s
                """.formatted(
                language,
                languageLabel(language),
                req.societyName().trim(),
                req.memberName().trim(),
                req.flatNumber().trim(),
                blankToDash(req.memberMobile()),
                period,
                amount
        );

        String message = assistantService.complete(system, user, 0.35, 240).trim();
        return new DuesWhatsAppDraftResponse(language, message);
    }

    public NoticeDraftResponse noticeDraft(NoticeDraftRequest req) {
        String language = normalizeLanguage(req.language());
        String priorityHint = blankToNull(req.priorityHint());

        String system = """
                You draft housing-society notices for Indian RWAs / cooperative societies using SocietySimplify.
                Return ONLY valid JSON with keys: title, body, priority.
                priority must be one of: LOW, NORMAL, HIGH, URGENT.
                title: max 120 characters, clear subject.
                body: 2–5 short paragraphs or lines suitable for residents (including older residents).
                No markdown fences, no extra keys, no commentary.
                %s
                Keep society names and English brand names as given when needed.
                Do not invent dates, fees, or rules that the topic does not mention.
                """.formatted(scriptInstruction(language));

        String user = """
                Language code: %s
                %s
                Society name: %s
                Topic / brief from committee: %s
                Priority hint (optional): %s
                """.formatted(
                language,
                languageLabel(language),
                req.societyName().trim(),
                req.topic().trim(),
                priorityHint == null ? "choose appropriately" : priorityHint
        );

        String raw = assistantService.complete(system, user, 0.3, 380).trim();
        JsonNode node = parseJsonObject(raw);
        String title = textOrEmpty(node, "title");
        String body = textOrEmpty(node, "body");
        String priority = normalizePriority(textOrEmpty(node, "priority"));
        if (title.isBlank() || body.isBlank()) {
            throw new BadRequestException("AI notice draft was incomplete. Please try again.");
        }
        if (title.length() > 250) {
            title = title.substring(0, 250);
        }
        if (body.length() > 4000) {
            body = body.substring(0, 4000);
        }
        return new NoticeDraftResponse(language, title, body, priority);
    }

    public AttentionDigestResponse attentionDigest(UUID societyId, String societyName, AttentionDigestRequest req) {
        String language = normalizeLanguage(req.language());
        OutstandingSnapshot dues = outstandingService.snapshot(societyId);
        int year = dues.billingYear();
        int month = dues.billingMonth();

        long pendingDuesCount = dues.pendingCount();
        BigDecimal pendingDuesAmount = dues.pendingAmount() == null ? BigDecimal.ZERO : dues.pendingAmount();
        long currentMonthPendingCount = dues.currentMonthPendingCount();
        BigDecimal currentMonthPendingAmount = dues.currentMonthPendingAmount() == null
                ? BigDecimal.ZERO : dues.currentMonthPendingAmount();
        long submittedClaims = claimRepository.countBySocietyIdAndStatus(societyId, "SUBMITTED");
        long openComplaints = complaintRepository.countBySocietyIdAndStatus(societyId, "OPEN");
        long unnotifiedNotices = noticeRepository.countBySocietyIdAndNotifiedAtIsNull(societyId);
        boolean hasBankAccount = !bankAccountRepository
                .findBySocietyIdAndActiveTrueOrderByPrimaryAccountDescCreatedAtDesc(societyId)
                .isEmpty();

        AttentionStats stats = new AttentionStats(
                pendingDuesCount,
                pendingDuesAmount,
                currentMonthPendingCount,
                currentMonthPendingAmount,
                submittedClaims,
                openComplaints,
                unnotifiedNotices,
                hasBankAccount,
                month,
                year
        );

        List<AttentionItem> items = new ArrayList<>();
        if (submittedClaims > 0) {
            items.add(new AttentionItem(
                    "CLAIMS",
                    "Payment claims waiting",
                    submittedClaims + " claim(s) need verification",
                    "claims"));
        }
        if (pendingDuesCount > 0) {
            String detail = currentMonthPendingCount + " pending in " + MONTHS_EN[month] + " " + year
                    + " · ₹" + currentMonthPendingAmount.stripTrailingZeros().toPlainString()
                    + " · total outstanding till date: "
                    + pendingDuesCount + " · ₹" + pendingDuesAmount.stripTrailingZeros().toPlainString()
                    + " (includes unrecorded flats, same as Maintenance Tracker)";
            items.add(new AttentionItem(
                    "DUES",
                    "Pending maintenance (till date)",
                    detail,
                    "maintenance"));
        }
        if (openComplaints > 0) {
            items.add(new AttentionItem(
                    "COMPLAINTS",
                    "Open complaints",
                    openComplaints + " complaint(s) still open",
                    "complaints"));
        }
        if (unnotifiedNotices > 0) {
            items.add(new AttentionItem(
                    "NOTICES",
                    "Notices not notified",
                    unnotifiedNotices + " notice(s) posted but members not notified yet",
                    "notices"));
        }
        if (!hasBankAccount) {
            items.add(new AttentionItem(
                    "ACCOUNTS",
                    "Bank / UPI details missing",
                    "Publish society bank or UPI details so residents know where to pay",
                    "accounts"));
        }

        String system = """
                You are SocietySimplify operations coach for an Indian housing society secretary.
                Given structured stats, write a short actionable digest.
                Return ONLY valid JSON: { "summary": "..." }.
                summary: 2–4 short sentences.
                %s
                Be practical and calm. If everything looks fine, say so and suggest one good next step.
                Do not invent numbers. Do not use markdown.
                """.formatted(scriptInstruction(language));

        String user = """
                Language code: %s
                %s
                Society: %s
                Current calendar month: %s %d
                Pending dues this month (tracker-aligned, includes not-yet-recorded): %d · ₹%s
                Total pending dues till date (all months up to today, tracker-aligned): %d · ₹%s
                Submitted payment claims: %d
                Open complaints: %d
                Notices not notified: %d
                Has active bank/UPI account: %s
                Attention items: %s
                """.formatted(
                language,
                languageLabel(language),
                societyName == null || societyName.isBlank() ? "Your society" : societyName.trim(),
                MONTHS_EN[month], year,
                currentMonthPendingCount,
                currentMonthPendingAmount.stripTrailingZeros().toPlainString(),
                pendingDuesCount,
                pendingDuesAmount.stripTrailingZeros().toPlainString(),
                submittedClaims,
                openComplaints,
                unnotifiedNotices,
                hasBankAccount,
                items.isEmpty() ? "none — operations look clear" : items.stream()
                        .map(i -> i.title() + ": " + i.detail())
                        .reduce((a, b) -> a + "; " + b).orElse("none")
        );

        String raw = assistantService.complete(system, user, 0.25, 320).trim();
        JsonNode node = parseJsonObject(raw);
        String summary = textOrEmpty(node, "summary");
        if (summary.isBlank()) {
            summary = items.isEmpty()
                    ? "Operations look clear for now. Keep maintenance and claims up to date this week."
                    : "Please review the highlighted items below — start with payment claims and pending dues.";
        }

        return new AttentionDigestResponse(language, summary, items, stats);
    }

    private static String normalizeLanguage(String language) {
        String code = language == null ? "" : language.trim().toLowerCase(Locale.ROOT);
        if (!LANGUAGES.contains(code)) {
            throw new BadRequestException("Language must be en, hi, or mr.");
        }
        return code;
    }

    /** Explicit script rules — models often emit Romanized Marathi unless Devanagari is required. */
    private static String scriptInstruction(String language) {
        return switch (language) {
            case "hi" -> """
                    Write entirely in Hindi using Devanagari script (हिन्दी लिपि) only.
                    Never use Romanized / Hinglish spelling (e.g. "Namaste" instead of "नमस्ते").
                    """;
            case "mr" -> """
                    Write entirely in natural Marathi (मराठी) using Devanagari script (देवनागरी) only.
                    Example style: "नमस्कार ... साठी ... रुपये बाकी आहेत. कृपया ..."
                    Never use Romanized Marathi / Manglish (e.g. "Namaskar", "karita", "apekshit ahe").
                    Do not write Hindi; use proper Marathi vocabulary and grammar.
                    """;
            default -> "Write entirely in clear English.";
        };
    }

    private static String languageLabel(String language) {
        return switch (language) {
            case "hi" -> "Output language: Hindi in Devanagari script only.";
            case "mr" -> "Output language: Marathi in Devanagari script only (not Romanized).";
            default -> "Output language: English.";
        };
    }

    private static String normalizePriority(String priority) {
        String p = priority == null ? "NORMAL" : priority.trim().toUpperCase(Locale.ROOT);
        return switch (p) {
            case "LOW", "NORMAL", "HIGH", "URGENT" -> p;
            default -> "NORMAL";
        };
    }

    private JsonNode parseJsonObject(String raw) {
        String text = raw == null ? "" : raw.trim();
        if (text.startsWith("```")) {
            text = text.replaceFirst("^```(?:json)?\\s*", "").replaceFirst("\\s*```$", "").trim();
        }
        try {
            JsonNode node = objectMapper.readTree(text);
            if (node == null || !node.isObject()) {
                throw new BadRequestException("AI returned an unexpected format. Please try again.");
            }
            return node;
        } catch (BadRequestException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new BadRequestException("AI returned an unexpected format. Please try again.");
        }
    }

    private static String textOrEmpty(JsonNode node, String field) {
        JsonNode value = node.get(field);
        if (value == null || value.isNull()) {
            return "";
        }
        return value.asText("").trim();
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static String blankToDash(String value) {
        String v = blankToNull(value);
        return v == null ? "—" : v;
    }
}
