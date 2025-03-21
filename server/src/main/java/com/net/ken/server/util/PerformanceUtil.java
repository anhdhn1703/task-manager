package com.net.ken.server.util;

import org.slf4j.Logger;

import java.util.function.Supplier;

public class PerformanceUtil {
    
    private PerformanceUtil() {
        // Private constructor để ngăn việc khởi tạo
    }
    
    /**
     * Đo thời gian thực thi của một khối code và ghi log
     * @param <T> Kiểu trả về của supplier
     * @param log Logger để ghi log
     * @param operationName Tên của thao tác đang đo
     * @param supplier Supplier cung cấp kết quả
     * @return Kết quả từ supplier
     */
    public static <T> T measureExecutionTime(Logger log, String operationName, Supplier<T> supplier) {
        long startTime = System.currentTimeMillis();
        try {
            return supplier.get();
        } finally {
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;
            log.debug("{} thực thi trong {} ms", operationName, duration);
        }
    }
    
    /**
     * Đo thời gian thực thi của một khối code không có giá trị trả về và ghi log
     * @param log Logger để ghi log
     * @param operationName Tên của thao tác đang đo
     * @param runnable Runnable thực thi code
     */
    public static void measureExecutionTime(Logger log, String operationName, Runnable runnable) {
        long startTime = System.currentTimeMillis();
        try {
            runnable.run();
        } finally {
            long endTime = System.currentTimeMillis();
            long duration = endTime - startTime;
            log.debug("{} thực thi trong {} ms", operationName, duration);
        }
    }
} 