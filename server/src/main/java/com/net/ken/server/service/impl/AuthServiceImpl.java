package com.net.ken.server.service.impl;

import com.net.ken.server.dto.ResponseDTO;
import com.net.ken.server.dto.auth.ChangePasswordRequest;
import com.net.ken.server.dto.auth.JwtResponse;
import com.net.ken.server.dto.auth.LoginRequest;
import com.net.ken.server.dto.auth.RegisterRequest;
import com.net.ken.server.exception.TaskManagerException;
import com.net.ken.server.model.User;
import com.net.ken.server.repository.UserRepository;
import com.net.ken.server.service.AuthService;
import com.net.ken.server.service.JwtTokenService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.persistence.EntityExistsException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import static com.net.ken.server.config.CacheConfig.USER_CACHE;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtTokenService jwtTokenService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public ResponseDTO<JwtResponse> authenticateUser(LoginRequest loginRequest) {
        try {
            log.info("Đang xác thực người dùng: {}", loginRequest.getUsername());
            
            // Xác thực thông tin đăng nhập
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            loginRequest.getUsername(),
                            loginRequest.getPassword()
                    )
            );
            
            // Đặt thông tin xác thực vào SecurityContext
            SecurityContextHolder.getContext().setAuthentication(authentication);
            
            // Lấy thông tin người dùng đã xác thực
            User user = (User) authentication.getPrincipal();
            
            // Tạo token
            String jwt = jwtTokenService.generateJwtToken(user);
            String refreshToken = jwtTokenService.generateRefreshToken(user);
            
            // Cập nhật thời gian đăng nhập cuối
            updateLastLogin(user.getUsername());
            
            // Tạo phản hồi
            List<String> roles = new ArrayList<>(user.getRoles());
            
            JwtResponse jwtResponse = JwtResponse.builder()
                    .token(jwt)
                    .refreshToken(refreshToken)
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .roles(roles)
                    .build();
            
            log.info("Người dùng {} đã đăng nhập thành công", user.getUsername());
            
            return ResponseDTO.success("Đăng nhập thành công", jwtResponse);
        } catch (BadCredentialsException e) {
            log.error("Lỗi đăng nhập - thông tin đăng nhập không chính xác: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("Lỗi trong quá trình xác thực người dùng", e);
            throw new TaskManagerException.BusinessLogicException("Lỗi trong quá trình xử lý đăng nhập", "AUTH_ERROR");
        }
    }

    @Override
    @Transactional
    public ResponseDTO<JwtResponse> registerUser(RegisterRequest registerRequest) {
        try {
            log.info("Đang đăng ký người dùng mới: {}", registerRequest.getUsername());
            
            // Kiểm tra tên đăng nhập đã tồn tại chưa
            if (userRepository.existsByUsername(registerRequest.getUsername())) {
                log.warn("Đăng ký thất bại - Tên đăng nhập đã tồn tại: {}", registerRequest.getUsername());
                throw new EntityExistsException("Tên đăng nhập đã được sử dụng!");
            }
            
            // Kiểm tra email đã tồn tại chưa
            if (userRepository.existsByEmail(registerRequest.getEmail())) {
                log.warn("Đăng ký thất bại - Email đã tồn tại: {}", registerRequest.getEmail());
                throw new EntityExistsException("Email đã được sử dụng!");
            }
            
            // Tạo tài khoản người dùng mới
            User user = new User();
            user.setUsername(registerRequest.getUsername());
            user.setEmail(registerRequest.getEmail());
            user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
            user.setFullName(registerRequest.getFullName());
            user.setEnabled(true);
            user.setAccountNonLocked(true);
            user.setAccountNonExpired(true);
            user.setCredentialsNonExpired(true);
            user.getRoles().add("USER");
            
            user = userRepository.save(user);
            log.info("Người dùng mới đã được tạo với ID: {}", user.getId());
            
            // Tạo token và phản hồi giống như đăng nhập
            String jwt = jwtTokenService.generateJwtToken(user);
            String refreshToken = jwtTokenService.generateRefreshToken(user);
            
            // Tạo phản hồi
            List<String> roles = new ArrayList<>(user.getRoles());
            
            JwtResponse jwtResponse = JwtResponse.builder()
                    .token(jwt)
                    .refreshToken(refreshToken)
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .roles(roles)
                    .build();
            
            return ResponseDTO.success("Đăng ký thành công", jwtResponse);
        } catch (EntityExistsException e) {
            // Đã ghi log ở trên rồi
            throw e;
        } catch (Exception e) {
            log.error("Lỗi trong quá trình đăng ký người dùng", e);
            throw new TaskManagerException.BusinessLogicException("Lỗi trong quá trình xử lý đăng ký", "AUTH_ERROR");
        }
    }

    @Override
    @Transactional
    @CacheEvict(value = USER_CACHE, key = "#userId")
    public ResponseDTO<Void> changePassword(ChangePasswordRequest request, Long userId) {
        try {
            log.info("Đang thay đổi mật khẩu cho người dùng có ID: {}", userId);
            
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với ID: " + userId));
            
            // Xác thực mật khẩu hiện tại
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                log.warn("Thay đổi mật khẩu thất bại - Mật khẩu hiện tại không chính xác (User ID: {})", userId);
                throw new BadCredentialsException("Mật khẩu hiện tại không chính xác");
            }
            
            // Cập nhật mật khẩu mới
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
            user.setCredentialsNonExpired(true);
            user.setLastPasswordChangeDate(LocalDateTime.now());
            
            userRepository.save(user);
            log.info("Đã thay đổi mật khẩu thành công cho người dùng có ID: {}", userId);
            
            return ResponseDTO.<Void>success("Thay đổi mật khẩu thành công", null);
        } catch (BadCredentialsException e) {
            // Đã ghi log ở trên rồi
            throw e;
        } catch (UsernameNotFoundException e) {
            log.warn("Thay đổi mật khẩu thất bại - Người dùng không tồn tại: {}", userId);
            throw e;
        } catch (Exception e) {
            log.error("Lỗi trong quá trình thay đổi mật khẩu (User ID: {})", userId, e);
            throw new TaskManagerException.BusinessLogicException("Lỗi trong quá trình xử lý thay đổi mật khẩu", "AUTH_ERROR");
        }
    }

    @Override
    @Transactional
    public ResponseDTO<JwtResponse> validateToken(String token) {
        try {
            if (jwtTokenService.validateJwtToken(token)) {
                String username = jwtTokenService.getUsernameFromJwtToken(token);
                User user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + username));
                
                List<String> roles = new ArrayList<>(user.getRoles());
                
                JwtResponse jwtResponse = JwtResponse.builder()
                        .token(token) // Giữ nguyên token hiện tại
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .roles(roles)
                        .build();
                
                return ResponseDTO.success("Token hợp lệ", jwtResponse);
            } else {
                throw new TaskManagerException.ValidationException("Token không hợp lệ", "INVALID_TOKEN");
            }
        } catch (Exception e) {
            log.error("Lỗi trong quá trình xác thực token", e);
            throw new TaskManagerException.ValidationException("Token không hợp lệ: " + e.getMessage(), "INVALID_TOKEN");
        }
    }

    @Override
    @Cacheable(value = USER_CACHE, key = "#result.id", condition = "#result != null")
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        
        throw new TaskManagerException.ValidationException("Không tìm thấy người dùng hiện tại", "USER_NOT_FOUND");
    }
    
    @Transactional
    protected void updateLastLogin(String username) {
        try {
            log.debug("Đang cập nhật thời gian đăng nhập cho người dùng: {}", username);
            userRepository.updateLastLoginDate(username, LocalDateTime.now());
        } catch (Exception e) {
            log.warn("Không thể cập nhật thời gian đăng nhập cuối cùng cho người dùng {}: {}", username, e.getMessage());
            // Không ném lỗi vì đây không phải chức năng chính của đăng nhập
        }
    }

    @Override
    @Transactional
    public ResponseDTO<JwtResponse> refreshToken(String refreshToken) {
        try {
            log.info("Đang xử lý yêu cầu làm mới token");
            
            if (refreshToken == null || refreshToken.isEmpty()) {
                log.warn("Refresh token không được cung cấp");
                throw new TaskManagerException.ValidationException("Refresh token không được cung cấp", "INVALID_TOKEN");
            }
            
            // Kiểm tra refresh token có hợp lệ không
            jwtTokenService.validateJwtToken(refreshToken);
            
            // Giải mã refresh token để lấy username
            String username = jwtTokenService.getUsernameFromJwtToken(refreshToken);
            
            if (username == null || username.isEmpty()) {
                log.warn("Không thể lấy username từ refresh token");
                throw new TaskManagerException.ValidationException("Refresh token không hợp lệ", "INVALID_TOKEN");
            }
            
            // Lấy thông tin người dùng từ cơ sở dữ liệu
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.warn("Không tìm thấy người dùng với username: {}", username);
                        return new UsernameNotFoundException("Không tìm thấy người dùng: " + username);
                    });
            
            // Tạo JWT token mới
            String newToken = jwtTokenService.generateJwtToken(user);
            
            // Tạo refresh token mới
            String newRefreshToken = jwtTokenService.generateRefreshToken(user);
            
            // Tạo phản hồi
            List<String> roles = new ArrayList<>(user.getRoles());
            
            JwtResponse jwtResponse = JwtResponse.builder()
                    .token(newToken)
                    .refreshToken(newRefreshToken)
                    .id(user.getId())
                    .username(user.getUsername())
                    .email(user.getEmail())
                    .fullName(user.getFullName())
                    .roles(roles)
                    .build();
            
            log.info("Token đã được làm mới thành công cho người dùng: {}", username);
            
            return ResponseDTO.success("Token đã được làm mới thành công", jwtResponse);
        } catch (ExpiredJwtException e) {
            log.error("Refresh token đã hết hạn: {}", e.getMessage());
            throw new TaskManagerException.ValidationException("Refresh token đã hết hạn", "EXPIRED_REFRESH_TOKEN");
        } catch (SignatureException | MalformedJwtException | UnsupportedJwtException | IllegalArgumentException e) {
            log.error("Refresh token không hợp lệ: {}", e.getMessage());
            throw new TaskManagerException.ValidationException("Refresh token không hợp lệ: " + e.getMessage(), "INVALID_TOKEN");
        } catch (Exception e) {
            log.error("Lỗi trong quá trình làm mới token", e);
            throw new TaskManagerException.BusinessLogicException("Lỗi trong quá trình xử lý làm mới token", "REFRESH_TOKEN_ERROR");
        }
    }
} 