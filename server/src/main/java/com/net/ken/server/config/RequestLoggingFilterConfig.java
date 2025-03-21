package com.net.ken.server.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.util.UUID;

@Configuration
public class RequestLoggingFilterConfig {
    
    private static final Logger log = LoggerFactory.getLogger(RequestLoggingFilterConfig.class);
    
    @Bean
    public OncePerRequestFilter requestLoggingFilter() {
        return new OncePerRequestFilter() {
            @Override
            protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
                    throws ServletException, IOException {
                
                // Tạo ID cho mỗi request
                String requestId = UUID.randomUUID().toString();
                MDC.put("requestId", requestId);
                
                // Lấy thông tin về request
                String method = request.getMethod();
                String uri = request.getRequestURI();
                String queryString = request.getQueryString();
                
                // Wrap request và response để có thể đọc body nhiều lần
                ContentCachingRequestWrapper requestWrapper = new ContentCachingRequestWrapper(request);
                ContentCachingResponseWrapper responseWrapper = new ContentCachingResponseWrapper(response);
                
                log.debug("Bắt đầu xử lý request [{}]: {} {} {}", 
                        requestId, method, uri, queryString != null ? "?" + queryString : "");
                
                long startTime = System.currentTimeMillis();
                
                try {
                    // Chuyển request tới filter tiếp theo hoặc endpoint
                    filterChain.doFilter(requestWrapper, responseWrapper);
                    
                    // Log thông tin xử lý request
                    long duration = System.currentTimeMillis() - startTime;
                    log.debug("Hoàn thành xử lý request [{}]: {} {} - {} ({} ms)", 
                            requestId, method, uri, responseWrapper.getStatus(), duration);
                    
                } catch (Exception e) {
                    log.error("Lỗi khi xử lý request [{}]: {} {}", requestId, method, uri, e);
                    throw e;
                } finally {
                    // Copy nội dung từ response wrapper để trả về client
                    responseWrapper.copyBodyToResponse();
                    
                    // Xóa requestId khỏi MDC
                    MDC.remove("requestId");
                }
            }
        };
    }
} 