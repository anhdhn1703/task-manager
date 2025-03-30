package com.net.ken.server.controller;

import com.net.ken.server.dto.ResponseDTO;
import com.net.ken.server.service.AuthService;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AuthService authService;
    
    /**
     * Mở khóa tài khoản bị khóa do đăng nhập sai nhiều lần
     * 
     * @param username tên người dùng cần mở khóa
     * @return phản hồi thành công
     */
    @PostMapping("/users/{username}/unlock")
    public ResponseEntity<ResponseDTO<Void>> unlockUserAccount(@PathVariable @NotBlank String username) {
        log.info("AdminController: Xử lý yêu cầu mở khóa tài khoản cho username: {}", username);
        
        ResponseDTO<Void> response = authService.unlockUserAccount(username);
        
        return ResponseEntity.ok(response);
    }
} 