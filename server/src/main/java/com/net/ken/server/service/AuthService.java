package com.net.ken.server.service;

import com.net.ken.server.dto.auth.ChangePasswordRequest;
import com.net.ken.server.dto.auth.JwtResponse;
import com.net.ken.server.dto.auth.LoginRequest;
import com.net.ken.server.dto.auth.RegisterRequest;

public interface AuthService {
    JwtResponse authenticateUser(LoginRequest loginRequest);
    
    JwtResponse registerUser(RegisterRequest registerRequest);
    
    boolean changePassword(String username, ChangePasswordRequest request);
    
    void updateLastLogin(String username);
    
    /**
     * Validate a JWT token and return user information if valid
     * @param token The JWT token to validate
     * @return JwtResponse containing user information if token is valid
     */
    JwtResponse validateToken(String token);
} 