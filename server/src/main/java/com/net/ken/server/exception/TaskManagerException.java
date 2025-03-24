package com.net.ken.server.exception;

import lombok.Getter;

@Getter
public class TaskManagerException extends RuntimeException {
    private String errorCode;
    
    public TaskManagerException(String message) {
        super(message);
        this.errorCode = "TASK_MANAGER_ERROR";
    }
    
    public TaskManagerException(String message, String errorCode) {
        super(message);
        this.errorCode = errorCode;
    }
    
    public TaskManagerException(String message, Throwable cause) {
        super(message, cause);
        this.errorCode = "TASK_MANAGER_ERROR";
    }
    
    public TaskManagerException(String message, String errorCode, Throwable cause) {
        super(message, cause);
        this.errorCode = errorCode;
    }

    @Getter
    public static class ResourceNotFoundException extends TaskManagerException {
        public ResourceNotFoundException(String message) {
            super(message, "RESOURCE_NOT_FOUND");
        }
        
        public ResourceNotFoundException(String message, String errorCode) {
            super(message, errorCode);
        }
    }
    
    @Getter
    public static class ResourceAlreadyExistsException extends TaskManagerException {
        public ResourceAlreadyExistsException(String message) {
            super(message, "RESOURCE_ALREADY_EXISTS");
        }
        
        public ResourceAlreadyExistsException(String message, String errorCode) {
            super(message, errorCode);
        }
    }
    
    @Getter
    public static class ValidationException extends TaskManagerException {
        public ValidationException(String message) {
            super(message, "VALIDATION_ERROR");
        }
        
        public ValidationException(String message, String errorCode) {
            super(message, errorCode);
        }
    }
    
    @Getter
    public static class BusinessLogicException extends TaskManagerException {
        public BusinessLogicException(String message) {
            super(message, "BUSINESS_LOGIC_ERROR");
        }
        
        public BusinessLogicException(String message, String errorCode) {
            super(message, errorCode);
        }
    }
} 