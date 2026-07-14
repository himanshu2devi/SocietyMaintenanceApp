package com.society.identity.service;

import com.society.identity.domain.Role;
import com.society.identity.domain.Society;
import com.society.identity.domain.SubscriptionPayment;
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
    private final MailNotificationService mailNotificationService;
    private final RazorpayPaymentService razorpayPaymentService;

    public AuthService(SocietyRepository societyRepository,
                       UserRepository userRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       MailNotificationService mailNotificationService,
                       RazorpayPaymentService razorpayPaymentService) {
        this.societyRepository = societyRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailNotificationService = mailNotificationService;
        this.razorpayPaymentService = razorpayPaymentService;
    }

    @Transactional
    public AuthResponse registerSociety(RegisterSocietyRequest req) {
        if (!razorpayPaymentService.isConfigured()) {
            throw new BadRequestException(
                    "Online payments are not configured yet. Please contact SocietyWale support.");
        }

        String societyCode = req.societyCode().trim();
        String adminEmail = req.adminEmail().trim().toLowerCase();

        if (societyRepository.existsBySocietyCode(societyCode)) {
            throw new ConflictException("Society code already registered");
        }
        if (userRepository.existsByEmail(adminEmail)) {
            throw new ConflictException("Email already in use");
        }

        // Payment must succeed before any society/admin account is created.
        SubscriptionPayment payment = razorpayPaymentService.verifyAndMarkPaid(
                req.razorpayOrderId(),
                req.razorpayPaymentId(),
                req.razorpaySignature());

        Society society = new Society();
        society.setName(req.societyName().trim());
        society.setSocietyCode(societyCode);
        society.setAddress(req.address() == null || req.address().isBlank() ? null : req.address().trim());
        society.setCity(req.city() == null || req.city().isBlank() ? null : req.city().trim());
        society = societyRepository.save(society);

        User admin = new User();
        admin.setSocietyId(society.getId());
        admin.setFullName(req.adminName().trim());
        admin.setEmail(adminEmail);
        admin.setMobile(req.adminMobile().trim());
        admin.setPasswordHash(passwordEncoder.encode(req.password()));
        admin.setRole(Role.ADMIN);
        admin = userRepository.save(admin);

        payment = razorpayPaymentService.consumeForRegistration(
                payment, societyCode, adminEmail, society.getId());

        mailNotificationService.sendSocietyRegisteredEmails(
                admin.getFullName(),
                admin.getEmail(),
                society.getName(),
                society.getSocietyCode(),
                society.getCity(),
                payment);

        String token = jwtService.generateToken(admin);
        return new AuthResponse(token, "Bearer", toView(admin, society));
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

        mailNotificationService.sendMemberWelcomeEmail(
                member.getFullName(),
                member.getEmail(),
                society.getName(),
                society.getSocietyCode(),
                member.getFlatNumber());

        String token = jwtService.generateToken(member);
        return new AuthResponse(token, "Bearer", toView(member, society));
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

    private UserView toView(User u) {
        Society society = societyRepository.findById(u.getSocietyId()).orElse(null);
        return toView(u, society);
    }

    private static UserView toView(User u, Society society) {
        return new UserView(
                u.getId().toString(),
                u.getSocietyId().toString(),
                society != null ? society.getName() : null,
                society != null ? society.getSocietyCode() : null,
                u.getFullName(),
                u.getEmail(),
                u.getMobile(),
                u.getFlatNumber(),
                u.getRole().name()
        );
    }
}
