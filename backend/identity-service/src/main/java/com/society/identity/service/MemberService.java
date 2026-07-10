package com.society.identity.service;

import com.society.identity.domain.Role;
import com.society.identity.domain.User;
import com.society.identity.dto.MemberDtos.*;
import com.society.identity.exception.ApiExceptions.*;
import com.society.identity.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class MemberService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public MemberService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public MemberResponse addMember(UUID societyId, AddMemberRequest req) {
        String mobile = normalizeRequired(req.mobile(), "Mobile");
        String email = normalizeOptionalEmail(req.email());

        if (userRepository.existsBySocietyIdAndMobile(societyId, mobile)) {
            throw new ConflictException("A member with this mobile number already exists in your society.");
        }
        if (email != null && userRepository.existsBySocietyIdAndEmail(societyId, email)) {
            throw new ConflictException("A member with this email already exists in your society.");
        }
        if (email != null && userRepository.existsByEmail(email)) {
            throw new ConflictException("This email is already registered. Use a different email or leave it blank.");
        }

        User member = new User();
        member.setSocietyId(societyId);
        member.setFullName(normalizeRequired(req.fullName(), "Name"));
        member.setFlatNumber(normalizeRequired(req.flatNumber(), "Flat number"));
        member.setMobile(mobile);
        member.setEmail(email); // null when optional email is blank — avoids unique '' collisions
        member.setRole(Role.MEMBER);
        String rawPassword = (req.password() == null || req.password().isBlank())
                ? mobile : req.password();
        member.setPasswordHash(passwordEncoder.encode(rawPassword));
        member = userRepository.save(member);
        return toResponse(member);
    }

    @Transactional(readOnly = true)
    public List<MemberResponse> listMembers(UUID societyId) {
        return userRepository.findBySocietyIdAndRole(societyId, Role.MEMBER)
                .stream().map(MemberService::toResponse).toList();
    }

    @Transactional
    public void deactivateMember(UUID societyId, UUID memberId) {
        User member = userRepository.findById(memberId)
                .orElseThrow(() -> new NotFoundException("Member not found"));
        if (!member.getSocietyId().equals(societyId)) {
            throw new NotFoundException("Member not found in this society");
        }
        member.setActive(false);
        userRepository.save(member);
    }

    /** Blank optional email must be NULL in PostgreSQL, not "" (unique constraint). */
    static String normalizeOptionalEmail(String email) {
        if (email == null) return null;
        String trimmed = email.trim();
        if (trimmed.isEmpty()) return null;
        if (!trimmed.contains("@") || trimmed.startsWith("@") || trimmed.endsWith("@")) {
            throw new BadRequestException("Enter a valid email or leave it blank.");
        }
        return trimmed.toLowerCase();
    }

    static String normalizeRequired(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException(field + " is required");
        }
        return value.trim();
    }

    public static MemberResponse toResponse(User u) {
        return new MemberResponse(
                u.getId().toString(),
                u.getFullName(),
                u.getFlatNumber(),
                u.getMobile(),
                u.getEmail(),
                u.getRole().name(),
                u.isActive()
        );
    }
}
