package com.net.ken.server.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Entity
@Table(name = "users")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, unique = true)
    private String email;

    private String fullName;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "last_password_change_date")
    private LocalDateTime lastPasswordChangeDate;
    
    @Column(name = "failed_login_attempts")
    private Integer failedLoginAttempts = 0;
    
    @Column(name = "account_locked_date")
    private LocalDateTime accountLockedDate;

    @Column(name = "account_non_expired")
    private boolean accountNonExpired = true;

    @Column(name = "account_non_locked")
    private boolean accountNonLocked = true;

    @Column(name = "credentials_non_expired")
    private boolean credentialsNonExpired = true;

    @Column(name = "enabled")
    private boolean enabled = true;
    
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "user_roles", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "role")
    private Set<String> roles = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        lastPasswordChangeDate = LocalDateTime.now(); // Đặt thời gian thay đổi mật khẩu ban đầu
        failedLoginAttempts = 0; // Khởi tạo số lần đăng nhập sai
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    /**
     * Tăng số lần đăng nhập sai và tự động khóa tài khoản nếu quá giới hạn
     * 
     * @return true nếu tài khoản bị khóa, false nếu chưa bị khóa
     */
    public boolean incrementFailedLoginAttempts() {
        if (failedLoginAttempts == null) {
            failedLoginAttempts = 0;
        }
        
        failedLoginAttempts++;
        
        if (failedLoginAttempts >= 6) {
            accountNonLocked = false;
            accountLockedDate = LocalDateTime.of(9999, 12, 31, 0, 0, 0);
            return true;
        }
        
        return false;
    }
    
    /**
     * Reset số lần đăng nhập sai về 0 khi đăng nhập thành công
     */
    public void resetFailedLoginAttempts() {
        failedLoginAttempts = 0;
    }

    /**
     * Kiểm tra xem mật khẩu có quá hạn không (quá 90 ngày kể từ lần thay đổi cuối cùng)
     * 
     * @return true nếu mật khẩu đã quá hạn, false nếu chưa quá hạn
     */
    public boolean isPasswordExpired() {
        if (lastPasswordChangeDate == null) {
            // Nếu chưa có dữ liệu về lần thay đổi mật khẩu cuối cùng, coi như mật khẩu đã quá hạn
            return true;
        }
        
        // Tính số ngày từ lần thay đổi mật khẩu cuối cùng đến hiện tại
        long daysSinceLastPasswordChange = ChronoUnit.DAYS.between(lastPasswordChangeDate, LocalDateTime.now());
        
        // Kiểm tra xem số ngày có vượt quá 90 ngày không
        return daysSinceLastPasswordChange >= 90;
    }

    /**
     * Lấy số ngày còn lại trước khi mật khẩu hết hạn
     * 
     * @return Số ngày còn lại, -1 nếu mật khẩu đã hết hạn
     */
    public long getDaysUntilPasswordExpiry() {
        if (lastPasswordChangeDate == null) {
            return -1;
        }
        
        long daysSinceLastPasswordChange = ChronoUnit.DAYS.between(lastPasswordChangeDate, LocalDateTime.now());
        long daysRemaining = 90 - daysSinceLastPasswordChange;
        
        return daysRemaining > 0 ? daysRemaining : -1;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return roles.stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role))
                .collect(Collectors.toList());
    }

    @Override
    public boolean isAccountNonExpired() {
        return accountNonExpired;
    }

    @Override
    public boolean isAccountNonLocked() {
        return accountNonLocked;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        // Cập nhật phương thức này để kiểm tra cả trạng thái đã lưu và tính toán dựa trên thời gian
        return credentialsNonExpired && !isPasswordExpired();
    }

    @Override
    public boolean isEnabled() {
        return enabled;
    }
} 