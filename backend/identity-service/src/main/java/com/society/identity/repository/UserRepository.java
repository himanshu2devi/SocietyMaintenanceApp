package com.society.identity.repository;

import com.society.identity.domain.Role;
import com.society.identity.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
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

    @Query("""
            SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END
            FROM User u
            WHERE u.societyId = :societyId
              AND u.flatNumber IS NOT NULL
              AND LOWER(TRIM(u.flatNumber)) = LOWER(TRIM(:flatNumber))
            """)
    boolean existsBySocietyIdAndFlatNumberIgnoreCase(
            @Param("societyId") UUID societyId,
            @Param("flatNumber") String flatNumber);

    @Query("""
            SELECT CASE WHEN COUNT(u) > 0 THEN true ELSE false END
            FROM User u
            WHERE u.societyId = :societyId
              AND u.id <> :id
              AND u.flatNumber IS NOT NULL
              AND LOWER(TRIM(u.flatNumber)) = LOWER(TRIM(:flatNumber))
            """)
    boolean existsBySocietyIdAndFlatNumberIgnoreCaseAndIdNot(
            @Param("societyId") UUID societyId,
            @Param("flatNumber") String flatNumber,
            @Param("id") UUID id);

    List<User> findBySocietyIdAndRole(UUID societyId, Role role);
    List<User> findBySocietyIdAndRoleAndActiveTrue(UUID societyId, Role role);
    List<User> findBySocietyId(UUID societyId);

    long countByRole(Role role);
    long countByActiveTrue();
    long countByActiveFalse();

    @Query("""
            SELECT u.societyId,
                   SUM(CASE WHEN u.role = com.society.identity.domain.Role.MEMBER THEN 1 ELSE 0 END),
                   SUM(CASE WHEN u.role = com.society.identity.domain.Role.ADMIN THEN 1 ELSE 0 END)
            FROM User u
            WHERE u.societyId IN :societyIds
            GROUP BY u.societyId
            """)
    List<Object[]> countMembersAndAdminsBySocietyIds(@Param("societyIds") Collection<UUID> societyIds);

    @Query("""
            SELECT u FROM User u
            WHERE (:role IS NULL OR u.role = :role)
              AND (
                :q IS NULL OR
                LOWER(COALESCE(u.fullName, '')) LIKE CONCAT('%', :q, '%') OR
                LOWER(COALESCE(u.email, '')) LIKE CONCAT('%', :q, '%') OR
                LOWER(COALESCE(u.mobile, '')) LIKE CONCAT('%', :q, '%') OR
                LOWER(COALESCE(u.flatNumber, '')) LIKE CONCAT('%', :q, '%')
              )
            """)
    Page<User> searchForPlatform(@Param("q") String q, @Param("role") Role role, Pageable pageable);
}
