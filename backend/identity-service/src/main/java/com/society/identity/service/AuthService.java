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

    @Transactional
    public AuthResponse registerMember(RegisterMemberRequest req) {
        Society society = societyRepository.findBySocietyCode(req.societyCode().trim())
                .orElseThrow(() -> new NotFoundException("Society code not found. Ask your committee for the correct code."));

        if (userRepository.existsBySocietyIdAndEmail(society.getId(), req.email().trim().toLowerCase())) {
            throw new ConflictException("Email already registered for this society. Sign in, or use Forgot password.");
        }
        if (userRepository.existsBySocietyIdAndMobile(society.getId(), req.mobile().trim())) {
            throw new ConflictException("Mobile already registered for this society. Sign in, or ask committee to reset your password.");
        }
        if (userRepository.existsByEmail(req.email().trim().toLowerCase())) {
            throw new ConflictException("Email already in use. Sign in, or use Forgot password.");
        }

        User member = new User();
        member.setSocietyId(society.getId());
        member.setFullName(req.fullName().trim());
        member.setEmail(req.email().trim().toLowerCase());
        member.setMobile(req.mobile().trim());
        member.setFlatNumber(req.flatNumber().trim());
        member.setPasswordHash(passwordEncoder.encode(req.password()));
        member.setRole(Role.MEMBER);
        member = userRepository.save(member);

        String token = jwtService.generateToken(member);
        return new AuthResponse(token, "Bearer", toView(member));
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.email().trim().toLowerCase())
                .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        if (!user.isActive()) {
            throw new UnauthorizedException("Account is inactive. Contact your society committee.");
        }
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid email or password");
        }
        String token = jwtService.generateToken(user);
        return new AuthResponse(token, "Bearer", toView(user));
    }

    /**
     * Password reset without SMTP: caller must know society code, email, mobile and flat.
     */
    @Transactional
    public MessageResponse resetPasswordWithIdentity(ForgotPasswordRequest req) {
        Society society = societyRepository.findBySocietyCode(req.societyCode().trim())
                .orElseThrow(() -> new NotFoundException("Society code not found. Ask your committee for the correct code."));

        String email = req.email().trim().toLowerCase();
        String mobile = req.mobile().trim();
        String flat = req.flatNumber().trim();

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BadRequestException("No account found for this email. Check details or contact your committee."));

        if (!user.getSocietyId().equals(society.getId())) {
            throw new BadRequestException("This email is not registered under that society code.");
        }
        if (!user.isActive()) {
            throw new BadRequestException("Account is inactive. Contact your society committee.");
        }
        if (!mobile.equals(user.getMobile())) {
            throw new BadRequestException("Mobile number does not match our records.");
        }
        if (user.getFlatNumber() == null || !flat.equalsIgnoreCase(user.getFlatNumber().trim())) {
            throw new BadRequestException("Flat number does not match our records.");
        }

        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);
        return new MessageResponse("Password updated. You can sign in with your email and new password.");
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
