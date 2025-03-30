package com.net.ken.server.service.impl;

import com.net.ken.server.dto.ResponseDTO;
import com.net.ken.server.dto.auth.ChangePasswordRequest;
import com.net.ken.server.dto.auth.JwtResponse;
import com.net.ken.server.dto.auth.LoginRequest;
import com.net.ken.server.dto.auth.LoginResponse;
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
import java.util.Optional;

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
    @Transactional
    public ResponseDTO<LoginResponse> authenticateUser(LoginRequest loginRequest) {
        try {
            log.info("Đang xác thực người dùng: {}", loginRequest.getUsername());
            
            // Kiểm tra xem username có tồn tại không
            Optional<User> userOpt = userRepository.findByUsername(loginRequest.getUsername());
            if (userOpt.isEmpty()) {
                log.warn("Đăng nhập thất bại - Không tìm thấy người dùng: {}", loginRequest.getUsername());
                
                // Trả về thông báo lỗi chung, không tiết lộ rằng username không tồn tại
                return ResponseDTO.error(
                    "Tên đăng nhập hoặc mật khẩu không chính xác",
                    "INVALID_CREDENTIALS",
                    LoginResponse.error("Tên đăng nhập hoặc mật khẩu không chính xác", "INVALID_CREDENTIALS")
                );
            }
            
            User user = userOpt.get();
            
            // Kiểm tra xem tài khoản có bị khóa không
            if (!user.isAccountNonLocked()) {
                log.warn("Đăng nhập thất bại - Tài khoản bị khóa: {}", loginRequest.getUsername());
                
                return ResponseDTO.error(
                    "Tài khoản của bạn đã bị khóa do nhập sai mật khẩu nhiều lần. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
                    "ACCOUNT_LOCKED",
                    LoginResponse.error(
                        "Tài khoản của bạn đã bị khóa do nhập sai mật khẩu nhiều lần. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
                        "ACCOUNT_LOCKED",
                        6
                    )
                );
            }
            
            // Thử xác thực
            try {
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
                user = (User) authentication.getPrincipal();
                
                // Reset số lần đăng nhập sai khi đăng nhập thành công
                user.resetFailedLoginAttempts();
                userRepository.resetFailedLoginAttempts(user.getUsername());
                
                // Tạo token
                String jwt = jwtTokenService.generateToken(user);
                String refreshToken = jwtTokenService.generateRefreshToken(user);
                
                // Cập nhật thời gian đăng nhập cuối
                updateLastLogin(user.getUsername());
                
                // Kiểm tra xem mật khẩu có quá hạn không
                boolean isPasswordExpired = user.isPasswordExpired();
                long daysUntilExpiry = user.getDaysUntilPasswordExpiry();
                
                if (isPasswordExpired) {
                    log.info("Mật khẩu của người dùng {} đã quá hạn, yêu cầu thay đổi mật khẩu", user.getUsername());
                } else if (daysUntilExpiry <= 15) {
                    log.info("Mật khẩu của người dùng {} sẽ hết hạn trong {} ngày", user.getUsername(), daysUntilExpiry);
                }
                
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
                        .passwordExpired(isPasswordExpired)
                        .daysUntilPasswordExpiry(daysUntilExpiry)
                        .build();
                
                log.info("Người dùng {} đã đăng nhập thành công", user.getUsername());
                
                String message = "Đăng nhập thành công";
                if (isPasswordExpired) {
                    message = "Đăng nhập thành công. Mật khẩu của bạn đã quá hạn, vui lòng thay đổi mật khẩu ngay.";
                } else if (daysUntilExpiry <= 15) {
                    message = String.format("Đăng nhập thành công. Mật khẩu của bạn sẽ hết hạn trong %d ngày.", daysUntilExpiry);
                }
                
                // Tạo LoginResponse từ JwtResponse
                LoginResponse loginResponse = LoginResponse.success(jwtResponse, message);
                
                return ResponseDTO.success(message, loginResponse);
                
            } catch (BadCredentialsException e) {
                // Tăng số lần đăng nhập sai và kiểm tra xem có cần khóa tài khoản không
                userRepository.incrementFailedLoginAttempts(user.getUsername());
                
                // Lấy lại thông tin user sau khi cập nhật số lần đăng nhập sai
                user = userRepository.findByUsername(user.getUsername()).orElse(user);
                
                // Kiểm tra xem có cần khóa tài khoản không
                boolean isLocked = user.getFailedLoginAttempts() >= 6;
                if (isLocked) {
                    // Khóa tài khoản nếu đạt giới hạn đăng nhập sai
                    LocalDateTime lockDate = LocalDateTime.of(9999, 12, 31, 0, 0, 0);
                    userRepository.lockUserAccount(user.getUsername(), lockDate);
                    
                    log.warn("Tài khoản {} đã bị khóa do nhập sai mật khẩu quá nhiều lần", user.getUsername());
                    
                    return ResponseDTO.error(
                        "Tài khoản của bạn đã bị khóa do nhập sai mật khẩu nhiều lần. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
                        "ACCOUNT_LOCKED",
                        LoginResponse.error(
                            "Tài khoản của bạn đã bị khóa do nhập sai mật khẩu nhiều lần. Vui lòng liên hệ quản trị viên để được hỗ trợ.",
                            "ACCOUNT_LOCKED",
                            6
                        )
                    );
                }
                
                log.warn("Đăng nhập thất bại - Mật khẩu không chính xác cho người dùng: {} (Lần thử thứ: {})", 
                        user.getUsername(), user.getFailedLoginAttempts());
                        
                // Tạo phản hồi lỗi với thông tin về số lần đăng nhập sai
                return ResponseDTO.error(
                    "Tên đăng nhập hoặc mật khẩu không chính xác",
                    "INVALID_CREDENTIALS",
                    LoginResponse.error(
                        "Tên đăng nhập hoặc mật khẩu không chính xác",
                        "INVALID_CREDENTIALS",
                        user.getFailedLoginAttempts()
                    )
                );
            }
            
        } catch (Exception e) {
            log.error("Lỗi trong quá trình xác thực người dùng", e);
            return ResponseDTO.error(
                "Lỗi trong quá trình xử lý đăng nhập",
                "AUTH_ERROR",
                LoginResponse.error("Lỗi trong quá trình xử lý đăng nhập", "AUTH_ERROR")
            );
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
            String jwt = jwtTokenService.generateToken(user);
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
            
            // Đặt thời gian thay đổi mật khẩu để vô hiệu hóa các token cũ
            LocalDateTime now = LocalDateTime.now();
            user.setLastPasswordChangeDate(now);
            
            userRepository.save(user);
            log.info("Đã thay đổi mật khẩu thành công cho người dùng có ID: {}", userId);
            log.info("Tất cả các phiên đăng nhập hiện có sẽ bị vô hiệu hóa do thay đổi mật khẩu (User ID: {})", userId);
            
            return ResponseDTO.<Void>success("Thay đổi mật khẩu thành công. Vui lòng đăng nhập lại trên tất cả các thiết bị.", null);
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
            if (token == null || token.isEmpty()) {
                log.warn("Token không được cung cấp");
                return ResponseDTO.error(
                    "Token không được cung cấp",
                    "INVALID_TOKEN",
                    null
                );
            }
            
            if (jwtTokenService.validateJwtToken(token)) {
                String username = jwtTokenService.getUsernameFromJwtToken(token);
                User user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng: " + username));
                
                // Kiểm tra xem mật khẩu có quá hạn không
                boolean isPasswordExpired = user.isPasswordExpired();
                long daysUntilExpiry = user.getDaysUntilPasswordExpiry();
                
                List<String> roles = new ArrayList<>(user.getRoles());
                
                JwtResponse jwtResponse = JwtResponse.builder()
                        .token(token) // Giữ nguyên token hiện tại
                        .id(user.getId())
                        .username(user.getUsername())
                        .email(user.getEmail())
                        .fullName(user.getFullName())
                        .roles(roles)
                        .passwordExpired(isPasswordExpired)
                        .daysUntilPasswordExpiry(daysUntilExpiry)
                        .build();
                
                String message = "Token hợp lệ";
                if (isPasswordExpired) {
                    message = "Token hợp lệ. Mật khẩu của bạn đã quá hạn, vui lòng thay đổi mật khẩu ngay.";
                }
                
                return ResponseDTO.success(message, jwtResponse);
            } else {
                return ResponseDTO.error(
                    "Token không hợp lệ hoặc đã hết hạn",
                    "INVALID_TOKEN",
                    null
                );
            }
        } catch (UsernameNotFoundException e) {
            log.error("Không tìm thấy người dùng: {}", e.getMessage());
            return ResponseDTO.error(
                "Không tìm thấy người dùng",
                "USER_NOT_FOUND",
                null
            );
        } catch (Exception e) {
            log.error("Lỗi trong quá trình xác thực token", e);
            return ResponseDTO.error(
                "Lỗi trong quá trình xác thực token",
                "AUTHENTICATION_ERROR",
                null
            );
        }
    }

    @Override
    @Cacheable(value = USER_CACHE, key = "#result != null ? #result.id : 'system'", condition = "#result != null")
    public User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            return (User) authentication.getPrincipal();
        }
        
        // Kiểm tra xem code hiện tại có đang chạy trong scheduled task không
        String currentThreadName = Thread.currentThread().getName();
        if (currentThreadName.contains("scheduling") || currentThreadName.contains("scheduled")) {
            log.debug("Truy cập getCurrentUser trong tác vụ theo lịch, trả về null");
            return null;
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
                return ResponseDTO.error(
                    "Refresh token không được cung cấp",
                    "INVALID_TOKEN",
                    null
                );
            }
            
            // Kiểm tra refresh token có hợp lệ không
            if (!jwtTokenService.validateJwtToken(refreshToken)) {
                log.warn("Refresh token không hợp lệ hoặc đã hết hạn");
                return ResponseDTO.error(
                    "Refresh token không hợp lệ hoặc đã hết hạn",
                    "INVALID_TOKEN",
                    null
                );
            }
            
            // Giải mã refresh token để lấy username
            String username = jwtTokenService.getUsernameFromJwtToken(refreshToken);
            
            if (username == null || username.isEmpty()) {
                log.warn("Không thể lấy username từ refresh token");
                return ResponseDTO.error(
                    "Refresh token không hợp lệ",
                    "INVALID_TOKEN",
                    null
                );
            }
            
            // Lấy thông tin người dùng từ cơ sở dữ liệu
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.warn("Không tìm thấy người dùng với username: {}", username);
                        return new UsernameNotFoundException("Không tìm thấy người dùng: " + username);
                    });
            
            // Kiểm tra xem mật khẩu có quá hạn không
            boolean isPasswordExpired = user.isPasswordExpired();
            long daysUntilExpiry = user.getDaysUntilPasswordExpiry();
            
            // Tạo JWT token mới
            String newToken = jwtTokenService.generateToken(user);
            
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
                    .passwordExpired(isPasswordExpired)
                    .daysUntilPasswordExpiry(daysUntilExpiry)
                    .build();
            
            log.info("Token đã được làm mới thành công cho người dùng: {}", username);
            
            String message = "Token đã được làm mới thành công";
            if (isPasswordExpired) {
                message = "Token đã được làm mới thành công. Mật khẩu của bạn đã quá hạn, vui lòng thay đổi mật khẩu ngay.";
            } else if (daysUntilExpiry <= 15) {
                message = String.format("Token đã được làm mới thành công. Mật khẩu của bạn sẽ hết hạn trong %d ngày.", daysUntilExpiry);
            }
            
            return ResponseDTO.success(message, jwtResponse);
        } catch (UsernameNotFoundException e) {
            log.error("Không tìm thấy người dùng: {}", e.getMessage());
            return ResponseDTO.error(
                "Không tìm thấy người dùng",
                "USER_NOT_FOUND",
                null
            );
        } catch (Exception e) {
            log.error("Lỗi trong quá trình làm mới token", e);
            return ResponseDTO.error(
                "Lỗi trong quá trình xử lý làm mới token",
                "REFRESH_TOKEN_ERROR",
                null
            );
        }
    }

    @Override
    @Transactional
    public ResponseDTO<JwtResponse> changeExpiredPassword(String username, String newPassword) {
        try {
            log.info("Đang xử lý yêu cầu thay đổi mật khẩu quá hạn cho người dùng: {}", username);
            
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.warn("Không tìm thấy người dùng với username: {}", username);
                        return new UsernameNotFoundException("Không tìm thấy người dùng: " + username);
                    });
            
            // Kiểm tra xem mật khẩu có thực sự quá hạn không
            if (!user.isPasswordExpired()) {
                log.warn("Thay đổi mật khẩu quá hạn thất bại - Mật khẩu chưa quá hạn (Username: {})", username);
                throw new TaskManagerException.ValidationException(
                        "Mật khẩu chưa quá hạn. Vui lòng sử dụng chức năng thay đổi mật khẩu thông thường.",
                        "PASSWORD_NOT_EXPIRED"
                );
            }
            
            // Cập nhật mật khẩu mới
            user.setPassword(passwordEncoder.encode(newPassword));
            user.setCredentialsNonExpired(true);
            
            // Đặt thời gian thay đổi mật khẩu
            LocalDateTime now = LocalDateTime.now();
            user.setLastPasswordChangeDate(now);
            
            user = userRepository.save(user);
            log.info("Đã thay đổi mật khẩu quá hạn thành công cho người dùng: {}", username);
            
            // Tạo token mới
            String jwt = jwtTokenService.generateToken(user);
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
                    .passwordExpired(false) // Mật khẩu mới không quá hạn
                    .daysUntilPasswordExpiry(90) // Đặt lại hạn sử dụng mật khẩu
                    .build();
            
            return ResponseDTO.success("Thay đổi mật khẩu thành công. Vui lòng sử dụng thông tin đăng nhập mới.", jwtResponse);
        } catch (UsernameNotFoundException | TaskManagerException.ValidationException e) {
            // Đã ghi log ở trên rồi
            throw e;
        } catch (Exception e) {
            log.error("Lỗi trong quá trình xử lý thay đổi mật khẩu quá hạn", e);
            throw new TaskManagerException.BusinessLogicException("Lỗi trong quá trình xử lý thay đổi mật khẩu", "AUTH_ERROR");
        }
    }

    @Override
    @Transactional
    public ResponseDTO<Void> unlockUserAccount(String username) {
        try {
            log.info("Đang mở khóa tài khoản cho người dùng: {}", username);
            
            User user = userRepository.findByUsername(username)
                    .orElseThrow(() -> {
                        log.warn("Không tìm thấy người dùng với username: {}", username);
                        return new UsernameNotFoundException("Không tìm thấy người dùng: " + username);
                    });
            
            // Kiểm tra xem tài khoản có thực sự bị khóa không
            if (user.isAccountNonLocked()) {
                log.info("Tài khoản {} đã được mở khóa từ trước", username);
                return ResponseDTO.<Void>success("Tài khoản đã được mở khóa", null);
            }
            
            // Mở khóa tài khoản
            userRepository.unlockUserAccount(username);
            
            log.info("Đã mở khóa tài khoản thành công cho người dùng: {}", username);
            
            return ResponseDTO.<Void>success("Mở khóa tài khoản thành công", null);
        } catch (UsernameNotFoundException e) {
            log.warn("Mở khóa tài khoản thất bại - Người dùng không tồn tại: {}", username);
            throw e;
        } catch (Exception e) {
            log.error("Lỗi trong quá trình mở khóa tài khoản (Username: {})", username, e);
            throw new TaskManagerException.BusinessLogicException("Lỗi trong quá trình xử lý mở khóa tài khoản", "AUTH_ERROR");
        }
    }
} 