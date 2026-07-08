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
    List<User> findBySocietyIdAndRole(UUID societyId, Role role);
    List<User> findBySocietyId(UUID societyId);
}
