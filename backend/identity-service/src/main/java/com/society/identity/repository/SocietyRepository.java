package com.society.identity.repository;

import com.society.identity.domain.Society;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface SocietyRepository extends JpaRepository<Society, UUID> {
    boolean existsBySocietyCode(String societyCode);
    Optional<Society> findBySocietyCode(String societyCode);
    List<Society> findAllByOrderByNameAsc();

    @Query("""
            SELECT s FROM Society s
            WHERE LOWER(s.name) LIKE CONCAT('%', :q, '%')
               OR LOWER(s.societyCode) LIKE CONCAT('%', :q, '%')
               OR LOWER(COALESCE(s.city, '')) LIKE CONCAT('%', :q, '%')
               OR LOWER(COALESCE(s.address, '')) LIKE CONCAT('%', :q, '%')
            """)
    Page<Society> search(@Param("q") String q, Pageable pageable);
}
