package com.net.ken.server.controller;

import com.net.ken.server.dto.auth.ChangePasswordRequest;
import com.net.ken.server.dto.auth.JwtResponse;
import com.net.ken.server.dto.auth.LoginRequest;
import com.net.ken.server.dto.auth.RegisterRequest;
import com.net.ken.server.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {
    @Autowired
    private AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<JwtResponse> authenticateUser(@Valid @RequestBody LoginRequest loginRequest) {
        JwtResponse jwtResponse = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(jwtResponse);
    }

    @PostMapping("/register")
    public ResponseEntity<JwtResponse> registerUser(@Valid @RequestBody RegisterRequest registerRequest) {
        JwtResponse jwtResponse = authService.registerUser(registerRequest);
        return ResponseEntity.ok(jwtResponse);
    }

    @GetMapping("/validate-token")
    public ResponseEntity<JwtResponse> validateToken(@RequestHeader("Authorization") String authHeader) {
        // Trích xuất token từ header (loại bỏ tiền tố 'Bearer ')
        String token = authHeader.substring(7);
        
        // Xác thực token và lấy thông tin người dùng
        JwtResponse jwtResponse = authService.validateToken(token);
        
        return ResponseEntity.ok(jwtResponse);
    }

    @PostMapping("/change-password")
    public ResponseEntity<?> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        
        boolean result = authService.changePassword(username, request);
        
        if (result) {
            return ResponseEntity.ok().body(
                    Map.of("message", "Mật khẩu đã được thay đổi thành công")
            );
        } else {
            return ResponseEntity.badRequest().body(
                    Map.of("message", "Không thể thay đổi mật khẩu")
            );
        }
    }
} 