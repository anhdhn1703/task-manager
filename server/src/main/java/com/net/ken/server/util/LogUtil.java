package com.net.ken.server.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LogUtil {
    
    private LogUtil() {
        // Private constructor để ngăn việc khởi tạo
    }
    
    /**
     * Lấy logger cho class
     * @param clazz Class cần log
     * @return Logger instance
     */
    public static Logger getLogger(Class<?> clazz) {
        return LoggerFactory.getLogger(clazz);
    }
    
    /**
     * Log debug với message và các tham số
     * @param log Logger instance
     * @param message Message pattern
     * @param args Arguments cho message
     */
    public static void debug(Logger log, String message, Object... args) {
        if (log.isDebugEnabled()) {
            log.debug(message, args);
        }
    }
    
    /**
     * Log thông tin với message và các tham số
     * @param log Logger instance
     * @param message Message pattern
     * @param args Arguments cho message
     */
    public static void info(Logger log, String message, Object... args) {
        if (log.isInfoEnabled()) {
            log.info(message, args);
        }
    }
    
    /**
     * Log cảnh báo với message và các tham số
     * @param log Logger instance
     * @param message Message pattern
     * @param args Arguments cho message
     */
    public static void warn(Logger log, String message, Object... args) {
        log.warn(message, args);
    }
    
    /**
     * Log lỗi với message và exception
     * @param log Logger instance
     * @param message Message pattern
     * @param e Exception cần log
     * @param args Arguments cho message
     */
    public static void error(Logger log, String message, Throwable e, Object... args) {
        log.error(message, args, e);
    }
} 