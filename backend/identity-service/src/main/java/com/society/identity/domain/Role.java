package com.society.identity.domain;

public enum Role {
    ADMIN,
    MEMBER,
    /** Software operator — cross-society platform console only. Not a society tenant role. */
    PLATFORM_ADMIN
}
