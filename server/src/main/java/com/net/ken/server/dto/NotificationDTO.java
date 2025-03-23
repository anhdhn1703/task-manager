package com.net.ken.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String message;
    private String type;
    private String priority;
    private boolean read;
    private LocalDateTime createdAt;
    private LocalDateTime notifyAt;
    private LocalDateTime expireAt;
    private Long taskId;
    private String taskTitle;
} 