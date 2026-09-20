package com.society.core.service;

import com.society.core.dto.AssistantDtos.*;
import com.society.core.exception.ApiExceptions.BadRequestException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.regex.Pattern;

@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);

    /**
     * Official SocietyWale knowledge base — keep in sync with public site & product.
     * The assistant speaks as SocietyWale (we/our), not a generic AI.
     */
    private static final String SYSTEM_PROMPT = """
            You are the official SocietyWale Assistant on https://societywale.in — the AI-powered \
            housing-society management platform built for Indian RWAs, cooperative societies, and gated communities.

            VOICE: Speak as SocietyWale ("we", "our product"). Be warm, confident, and helpful — like a knowledgeable \
            sales + support person on our team. Never say you are ChatGPT or a generic AI.

            UNDERSTAND QUESTIONS: Visitors may use informal English, Hinglish, or typos (e.g. "what benefit me", \
            "how it works", "kya features hai"). Interpret intent generously when it relates to societies or our product.

            WHO WE HELP:
            - Managing committees (secretary, treasurer, chairman) who run day-to-day society operations.
            - Residents/members who need dues, notices, bank details, and a way to notify payments or raise complaints.

            WHAT SOCIETYWALE INCLUDES (today — do not invent beyond this):
            - Member directory (flat-wise contacts, email, mobile)
            - Committee directory (chairman, secretary, treasurer contacts)
            - Maintenance tracking (rates, paid vs pending by flat/month, collection history)
            - Payment claims (members submit cash/online payment with reference; committee verifies and marks paid)
            - Society bank / UPI account publishing
            - Expense logging for committee spending
            - Notices & society rules (post, edit, notify members in-app)
            - Complaint tracker (open/update/close with clear status)
            - Financial reports — monthly/annual branded PDF downloads
            - Audit document storage
            - Analytics dashboard (admin)
            - AI tools for admins: WhatsApp dues reminder drafts (English/Hindi/Marathi), AI notice writer, committee digest

            HOW TO GET STARTED:
            - Committee / new society: Contact SocietyWale (Get in touch) to discuss requirements and agree pricing \
            (3 months, 6 months, or 1 year). Then complete payment on the SocietyWale signup page via Razorpay only — \
            never pay agents directly.
            - Residents: "Member signup" with society code from their committee + flat details. Default password is mobile; \
            email recommended for login and password reset.
            - After signup: add members, set maintenance, publish bank/UPI, post notices, track collections.
            - After the paid term ends, access stops automatically. Renew on the Renew subscription page with the agreed amount, \
            or cancel by not renewing.

            PRICING (when asked):
            - Plans: 3 months, 6 months, 1 year. Amount is custom per society after discussion.
            - There is no public price calculator or static list price on the website.
            - Direct customers to Contact / Get in touch. Do not invent rupee amounts.
            - Payment must happen only on societywale.in (Razorpay). Never suggest paying individuals or agencies offline.

            TRUST & SECURITY (when asked):
            - Each society has its own private workspace; data stays within that society.
            - Secure sign-in; committee controls writes; residents see appropriate read-only views.
            - Ad-free product focused on real society operations, not ads.

            CONTACT (give when user wants human help, demo, or custom onboarding):
            - Email: societywale.in@gmail.com
            - Contact / Get in touch page on societywale.in
            - Do not share or invent phone numbers.

            HOUSING SOCIETY TOPICS (allowed): maintenance collection, AGM prep, committee roles, RWAs, bye-laws style \
            communication, pending dues follow-up, transparency between committee and residents — tie answers back to how \
            SocietyWale helps when relevant.

            OFF-TOPIC (sports, celebrities, coding homework, recipes, politics, unrelated trivia):
            Politely decline in one sentence, then offer 2 concrete ways we can help (e.g. features overview, signup steps, contact team). \
            Do NOT answer the unrelated part.

            STYLE:
            - Default 3–5 short sentences. Use a blank line then dash-prefixed lines for lists (e.g. "- Member directory: ...").
            - Do NOT use markdown symbols like ** or ## — write plain professional text only.
            - End with a helpful next step (Sign up, Contact us, or ask a follow-up) when appropriate.
            - Never ask for passwords or OTPs. Never promise features we do not have (visitor QR gates, facility booking, payroll, native mobile app).
            """;

    /** Only block obvious credit-wasters — never block vague or benefit/how/what questions. */
    private static final Pattern[] OFF_TOPIC_DENY = {
            Pattern.compile("\\b(write|generate|debug)\\s+(me\\s+)?(a\\s+)?(python|java|javascript|code|script|program)\\b"),
            Pattern.compile("\\b(homework|assignment)\\s+(help|solution)\\b"),
            Pattern.compile("\\b(ipl|cricket\\s+world\\s+cup|football\\s+score|nba\\s+finals)\\b"),
            Pattern.compile("\\b(bitcoin|crypto\\s+price|stock\\s+market\\s+tip)\\b"),
            Pattern.compile("\\b(tell\\s+me\\s+a\\s+joke|write\\s+a\\s+poem)\\b"),
            Pattern.compile("\\b(weather\\s+forecast|recipe\\s+for)\\b"),
    };

    private static final String OFF_TOPIC_REPLY = """
            Thanks for reaching out! I'm the SocietyWale assistant — I help with our society management platform, \
            onboarding, features, and support for Indian housing societies.

            Ask me how SocietyWale can help your committee, what's included, or how to sign up. \
            Or contact us: societywale.in@gmail.com.""";

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public AssistantService(
            @Value("${app.openai.api-key:}") String apiKey,
            @Value("${app.openai.model:gpt-4o-mini}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model == null || model.isBlank() ? "gpt-4o-mini" : model.trim();
        this.restClient = RestClient.builder()
                .baseUrl("https://api.openai.com/v1")
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    /** Single-turn completion for admin AI tools (dues draft, notice writer, digest). */
    public String complete(String systemPrompt, String userMessage, double temperature, int maxTokens) {
        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", systemPrompt == null ? "" : systemPrompt.trim()));
        String user = userMessage == null ? "" : userMessage.trim();
        if (user.isBlank()) {
            throw new BadRequestException("A prompt is required.");
        }
        messages.add(Map.of("role", "user", "content", user));
        return callOpenAi(messages, temperature, maxTokens);
    }

    public ChatResponse chat(ChatRequest req) {
        String question = req.message().trim();
        if (question.isBlank()) {
            return new ChatResponse(
                    "Please ask a question about SocietyWale — features, pricing, signup, or how we help housing societies.");
        }

        Optional<String> blocked = tryBlockObviousOffTopic(question);
        if (blocked.isPresent()) {
            return new ChatResponse(blocked.get());
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        if (req.history() != null) {
            int start = Math.max(0, req.history().size() - 8);
            for (int i = start; i < req.history().size(); i++) {
                ChatMessage m = req.history().get(i);
                String role = "assistant".equalsIgnoreCase(m.role()) ? "assistant" : "user";
                String content = m.content() == null ? "" : m.content().trim();
                if (!content.isBlank()) {
                    messages.add(Map.of("role", role, "content", content));
                }
            }
        }
        messages.add(Map.of("role", "user", "content", question));
        return new ChatResponse(callOpenAi(messages, 0.35, 380));
    }

    /** Deny-list only — vague or benefit/how questions always reach OpenAI. */
    private Optional<String> tryBlockObviousOffTopic(String message) {
        String q = message.toLowerCase(Locale.ROOT);
        for (Pattern pattern : OFF_TOPIC_DENY) {
            if (pattern.matcher(q).find()) {
                return Optional.of(OFF_TOPIC_REPLY.trim());
            }
        }
        return Optional.empty();
    }

    @SuppressWarnings("unchecked")
    private String callOpenAi(List<Map<String, String>> messages, double temperature, int maxTokens) {
        if (!isConfigured()) {
            throw new BadRequestException(
                    "AI is not configured yet. Add OPENAI_API_KEY on the server and restart core-service.");
        }

        Map<String, Object> body = Map.of(
                "model", model,
                "temperature", temperature,
                "max_tokens", maxTokens,
                "messages", messages
        );

        try {
            Map<String, Object> response = restClient.post()
                    .uri("/chat/completions")
                    .contentType(MediaType.APPLICATION_JSON)
                    .header("Authorization", "Bearer " + apiKey)
                    .body(body)
                    .retrieve()
                    .body(Map.class);

            if (response == null || response.get("choices") == null) {
                throw new BadRequestException("AI did not return a reply. Please try again.");
            }
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices.isEmpty()) {
                throw new BadRequestException("AI did not return a reply. Please try again.");
            }
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String reply = message == null ? null : String.valueOf(message.getOrDefault("content", "")).trim();
            if (reply == null || reply.isBlank() || "null".equals(reply)) {
                throw new BadRequestException("AI did not return a reply. Please try again.");
            }
            return reply;
        } catch (RestClientResponseException ex) {
            log.warn("OpenAI API error status={} body={}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new BadRequestException("AI could not reach OpenAI. Check OPENAI_API_KEY and billing, then try again.");
        } catch (RestClientException ex) {
            log.warn("OpenAI API request failed: {}", ex.getMessage());
            throw new BadRequestException("AI is temporarily unavailable. Please try again shortly.");
        }
    }
}
