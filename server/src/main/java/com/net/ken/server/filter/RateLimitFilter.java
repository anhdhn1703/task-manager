package com.net.ken.server.filter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Filter để giới hạn tốc độ yêu cầu từ một địa chỉ IP nhất định.
 * Điều này giúp ngăn chặn các cuộc tấn công brute force và DDoS.
 */
@Component
@RequiredArgsConstructor
public class RateLimitFilter extends OncePerRequestFilter {

    // Số lượng yêu cầu tối đa cho phép trong khoảng thời gian cửa sổ
    private static final int MAX_REQUESTS = 60; // 60 yêu cầu
    
    // Khoảng thời gian cửa sổ tính bằng mili giây
    private static final long WINDOW_SIZE_MS = TimeUnit.MINUTES.toMillis(1); // 1 phút
    
    // Lưu trữ thông tin về các yêu cầu từ mỗi IP
    private final Map<String, RequestInfo> requestCounts = new ConcurrentHashMap<>();
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain) 
            throws ServletException, IOException {
        
        // Bỏ qua rate limit cho các yêu cầu Swagger và Actuator
        String requestURI = request.getRequestURI();
        if (requestURI.contains("/swagger") || requestURI.contains("/actuator") || 
            requestURI.contains("/v3/api-docs") || requestURI.contains("/webjars")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Lấy địa chỉ IP của client
        String clientIp = getClientIP(request);
        
        // Áp dụng rate limit nghiêm ngặt hơn cho các endpoint xác thực
        if (requestURI.contains("/api/auth/login") || requestURI.contains("/api/auth/register")) {
            if (isRateLimited(clientIp, 20, TimeUnit.MINUTES.toMillis(1))) { // 20 yêu cầu/phút cho xác thực
                response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
                response.setContentType("application/json;charset=UTF-8");
                response.setCharacterEncoding("UTF-8");
                response.getWriter().write("{\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Quá nhiều yêu cầu, hãy thử lại sau.\"}");
                return;
            }
        } else if (isRateLimited(clientIp, MAX_REQUESTS, WINDOW_SIZE_MS)) {
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json;charset=UTF-8");
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("{\"error\":\"TOO_MANY_REQUESTS\",\"message\":\"Quá nhiều yêu cầu, hãy thử lại sau.\"}");
            return;
        }
        
        // Tiếp tục với chuỗi filter tiếp theo
        filterChain.doFilter(request, response);
    }
    
    /**
     * Kiểm tra xem một địa chỉ IP có vượt quá giới hạn tốc độ hay không.
     * 
     * @param clientIp Địa chỉ IP của client
     * @param maxRequests Số lượng yêu cầu tối đa trong khoảng thời gian
     * @param windowSizeMs Khoảng thời gian tính bằng mili giây
     * @return true nếu vượt quá giới hạn, false nếu không
     */
    private boolean isRateLimited(String clientIp, int maxRequests, long windowSizeMs) {
        long currentTime = System.currentTimeMillis();
        
        RequestInfo requestInfo = requestCounts.compute(clientIp, (key, info) -> {
            if (info == null || currentTime - info.getWindowStart() > windowSizeMs) {
                // Tạo mới hoặc reset nếu cửa sổ trước đã hết hạn
                return new RequestInfo(currentTime, 1);
            } else {
                // Tăng số lượng yêu cầu
                info.incrementCount();
                return info;
            }
        });
        
        // Dọn dẹp các mục cũ
        if (currentTime % 1000 == 0) { // Thực hiện dọn dẹp định kỳ
            cleanupOldEntries(currentTime - windowSizeMs);
        }
        
        return requestInfo.getCount() > maxRequests;
    }
    
    /**
     * Dọn dẹp các mục cũ trong bản đồ yêu cầu.
     * 
     * @param cutoffTime Thời gian cutoff tính bằng mili giây
     */
    private void cleanupOldEntries(long cutoffTime) {
        requestCounts.entrySet().removeIf(entry -> entry.getValue().getWindowStart() < cutoffTime);
    }
    
    /**
     * Lấy địa chỉ IP thực của client, có xử lý cho proxy.
     * 
     * @param request HttpServletRequest
     * @return Địa chỉ IP của client
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
    
    /**
     * Lớp lưu trữ thông tin về yêu cầu cho mỗi địa chỉ IP.
     */
    private static class RequestInfo {
        private final long windowStart;
        private int count;
        
        public RequestInfo(long windowStart, int count) {
            this.windowStart = windowStart;
            this.count = count;
        }
        
        public long getWindowStart() {
            return windowStart;
        }
        
        public int getCount() {
            return count;
        }
        
        public void incrementCount() {
            this.count++;
        }
    }
} 