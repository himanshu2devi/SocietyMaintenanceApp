package com.society.core.web;

import com.society.core.dto.AssistantDtos.*;
import com.society.core.service.AssistantService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/assistant")
public class AssistantController {

    private final AssistantService service;

    public AssistantController(AssistantService service) {
        this.service = service;
    }

    @GetMapping("/status")
    public ResponseEntity<MapStatus> status() {
        return ResponseEntity.ok(new MapStatus(service.isConfigured()));
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponse> chat(@Valid @RequestBody ChatRequest req) {
        return ResponseEntity.ok(service.chat(req));
    }

    public record MapStatus(boolean configured) {}
}
