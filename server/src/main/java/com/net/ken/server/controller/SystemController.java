package com.net.ken.server.controller;

import com.net.ken.server.util.LogUtil;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private static final Logger log = LogUtil.getLogger(SystemController.class);
    private final Environment environment;
    private final LocalDateTime startTime = LocalDateTime.now();

    @Autowired
    public SystemController(Environment environment) {
        this.environment = environment;
    }

    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> getSystemInfo() {
        LogUtil.debug(log, "Đang lấy thông tin hệ thống");
        
        Map<String, Object> info = new HashMap<>();
        info.put("applicationName", environment.getProperty("spring.application.name"));
        info.put("serverPort", environment.getProperty("server.port"));
        info.put("javaVersion", System.getProperty("java.version"));
        info.put("osName", System.getProperty("os.name"));
        info.put("osVersion", System.getProperty("os.version"));
        info.put("startTime", startTime);
        info.put("currentTime", LocalDateTime.now());
        info.put("activeProfiles", environment.getActiveProfiles());
        
        return ResponseEntity.ok(info);
    }

    @PostMapping("/log-level")
    public ResponseEntity<Map<String, Object>> changeLogLevel(@RequestBody Map<String, String> body) {
        String packageName = body.get("package");
        String level = body.get("level");
        
        if (packageName == null || level == null) {
            return ResponseEntity.badRequest().build();
        }
        
        LogUtil.info(log, "Thay đổi log level của package '{}' thành '{}'", packageName, level);
        
        // Ghi chú: Việc thay đổi log level trong thời gian chạy thường yêu cầu
        // thêm thư viện như Logback hoặc sử dụng Spring Boot Actuator.
        // Đây chỉ là một API giả định, cần triển khai thực tế phù hợp với logger
        
        Map<String, Object> response = new HashMap<>();
        response.put("package", packageName);
        response.put("level", level);
        response.put("changed", true);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/throw-test-exception")
    public ResponseEntity<Object> throwTestException(@RequestParam(required = false) String type) {
        LogUtil.info(log, "Yêu cầu tạo exception thử nghiệm loại: {}", type);
        
        if (type == null || type.equalsIgnoreCase("general")) {
            throw new RuntimeException("Đây là exception thử nghiệm tổng quát");
        } else if (type.equalsIgnoreCase("notFound")) {
            throw new com.net.ken.server.exception.TaskManagerException.ResourceNotFoundException(
                    "Không tìm thấy tài nguyên TestResource với ID: test-id");
        } else if (type.equalsIgnoreCase("validation")) {
            throw new com.net.ken.server.exception.TaskManagerException.ValidationException("Đây là lỗi validation thử nghiệm");
        } else if (type.equalsIgnoreCase("business")) {
            throw new com.net.ken.server.exception.TaskManagerException.BusinessLogicException("Đây là lỗi business logic thử nghiệm");
        }
        
        return ResponseEntity.ok().build();
    }
} 