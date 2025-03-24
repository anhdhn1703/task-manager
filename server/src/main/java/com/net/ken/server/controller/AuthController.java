package com.net.ken.server.controller;

import com.net.ken.server.dto.ResponseDTO;
import com.net.ken.server.dto.auth.ChangePasswordRequest;
import com.net.ken.server.dto.auth.JwtResponse;
import com.net.ken.server.dto.auth.LoginRequest;
import com.net.ken.server.dto.auth.RefreshTokenRequest;
import com.net.ken.server.dto.auth.RegisterRequest;
import com.net.ken.server.model.User;
import com.net.ken.server.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthController {
    
    private final AuthService authService;

    @PostMapping("/login")
    public ResponseEntity<ResponseDTO<JwtResponse>> login(@Valid @RequestBody LoginRequest loginRequest) {
        log.info("AuthController: Xử lý yêu cầu đăng nhập cho username: {}", loginRequest.getUsername());
        ResponseDTO<JwtResponse> response = authService.authenticateUser(loginRequest);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register")
    public ResponseEntity<ResponseDTO<JwtResponse>> register(@Valid @RequestBody RegisterRequest registerRequest) {
        log.info("AuthController: Xử lý yêu cầu đăng ký cho username: {}", registerRequest.getUsername());
        ResponseDTO<JwtResponse> response = authService.registerUser(registerRequest);
        return ResponseEntity.ok(response);
    }
    
    @PostMapping("/change-password")
    public ResponseEntity<ResponseDTO<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request) {
        log.info("AuthController: Xử lý yêu cầu đổi mật khẩu");
        User currentUser = authService.getCurrentUser();
        ResponseDTO<Void> response = authService.changePassword(request, currentUser.getId());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ResponseDTO<JwtResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        log.info("AuthController: Xử lý yêu cầu làm mới token");
        ResponseDTO<JwtResponse> response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(response);
    }
    
    @GetMapping("/validate-token")
    public ResponseEntity<ResponseDTO<JwtResponse>> validateToken(@RequestHeader("Authorization") String authHeader) {
        log.info("AuthController: Xử lý yêu cầu xác thực token");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            // Trích xuất token từ header (loại bỏ tiền tố 'Bearer ')
            String token = authHeader.substring(7);
            
            // Xác thực token và lấy thông tin người dùng
            ResponseDTO<JwtResponse> response = authService.validateToken(token);
            
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.badRequest().build();
    }
    
    @GetMapping("/current-user")
    public ResponseEntity<ResponseDTO<User>> getCurrentUser() {
        log.info("AuthController: Xử lý yêu cầu lấy thông tin người dùng hiện tại");
        User currentUser = authService.getCurrentUser();
        return ResponseEntity.ok(ResponseDTO.success(currentUser));
    }
} 