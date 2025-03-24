package com.net.ken.server.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ResponseDTO<T> {
    private LocalDateTime timestamp;
    private int status;
    private String title;
    private String errorCode;
    private String message;
    private Map<String, String> validationErrors;
    private T data;
    private boolean success;
    
    // Thông tin về phân trang
    private PageInfo pageInfo;
    
    // Chứa thông tin phân trang cho phản hồi nếu có
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PageInfo {
        private int page;
        private int size;
        private int totalPages;
        private long totalElements;
    }
    
    // Các phương thức factory để tạo các loại phản hồi khác nhau
    
    public static <T> ResponseDTO<T> success(T data) {
        return ResponseDTO.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(200)
                .success(true)
                .message("Thành công")
                .data(data)
                .build();
    }
    
    public static <T> ResponseDTO<T> success(String message, T data) {
        return ResponseDTO.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(200)
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
    
    public static <T> ResponseDTO<T> success(T data, String message) {
        return ResponseDTO.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(200)
                .success(true)
                .message(message)
                .data(data)
                .build();
    }
    
    public static <T> ResponseDTO<T> success(T data, String message, PageInfo pageInfo) {
        return ResponseDTO.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(200)
                .success(true)
                .message(message)
                .data(data)
                .pageInfo(pageInfo)
                .build();
    }
    
    public static <T> ResponseDTO<T> error(int status, String title, String errorCode, String message) {
        return ResponseDTO.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(status)
                .title(title)
                .errorCode(errorCode)
                .message(message)
                .success(false)
                .build();
    }
    
    public static <T> ResponseDTO<T> validationError(String message, Map<String, String> validationErrors) {
        return ResponseDTO.<T>builder()
                .timestamp(LocalDateTime.now())
                .status(400)
                .title("Validation Error")
                .errorCode("VALIDATION_ERROR")
                .message(message)
                .validationErrors(validationErrors)
                .success(false)
                .build();
    }
} 