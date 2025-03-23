package com.net.ken.server.util;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;

/**
 * Lớp tiện ích cho phép truy cập thông tin bảo mật
 */
public final class SecurityUtils {
    
    private SecurityUtils() {
        // Không cho phép khởi tạo
    }
    
    /**
     * Lấy tên người dùng của người dùng đã xác thực hiện tại
     * @return Optional chứa tên người dùng hoặc empty nếu không có
     */
    public static Optional<String> getCurrentUsername() {
        final Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication == null) {
            return Optional.empty();
        }
        
        if (authentication.getPrincipal() instanceof UserDetails) {
            UserDetails springSecurityUser = (UserDetails) authentication.getPrincipal();
            return Optional.ofNullable(springSecurityUser.getUsername());
        }
        
        if (authentication.getPrincipal() instanceof String) {
            return Optional.of(authentication.getPrincipal().toString());
        }
        
        return Optional.empty();
    }
} 