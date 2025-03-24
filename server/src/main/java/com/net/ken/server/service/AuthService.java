package com.net.ken.server.service;

import com.net.ken.server.dto.ResponseDTO;
import com.net.ken.server.dto.auth.ChangePasswordRequest;
import com.net.ken.server.dto.auth.JwtResponse;
import com.net.ken.server.dto.auth.LoginRequest;
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
    ResponseDTO<JwtResponse> authenticateUser(LoginRequest loginRequest);
    
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