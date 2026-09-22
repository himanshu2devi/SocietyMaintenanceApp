package com.society.core.security;

import java.util.UUID;

/**
 * Principal built from the shared JWT.
 *
 * <p>{@code societyId} is {@code null} for platform-level principals (PLATFORM_ADMIN) that do not
 * belong to a society. Society-scoped endpoints must resolve the tenant through
 * {@link SocietyScope#require(AuthenticatedUser)} so a missing tenant is rejected instead of
 * being queried as {@code null}.
 */
public record AuthenticatedUser(UUID userId, UUID societyId, String role, String name, String flatNumber) {
}
