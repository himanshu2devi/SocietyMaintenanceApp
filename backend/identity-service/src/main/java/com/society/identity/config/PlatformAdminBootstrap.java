package com.society.identity.config;

import com.society.identity.domain.Role;
import com.society.identity.domain.User;
import com.society.identity.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

/**
 * Optional bootstrap for the first PLATFORM_ADMIN account.
 * Set PLATFORM_ADMIN_EMAIL and PLATFORM_ADMIN_PASSWORD (and optional name/mobile).
 * Skips creation when email already exists. Does not weaken society ADMIN/MEMBER auth.
 */
@Component
public class PlatformAdminBootstrap implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(PlatformAdminBootstrap.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.platform-admin.email:}")
    private String email;

    @Value("${app.platform-admin.password:}")
    private String password;

    @Value("${app.platform-admin.name:Platform Owner}")
    private String name;

    @Value("${app.platform-admin.mobile:9999999999}")
    private String mobile;

    public PlatformAdminBootstrap(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!StringUtils.hasText(email) || !StringUtils.hasText(password)) {
            return;
        }
        String normalized = email.trim().toLowerCase();
        if (userRepository.findByEmail(normalized).isPresent()) {
            log.info("Platform admin bootstrap skipped — email already registered");
            return;
        }
        User user = new User();
        user.setSocietyId(null);
        user.setFullName(name.trim());
        user.setEmail(normalized);
        user.setMobile(mobile.trim());
        user.setFlatNumber(null);
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setRole(Role.PLATFORM_ADMIN);
        user.setActive(true);
        userRepository.save(user);
        log.info("Created PLATFORM_ADMIN account for {}", normalized);
    }
}
