package com.society.identity.security;

import java.util.UUID;

/**
 * Lightweight principal placed in the SecurityContext after JWT validation.
 */
public record AuthenticatedUser(UUID userId, UUID societyId, String role, String name) {
}
