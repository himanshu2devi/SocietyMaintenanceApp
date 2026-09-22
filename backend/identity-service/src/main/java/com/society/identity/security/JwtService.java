package com.society.identity.security;

import com.society.identity.domain.Society;
import com.society.identity.domain.User;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    public JwtService(@Value("${security.jwt.secret}") String secret,
                      @Value("${security.jwt.expiration-ms}") long expirationMs) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
    }

    public String generateToken(User user) {
        return generateToken(user, null);
    }

    public String generateToken(User user, Society society) {
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        Map<String, Object> claims = new HashMap<>();
        claims.put("email", user.getEmail() == null ? "" : user.getEmail());
        claims.put("role", user.getRole().name());
        if (user.getSocietyId() != null) {
            claims.put("societyId", user.getSocietyId().toString());
        }
        claims.put("name", user.getFullName());
        claims.put("flatNumber", user.getFlatNumber() == null ? "" : user.getFlatNumber());
        // Platform operators are not bound to a society subscription claim.
        if (user.getRole() != com.society.identity.domain.Role.PLATFORM_ADMIN
                && society != null
                && society.getSubscriptionExpiresAt() != null) {
            claims.put("subExp", society.getSubscriptionExpiresAt().toEpochMilli());
        }
        return Jwts.builder()
                .subject(user.getId().toString())
                .claims(claims)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(key)
                .compact();
    }

    public Claims parse(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    /** Returns false if JWT carries an expired society subscription claim. Missing claim = legacy / active. */
    public static boolean isSocietySubscriptionClaimActive(Claims claims) {
        Object raw = claims.get("subExp");
        if (raw == null) {
            return true;
        }
        long epochMs;
        if (raw instanceof Number number) {
            epochMs = number.longValue();
        } else {
            try {
                epochMs = Long.parseLong(raw.toString());
            } catch (NumberFormatException ex) {
                return true;
            }
        }
        return Instant.ofEpochMilli(epochMs).isAfter(Instant.now());
    }
}
