package com.net.ken.server.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeExpiredPasswordRequest {
    
    @NotBlank(message = "Tên đăng nhập không được để trống")
    private String username;
    
    @NotBlank(message = "Mật khẩu mới không được để trống")
    @Size(min = 8, max = 50, message = "Mật khẩu mới phải từ 8 đến 50 ký tự")
    @Pattern(
        regexp = "^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=!])(?=\\S+$).{8,}$",
        message = "Mật khẩu phải chứa ít nhất 1 chữ số, 1 chữ thường, 1 chữ hoa, 1 ký tự đặc biệt và không chứa khoảng trắng"
    )
    private String newPassword;
    
    @NotBlank(message = "Xác nhận mật khẩu mới không được để trống")
    private String confirmNewPassword;
} 