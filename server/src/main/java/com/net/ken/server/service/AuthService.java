package com.net.ken.server.service;

import com.net.ken.server.dto.ResponseDTO;
import com.net.ken.server.dto.auth.ChangePasswordRequest;
import com.net.ken.server.dto.auth.JwtResponse;
import com.net.ken.server.dto.auth.LoginRequest;
import com.net.ken.server.dto.auth.LoginResponse;
import com.net.ken.server.dto.auth.RegisterRequest;
import com.net.ken.server.model.User;

/**
 * Dịch vụ xác thực để quản lý đăng nhập, đăng ký và xác thực token.
 */
public interface AuthService {
    
    /**
     * Xác thực người dùng và tạo JWT token.
     * 
     * @param loginRequest đối tượng chứa thông tin đăng nhập
     * @return đối tượng phản hồi JWT với token và thông tin người dùng
     */
    ResponseDTO<LoginResponse> authenticateUser(LoginRequest loginRequest);
    
    /**
     * Đăng ký người dùng mới và tạo JWT token.
     * 
     * @param registerRequest đối tượng chứa thông tin đăng ký
     * @return đối tượng phản hồi JWT với token và thông tin người dùng
     */
    ResponseDTO<JwtResponse> registerUser(RegisterRequest registerRequest);
    
    /**
     * Thay đổi mật khẩu cho người dùng hiện tại.
     * 
     * @param request đối tượng chứa mật khẩu cũ và mới
     * @param userId ID của người dùng
     * @return phản hồi thành công
     */
    ResponseDTO<Void> changePassword(ChangePasswordRequest request, Long userId);
    
    /**
     * Thay đổi mật khẩu đã quá hạn cho người dùng.
     * Khác với changePassword thông thường, phương thức này không yêu cầu mật khẩu cũ
     * nhưng chỉ hoạt động khi mật khẩu đã thực sự quá hạn.
     * 
     * @param username tên người dùng
     * @param newPassword mật khẩu mới
     * @return phản hồi JWT với token mới và thông tin người dùng
     */
    ResponseDTO<JwtResponse> changeExpiredPassword(String username, String newPassword);
    
    /**
     * Mở khóa tài khoản người dùng.
     * 
     * @param username tên người dùng cần mở khóa
     * @return phản hồi thành công
     */
    ResponseDTO<Void> unlockUserAccount(String username);
    
    /**
     * Xác thực token JWT và trả về thông tin người dùng.
     * 
     * @param token JWT token cần xác thực
     * @return đối tượng phản hồi JWT với thông tin người dùng
     */
    ResponseDTO<JwtResponse> validateToken(String token);
    
    /**
     * Lấy thông tin người dùng hiện tại từ context.
     * 
     * @return đối tượng User của người dùng hiện tại
     */
    User getCurrentUser();
    
    /**
     * Làm mới JWT token sử dụng refresh token.
     * 
     * @param refreshToken refresh token dùng để làm mới JWT token
     * @return đối tượng phản hồi JWT với token mới và thông tin người dùng
     */
    ResponseDTO<JwtResponse> refreshToken(String refreshToken);
} 