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
import java.util.Map;

@Service
public class AssistantService {

    private static final Logger log = LoggerFactory.getLogger(AssistantService.class);

    private static final String SYSTEM_PROMPT = """
            You are SocietyWale Assistant — the official website chatbot for SocietyWale
            (https://societywale.in), a housing-society management product for India.

            Audience: managing committee (secretary, treasurer, chairman), admins, and residents.
            Tone: professional, warm, clear. Short answers (2–6 sentences). No developer jargon.

            PRODUCT FACTS (stay inside this domain):
            - Committees can: create a society workspace, share a society code, manage members,
              publish committee contacts, set maintenance amount, track paid/pending dues,
              review payment claims, publish bank/UPI details, log expenses, post notices & rules,
              track complaints, store audit files, generate financial reports/PDFs, and view Analytics.
            - Residents can: join with society code, view dues/notices/bank details/rules,
              raise payment claims and complaints, and view reports the committee shares.
            - Signup: committee uses Create society workspace; residents use Member signup + society code.
            - Contact: societywale.in@gmail.com | +91 97300 96390 | +91 72187 79953.

            STRICT RULES:
            1) Answer questions about SocietyWale, society operations, onboarding, pricing conversations,
               features, security/privacy at a business level, and how committees/residents use the app.
            2) If the user asks something unrelated (e.g. physics, sports, news, coding, jokes),
               politely say you only help with SocietyWale / housing-society management, then offer
               1–2 relevant ways you can help instead.
            3) Never invent features SocietyWale does not have (visitor QR gates, Razorpay checkout,
               facility booking, staff/payroll apps, mobile native apps unless asked generally).
            4) Prefer actionable next steps: Sign up, Contact, Features, Dashboard workflows.
            5) Do not ask for passwords or OTP codes.
            """;

    private final RestClient restClient;
    private final String apiKey;
    private final String model;

    public AssistantService(
            @Value("${app.groq.api-key:}") String apiKey,
            @Value("${app.groq.model:llama-3.3-70b-versatile}") String model) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.model = model;
        this.restClient = RestClient.builder()
                .baseUrl("https://api.groq.com/openai/v1")
                .build();
    }

    public boolean isConfigured() {
        return !apiKey.isBlank();
    }

    @SuppressWarnings("unchecked")
    public ChatResponse chat(ChatRequest req) {
        if (!isConfigured()) {
            throw new BadRequestException(
                    "Assistant is not configured yet. Add GROQ_API_KEY on the server and restart core-service.");
        }

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of("role", "system", "content", SYSTEM_PROMPT));

        if (req.history() != null) {
            int start = Math.max(0, req.history().size() - 10);
            for (int i = start; i < req.history().size(); i++) {
                ChatMessage m = req.history().get(i);
                String role = "assistant".equalsIgnoreCase(m.role()) ? "assistant" : "user";
                String content = m.content() == null ? "" : m.content().trim();
                if (!content.isBlank()) {
                    messages.add(Map.of("role", role, "content", content));
                }
            }
        }
        messages.add(Map.of("role", "user", "content", req.message().trim()));

        Map<String, Object> body = Map.of(
                "model", model,
                "temperature", 0.35,
                "max_tokens", 450,
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
                throw new BadRequestException("Assistant did not return a reply. Please try again.");
            }
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (choices.isEmpty()) {
                throw new BadRequestException("Assistant did not return a reply. Please try again.");
            }
            Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
            String reply = message == null ? null : String.valueOf(message.getOrDefault("content", "")).trim();
            if (reply == null || reply.isBlank() || "null".equals(reply)) {
                throw new BadRequestException("Assistant did not return a reply. Please try again.");
            }
            return new ChatResponse(reply);
        } catch (RestClientResponseException ex) {
            log.warn("Groq API error status={} body={}", ex.getStatusCode().value(), ex.getResponseBodyAsString());
            throw new BadRequestException("Assistant could not reach Groq. Check GROQ_API_KEY and try again.");
        } catch (RestClientException ex) {
            log.warn("Groq API request failed: {}", ex.getMessage());
            throw new BadRequestException("Assistant is temporarily unavailable. Please try again shortly.");
        }
    }
}
