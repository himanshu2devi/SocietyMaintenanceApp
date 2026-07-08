package com.society.identity.service;

import com.society.identity.domain.Role;
import com.society.identity.domain.Society;
import com.society.identity.domain.User;
import com.society.identity.dto.AuthDtos.*;
import com.society.identity.exception.ApiExceptions.*;
import com.society.identity.repository.SocietyRepository;
import com.society.identity.repository.UserRepository;
import com.society.identity.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private final SocietyRepository societyRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(SocietyRepository societyRepository,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.societyRepository = societyRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse registerSociety(RegisterSocietyRequest req) {
        if (societyRepository.existsBySocietyCode(req.societyCode())) {
            throw new ConflictException("Society code already registered");
        }
        if (userRepository.existsByEmail(req.adminEmail())) {
            throw new ConflictException("Email already in use");
        }

        Society society = new Society();
        society.setName(req.societyName());
        society.setSocietyCode(req.societyCode());
        society.setAddress(req.address());
        society.setCity(req.city());
        society = societyRepository.save(society);

        User admin = new User();
        admin.setSocietyId(society.getId());
        admin.setFullName(req.adminName());
        admin.setEmail(req.adminEmail());
        admin.setMobile(req.adminMobile());
        admin.setPasswordHash(passwordEncoder.encode(req.password()));
        admin.setRole(Role.ADMIN);
        admin = userRepository.save(admin);

        String token = jwtService.generateToken(admin);
        return new AuthResponse(token, "Bearer", toView(admin));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!user.isActive()) {
            throw new UnauthorizedException("Account is inactive");
        }
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Bearer", toView(user));
    }

    public static UserView toView(User u) {
        return new UserView(
                u.getId().toString(),
                u.getSocietyId().toString(),
                u.getFullName(),
                u.getEmail(),
                u.getMobile(),
                u.getFlatNumber(),
                u.getRole().name()
        );
    }
}
