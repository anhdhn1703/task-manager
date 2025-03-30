package com.net.ken.server.repository;

import com.net.ken.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByUsername(String username);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    @Modifying
    @Query("UPDATE User u SET u.lastLogin = :lastLogin WHERE u.username = :username")
    void updateLastLoginDate(@Param("username") String username, @Param("lastLogin") LocalDateTime lastLogin);
    
    @Modifying
    @Query("UPDATE User u SET u.failedLoginAttempts = u.failedLoginAttempts + 1 WHERE u.username = :username")
    void incrementFailedLoginAttempts(@Param("username") String username);
    
    @Modifying
    @Query("UPDATE User u SET u.accountNonLocked = false, u.accountLockedDate = :lockDate WHERE u.username = :username")
    void lockUserAccount(@Param("username") String username, @Param("lockDate") LocalDateTime lockDate);
    
    @Modifying
    @Query("UPDATE User u SET u.failedLoginAttempts = 0 WHERE u.username = :username")
    void resetFailedLoginAttempts(@Param("username") String username);
    
    @Modifying
    @Query("UPDATE User u SET u.accountNonLocked = true, u.accountLockedDate = null, u.failedLoginAttempts = 0 WHERE u.username = :username")
    void unlockUserAccount(@Param("username") String username);
} 