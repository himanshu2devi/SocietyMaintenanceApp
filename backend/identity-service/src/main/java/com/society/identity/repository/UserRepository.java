package com.society.identity.repository;

import com.society.identity.domain.Role;
import com.society.identity.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByEmailAndIdNot(String email, UUID id);
    boolean existsBySocietyIdAndMobile(UUID societyId, String mobile);
    boolean existsBySocietyIdAndMobileAndIdNot(UUID societyId, String mobile, UUID id);
    boolean existsBySocietyIdAndEmail(UUID societyId, String email);
    boolean existsBySocietyIdAndEmailAndIdNot(UUID societyId, String email, UUID id);
    List<User> findBySocietyIdAndRole(UUID societyId, Role role);
    List<User> findBySocietyIdAndRoleAndActiveTrue(UUID societyId, Role role);
    List<User> findBySocietyId(UUID societyId);
}
