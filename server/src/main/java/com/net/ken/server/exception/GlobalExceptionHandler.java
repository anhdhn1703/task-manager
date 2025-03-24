package com.net.ken.server.exception;

import com.net.ken.server.dto.ResponseDTO;
import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.context.request.ServletWebRequest;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@ControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(TaskManagerException.ResourceNotFoundException.class)
    public ResponseEntity<ResponseDTO<Void>> handleResourceNotFoundException(
            TaskManagerException.ResourceNotFoundException ex, WebRequest request) {
        
        log.error("ResourceNotFoundException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.NOT_FOUND.value(), 
                "Resource Not Found", 
                ex.getErrorCode(), 
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(TaskManagerException.ResourceAlreadyExistsException.class)
    public ResponseEntity<ResponseDTO<Void>> handleResourceAlreadyExistsException(
            TaskManagerException.ResourceAlreadyExistsException ex, WebRequest request) {
        
        log.error("ResourceAlreadyExistsException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.CONFLICT.value(), 
                "Resource Already Exists", 
                ex.getErrorCode(), 
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(TaskManagerException.ValidationException.class)
    public ResponseEntity<ResponseDTO<Void>> handleValidationException(
            TaskManagerException.ValidationException ex, WebRequest request) {
        
        log.error("ValidationException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.BAD_REQUEST.value(), 
                "Validation Error", 
                ex.getErrorCode(), 
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(TaskManagerException.BusinessLogicException.class)
    public ResponseEntity<ResponseDTO<Void>> handleBusinessLogicException(
            TaskManagerException.BusinessLogicException ex, WebRequest request) {
        
        log.error("BusinessLogicException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.BAD_REQUEST.value(), 
                "Business Logic Error", 
                ex.getErrorCode(), 
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(TaskManagerException.class)
    public ResponseEntity<ResponseDTO<Void>> handleTaskManagerException(
            TaskManagerException ex, WebRequest request) {
        
        log.error("TaskManagerException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.INTERNAL_SERVER_ERROR.value(), 
                "Internal Server Error", 
                ex.getErrorCode(), 
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ResponseDTO<Void>> handleEntityNotFoundException(
            EntityNotFoundException ex, WebRequest request) {
        
        log.error("EntityNotFoundException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.NOT_FOUND.value(), 
                "Resource Not Found", 
                "ENTITY_NOT_FOUND", 
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(EntityExistsException.class)
    public ResponseEntity<ResponseDTO<Void>> handleEntityExistsException(
            EntityExistsException ex, WebRequest request) {
        
        log.error("EntityExistsException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.CONFLICT.value(), 
                "Resource Already Exists", 
                "ENTITY_EXISTS", 
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ResponseDTO<Void>> handleDataIntegrityViolationException(
            DataIntegrityViolationException ex, WebRequest request) {
        
        log.error("DataIntegrityViolationException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        String message = "Không thể thực hiện thao tác vì vi phạm toàn vẹn dữ liệu. " +
                "Có thể do xung đột với dữ liệu hiện có hoặc ràng buộc cơ sở dữ liệu.";
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.CONFLICT.value(), 
                "Data Integrity Error", 
                "DATA_INTEGRITY_VIOLATION", 
                message
        );
        
        return new ResponseEntity<>(response, HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ResponseDTO<Void>> handleIllegalArgumentException(
            IllegalArgumentException ex, WebRequest request) {
        
        log.error("IllegalArgumentException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.BAD_REQUEST.value(), 
                "Invalid Argument", 
                "ILLEGAL_ARGUMENT", 
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ResponseDTO<Void>> handleMethodArgumentNotValidException(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        log.error("MethodArgumentNotValidException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        BindingResult result = ex.getBindingResult();
        List<FieldError> fieldErrors = result.getFieldErrors();
        
        Map<String, String> validationErrors = fieldErrors.stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() == null ?
                                "Validation error" : fieldError.getDefaultMessage()
                ));
        
        ResponseDTO<Void> response = ResponseDTO.validationError(
                "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại đầu vào.",
                validationErrors
        );
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ResponseDTO<Void>> handleMethodArgumentTypeMismatchException(
            MethodArgumentTypeMismatchException ex, WebRequest request) {
        
        log.error("MethodArgumentTypeMismatchException xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        String message = String.format("Tham số '%s' của kiểu '%s' không thể chuyển đổi thành kiểu '%s'",
                ex.getName(), ex.getValue(), ex.getRequiredType().getSimpleName());
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.BAD_REQUEST.value(), 
                "Type Mismatch", 
                "TYPE_MISMATCH", 
                message
        );
        
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ResponseDTO<Void>> handleBadCredentialsException(
            BadCredentialsException ex, WebRequest request) {
        
        log.error("BadCredentialsException: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request));
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.UNAUTHORIZED.value(),
                "Authentication Error",
                "BAD_CREDENTIALS",
                "Tên đăng nhập hoặc mật khẩu không đúng"
        );
        
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }
    
    @ExceptionHandler(UsernameNotFoundException.class)
    public ResponseEntity<ResponseDTO<Void>> handleUsernameNotFoundException(
            UsernameNotFoundException ex, WebRequest request) {
        
        log.error("UsernameNotFoundException: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request));
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.UNAUTHORIZED.value(),
                "Authentication Error",
                "USERNAME_NOT_FOUND",
                ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ResponseDTO<Void>> handleAccessDeniedException(
            AccessDeniedException ex, WebRequest request) {
        
        log.error("AccessDeniedException: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request));
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.FORBIDDEN.value(),
                "Access Denied",
                "ACCESS_DENIED",
                "Bạn không có quyền truy cập tài nguyên này"
        );
        
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ResponseDTO<Void>> handleGlobalException(
            Exception ex, WebRequest request) {
        
        log.error("Exception không xác định xảy ra: {} (URI: {})", 
                ex.getMessage(), getRequestURI(request), ex);
        
        ResponseDTO<Void> response = ResponseDTO.error(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "INTERNAL_SERVER_ERROR",
                "Đã xảy ra lỗi: " + ex.getMessage()
        );
        
        return new ResponseEntity<>(response, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    private String getRequestURI(WebRequest request) {
        if (request instanceof ServletWebRequest) {
            return ((ServletWebRequest) request).getRequest().getRequestURI();
        }
        return "N/A";
    }
} 