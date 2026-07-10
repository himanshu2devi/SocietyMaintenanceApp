package com.society.identity.domain;

public enum Role {
    /**
     * Society committee administrator with write access to operational data.
     */
    ADMIN,

    /**
     * Resident/member. This is the existing API role name for a resident;
     * do not rename it without a data migration and JWT compatibility plan.
     */
    MEMBER
}
