package com.net.ken.server.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.net.ken.server.dto.ResponseDTO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Điểm vào xác thực tùy chỉnh để xử lý các ngoại lệ xác thực.
 * Lớp này điều khiển cách ứng dụng phản hồi khi người dùng không được xác thực
 * cố gắng truy cập một tài nguyên được bảo vệ.
 */
@Component
@RequiredArgsConstructor
public class AuthEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        
        // Ghi log thông tin về yêu cầu thất bại
        String requestURI = request.getRequestURI();
        String method = request.getMethod();
        
        // Tạo phản hồi lỗi phù hợp
        ResponseDTO<Void> errorResponse = ResponseDTO.error(
                HttpStatus.UNAUTHORIZED.value(),
                "Unauthorized",
                "AUTHENTICATION_FAILURE",
                "Xác thực không thành công: " + authException.getMessage()
        );
        
        // Thiết lập phản hồi HTTP
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        
        // Ghi đối tượng phản hồi dưới dạng JSON trong phần thân phản hồi
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
} 