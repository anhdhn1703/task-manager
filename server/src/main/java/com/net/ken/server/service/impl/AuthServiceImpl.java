package com.net.ken.server.service.impl;

import com.net.ken.server.dto.auth.ChangePasswordRequest;
import com.net.ken.server.dto.auth.JwtResponse;
import com.net.ken.server.dto.auth.LoginRequest;
import com.net.ken.server.dto.auth.RegisterRequest;
import com.net.ken.server.exception.TaskManagerException;
import com.net.ken.server.model.User;
import com.net.ken.server.repository.UserRepository;
import com.net.ken.server.security.JwtUtils;
import com.net.ken.server.service.AuthService;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtUtils jwtUtils;

    @Override
    public JwtResponse authenticateUser(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(loginRequest.getUsername(), loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = jwtUtils.generateJwtToken(authentication);
        
        User userDetails = (User) authentication.getPrincipal();
        List<String> roles = userDetails.getAuthorities().stream()
                .map(item -> item.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());

        // Cập nhật thời gian đăng nhập cuối
        updateLastLogin(userDetails.getUsername());

        return new JwtResponse(
                jwt,
                userDetails.getId(),
                userDetails.getUsername(),
                userDetails.getEmail(),
                roles,
                userDetails.getFullName()
        );
    }

    @Override
    @Transactional
    public JwtResponse registerUser(RegisterRequest registerRequest) {
        // Kiểm tra tên đăng nhập đã tồn tại chưa
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new EntityExistsException("Lỗi: Tên đăng nhập đã được sử dụng!");
        }

        // Kiểm tra email đã tồn tại chưa
        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new EntityExistsException("Lỗi: Email đã được sử dụng!");
        }

        // Tạo tài khoản người dùng mới
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setFullName(registerRequest.getFullName());

        // Mặc định vai trò là USER
        Set<String> roles = new HashSet<>();
        roles.add("USER");
        user.setRoles(roles);

        userRepository.save(user);

        // Đăng nhập người dùng mới
        LoginRequest loginRequest = new LoginRequest(
                registerRequest.getUsername(),
                registerRequest.getPassword()
        );

        return authenticateUser(loginRequest);
    }

    @Override
    @Transactional
    public boolean changePassword(String username, ChangePasswordRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với tên: " + username));

        // Kiểm tra mật khẩu cũ
        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new TaskManagerException("Mật khẩu cũ không đúng");
        }

        // Kiểm tra mật khẩu mới và xác nhận
        if (!request.getNewPassword().equals(request.getConfirmPassword())) {
            throw new TaskManagerException("Mật khẩu mới và xác nhận mật khẩu không khớp");
        }

        // Cập nhật mật khẩu mới
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        return true;
    }

    @Override
    @Transactional
    public void updateLastLogin(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với tên: " + username));
        
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
    }

    @Override
    public JwtResponse validateToken(String token) {
        if (!jwtUtils.validateJwtToken(token)) {
            throw new TaskManagerException("Token không hợp lệ hoặc đã hết hạn");
        }
        
        // Lấy tên người dùng từ token
        String username = jwtUtils.getUserNameFromJwtToken(token);
        
        // Tìm thông tin người dùng
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng với tên: " + username));
        
        // Chuyển đổi roles
        List<String> roles = user.getAuthorities().stream()
                .map(item -> item.getAuthority().replace("ROLE_", ""))
                .collect(Collectors.toList());
        
        // Trả về thông tin người dùng
        return new JwtResponse(
                token,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                roles,
                user.getFullName()
        );
    }
} 