package com.net.ken.server.exception;

import jakarta.persistence.EntityExistsException;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
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
    public ResponseEntity<Object> handleResourceNotFoundException(TaskManagerException.ResourceNotFoundException ex) {
        log.error("ResourceNotFoundException xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(TaskManagerException.ResourceAlreadyExistsException.class)
    public ResponseEntity<Object> handleResourceAlreadyExistsException(TaskManagerException.ResourceAlreadyExistsException ex) {
        log.error("ResourceAlreadyExistsException xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(TaskManagerException.ValidationException.class)
    public ResponseEntity<Object> handleValidationException(TaskManagerException.ValidationException ex) {
        log.error("ValidationException xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(TaskManagerException.BusinessLogicException.class)
    public ResponseEntity<Object> handleBusinessLogicException(TaskManagerException.BusinessLogicException ex) {
        log.error("BusinessLogicException xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(TaskManagerException.class)
    public ResponseEntity<Object> handleTaskManagerException(TaskManagerException ex) {
        log.error("TaskManagerException xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse(ex.getMessage(), ex.getErrorCode(), HttpStatus.INTERNAL_SERVER_ERROR);
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Object> handleEntityNotFoundException(EntityNotFoundException ex) {
        log.error("EntityNotFoundException xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse(ex.getMessage(), "ENTITY_NOT_FOUND", HttpStatus.NOT_FOUND);
    }
    
    @ExceptionHandler(EntityExistsException.class)
    public ResponseEntity<Object> handleEntityExistsException(EntityExistsException ex) {
        log.error("EntityExistsException xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse(ex.getMessage(), "ENTITY_EXISTS", HttpStatus.CONFLICT);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Object> handleIllegalArgumentException(IllegalArgumentException ex) {
        log.error("IllegalArgumentException xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse(ex.getMessage(), "ILLEGAL_ARGUMENT", HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleMethodArgumentNotValidException(MethodArgumentNotValidException ex) {
        log.error("MethodArgumentNotValidException xảy ra: {}", ex.getMessage(), ex);
        
        BindingResult result = ex.getBindingResult();
        List<FieldError> fieldErrors = result.getFieldErrors();
        
        Map<String, Object> validationErrors = fieldErrors.stream()
                .collect(Collectors.toMap(
                        FieldError::getField,
                        fieldError -> fieldError.getDefaultMessage() == null ?
                                "Validation error" : fieldError.getDefaultMessage()
                ));
        
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", HttpStatus.BAD_REQUEST.getReasonPhrase());
        body.put("errorCode", "VALIDATION_ERROR");
        body.put("message", "Validation failed");
        body.put("validationErrors", validationErrors);
        
        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Object> handleMethodArgumentTypeMismatchException(MethodArgumentTypeMismatchException ex) {
        log.error("MethodArgumentTypeMismatchException xảy ra: {}", ex.getMessage(), ex);
        
        String message = String.format("Tham số '%s' của kiểu '%s' không thể chuyển đổi thành kiểu '%s'",
                ex.getName(), ex.getValue(), ex.getRequiredType().getSimpleName());
        
        return buildErrorResponse(message, "TYPE_MISMATCH", HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Object> handleGlobalException(Exception ex) {
        log.error("Exception không xác định xảy ra: {}", ex.getMessage(), ex);
        return buildErrorResponse("Đã xảy ra lỗi: " + ex.getMessage(), "INTERNAL_SERVER_ERROR", HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    private ResponseEntity<Object> buildErrorResponse(String message, String errorCode, HttpStatus status) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", status.getReasonPhrase());
        body.put("errorCode", errorCode);
        body.put("message", message);
        
        log.debug("Trả về phản hồi lỗi: {}", body);
        return new ResponseEntity<>(body, status);
    }
} 