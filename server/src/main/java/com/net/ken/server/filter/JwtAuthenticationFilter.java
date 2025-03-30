package com.net.ken.server.filter;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.net.ken.server.dto.ResponseDTO;
import com.net.ken.server.model.User;
import com.net.ken.server.service.JwtTokenService;
import com.net.ken.server.service.impl.ApplicationUserDetailsService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.SignatureException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenService jwtTokenService;
    private final ApplicationUserDetailsService userDetailsService;
    private final ObjectMapper objectMapper;
    
    private static final String[] PUBLIC_ENDPOINTS = {
            "/api/auth/login", 
            "/api/auth/register",
            "/api/auth/refresh-token",
            "/api/public",
            "/actuator",
            "/v3/api-docs",
            "/swagger-ui",
            "/swagger-ui.html",
            "/webjars"
    };

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        
        try {
            String requestURI = request.getRequestURI();
            log.debug("Processing request: {}", requestURI);
            
            // Kiểm tra xem điểm cuối có công khai không
            if (isPublicEndpoint(requestURI)) {
                log.debug("Public endpoint: {}, skipping authentication", requestURI);
                filterChain.doFilter(request, response);
                return;
            }
            
            // Trích xuất JWT token
            String jwt = parseJwt(request);
            
            if (jwt == null) {
                log.debug("No JWT found in request");
                filterChain.doFilter(request, response);
                return;
            }
            
            try {
                // Xác thực token và thiết lập authentication
                String username = jwtTokenService.getUsernameFromJwtToken(jwt);
                log.debug("JWT valid, username: {}", username);
                
                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                
                // Kiểm tra xem token có được tạo trước khi mật khẩu thay đổi không
                if (userDetails instanceof User && jwtTokenService.isTokenIssuedBeforePasswordChange(jwt, (User) userDetails)) {
                    log.warn("JWT được tạo trước khi mật khẩu thay đổi cho người dùng: {}", username);
                    handleJwtException(
                            response,
                            "PASSWORD_CHANGED",
                            "Mật khẩu đã được thay đổi. Vui lòng đăng nhập lại.",
                            HttpStatus.UNAUTHORIZED
                    );
                    return;
                }
                
                UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                        userDetails, null, userDetails.getAuthorities());
                
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
                
                // Tiếp tục chuỗi bộ lọc
                filterChain.doFilter(request, response);
            } catch (ExpiredJwtException e) {
                log.warn("JWT đã hết hạn: {}", e.getMessage());
                handleJwtException(response, "JWT_EXPIRED", "Token đã hết hạn. Vui lòng đăng nhập lại hoặc làm mới token", HttpStatus.UNAUTHORIZED);
            } catch (SignatureException e) {
                log.error("JWT không hợp lệ: {}", e.getMessage());
                handleJwtException(response, "INVALID_JWT_SIGNATURE", "Chữ ký JWT không hợp lệ", HttpStatus.UNAUTHORIZED);
            } catch (MalformedJwtException e) {
                log.error("JWT không đúng định dạng: {}", e.getMessage());
                handleJwtException(response, "MALFORMED_JWT", "Token JWT không đúng định dạng", HttpStatus.UNAUTHORIZED);
            } catch (UnsupportedJwtException e) {
                log.error("JWT không được hỗ trợ: {}", e.getMessage());
                handleJwtException(response, "UNSUPPORTED_JWT", "Token JWT không được hỗ trợ", HttpStatus.UNAUTHORIZED);
            } catch (IllegalArgumentException e) {
                log.error("JWT rỗng: {}", e.getMessage());
                handleJwtException(response, "EMPTY_JWT", "Token JWT rỗng hoặc không hợp lệ", HttpStatus.UNAUTHORIZED);
            }
        } catch (Exception e) {
            log.error("Không thể thiết lập xác thực trong security context", e);
            handleJwtException(
                    response, 
                    "AUTHENTICATION_FAILURE", 
                    "Không thể xác thực: " + e.getMessage(), 
                    HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    private String parseJwt(HttpServletRequest request) {
        String headerAuth = request.getHeader("Authorization");

        if (StringUtils.hasText(headerAuth) && headerAuth.startsWith("Bearer ")) {
            return headerAuth.substring(7);
        }

        return null;
    }
    
    private boolean isPublicEndpoint(String requestURI) {
        for (String endpoint : PUBLIC_ENDPOINTS) {
            if (requestURI.startsWith(endpoint)) {
                return true;
            }
        }
        return false;
    }
    
    private void handleJwtException(
            HttpServletResponse response, 
            String errorCode, 
            String message, 
            HttpStatus status) throws IOException {
        
        ResponseDTO<Void> errorResponse = ResponseDTO.error(
                status.value(),
                "JWT Authentication Error",
                errorCode,
                message
        );
        
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getOutputStream(), errorResponse);
    }
} 