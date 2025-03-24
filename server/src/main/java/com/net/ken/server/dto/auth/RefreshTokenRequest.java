package com.net.ken.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO cho yêu cầu làm mới token.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequest {
    
    @NotBlank(message = "Refresh token không được để trống")
    private String refreshToken;
} 