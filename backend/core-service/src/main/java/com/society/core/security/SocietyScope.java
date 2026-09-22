package com.society.core.security;

import com.society.core.exception.ApiExceptions.ForbiddenException;

import java.util.UUID;

/**
 * Every society API is tenant-scoped by the {@code societyId} claim. Platform-level principals
 * (PLATFORM_ADMIN) authenticate without a society, so they must be rejected here rather than
 * silently querying with a null tenant.
 */
public final class SocietyScope {

    public static UUID require(AuthenticatedUser user) {
        if (user == null) {
            throw new ForbiddenException("Authentication is required");
        }
        if (user.societyId() == null) {
            throw new ForbiddenException("This endpoint is only available to society members and admins");
        }
        return user.societyId();
    }

    private SocietyScope() {}
}
