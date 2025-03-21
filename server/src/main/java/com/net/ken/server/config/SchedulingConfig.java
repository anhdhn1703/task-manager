package com.net.ken.server.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

@Configuration
@EnableScheduling
public class SchedulingConfig {
    // Cấu hình này kích hoạt tính năng lập lịch của Spring
    // Các phương thức được đánh dấu @Scheduled sẽ được tự động thực thi theo lịch trình
} 