package com.society.core.security;

import java.util.UUID;

public record AuthenticatedUser(UUID userId, UUID societyId, String role, String name) {
}
