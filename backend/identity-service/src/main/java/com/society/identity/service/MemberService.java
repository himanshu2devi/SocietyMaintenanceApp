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
        if (req.email() != null && !req.email().isBlank() && userRepository.existsByEmail(req.email())) {
            throw new ConflictException("Email already in use");
        }
        User member = new User();
        member.setSocietyId(societyId);
        member.setFullName(req.fullName());
        member.setFlatNumber(req.flatNumber());
        member.setMobile(req.mobile());
        member.setEmail(req.email());
        member.setRole(Role.MEMBER);
        // Default password = mobile number if none provided (member changes on first login)
        String rawPassword = (req.password() == null || req.password().isBlank())
                ? req.mobile() : req.password();
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
