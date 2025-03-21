package com.net.ken.server.exception;

public class TaskManagerException extends RuntimeException {
    
    private final String errorCode;
    
    public TaskManagerException(String message) {
        super(message);
        this.errorCode = "INTERNAL_ERROR";
    }
    
    public TaskManagerException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public TaskManagerException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "INTERNAL_ERROR";
    }
    
    public TaskManagerException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }
    
    public String getErrorCode() {
        return errorCode;
    }
    
    public static class ResourceNotFoundException extends TaskManagerException {
        public ResourceNotFoundException(String resourceName, String fieldName, Object fieldValue) {
            super(String.format("%s không được tìm thấy với %s: '%s'", resourceName, fieldName, fieldValue), "RESOURCE_NOT_FOUND");
        }
    }
    
    public static class ResourceAlreadyExistsException extends TaskManagerException {
        public ResourceAlreadyExistsException(String resourceName, String fieldName, Object fieldValue) {
            super(String.format("%s đã tồn tại với %s: '%s'", resourceName, fieldName, fieldValue), "RESOURCE_ALREADY_EXISTS");
        }
    }
    
    public static class ValidationException extends TaskManagerException {
        public ValidationException(String message) {
            super(message, "VALIDATION_ERROR");
        }
    }
    
    public static class BusinessLogicException extends TaskManagerException {
        public BusinessLogicException(String message) {
            super(message, "BUSINESS_LOGIC_ERROR");
        }
    }
} 