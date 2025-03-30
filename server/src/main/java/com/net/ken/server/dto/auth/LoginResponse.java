package com.net.ken.server.dto.auth;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LoginResponse {
    private boolean success;
    private JwtResponse data;
    private String message;
    private String errorCode;
    
    // Thông tin về số lần đăng nhập sai
    private Integer failedAttempts;
    private Integer maxFailedAttempts = 6;
    private Integer remainingAttempts;
    
    public static LoginResponse success(JwtResponse data, String message) {
        return LoginResponse.builder()
                .success(true)
                .data(data)
                .message(message)
                .build();
    }
    
    public static LoginResponse error(String message, String errorCode) {
        return LoginResponse.builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .build();
    }
    
    public static LoginResponse error(String message, String errorCode, Integer failedAttempts) {
        int remaining = Math.max(0, 6 - failedAttempts);
        
        return LoginResponse.builder()
                .success(false)
                .message(message)
                .errorCode(errorCode)
                .failedAttempts(failedAttempts)
                .remainingAttempts(remaining)
                .build();
    }
} 