package com.society.core.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class AssistantDtos {

    public record ChatMessage(
            @NotBlank String role,
            @NotBlank @Size(max = 2000) String content
    ) {}

    public record ChatRequest(
            @NotBlank(message = "Message is required")
            @Size(min = 1, max = 1000, message = "Message must be 1–1000 characters")
            String message,
            List<ChatMessage> history
    ) {}

    public record ChatResponse(String reply) {}
}
