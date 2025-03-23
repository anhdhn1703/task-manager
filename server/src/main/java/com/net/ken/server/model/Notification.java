package com.net.ken.server.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "notifications")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    private NotificationType type;

    @Enumerated(EnumType.STRING)
    private NotificationPriority priority = NotificationPriority.NORMAL;

    @Column(name = "is_read")
    private boolean read = false;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "notify_at")
    private LocalDateTime notifyAt;

    @Column(name = "expire_at")
    private LocalDateTime expireAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id")
    private Task task;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        
        // Nếu notifyAt chưa được đặt, mặc định là thời điểm hiện tại
        if (notifyAt == null) {
            notifyAt = LocalDateTime.now();
        }
        
        // Nếu priority chưa được đặt, đặt ưu tiên dựa trên loại thông báo
        if (priority == null) {
            setPriorityBasedOnType();
        }
    }
    
    private void setPriorityBasedOnType() {
        if (type == null) {
            priority = NotificationPriority.NORMAL;
            return;
        }
        
        switch (type) {
            case DEADLINE_APPROACHING:
                // Nếu deadline sắp đến, đặt ưu tiên cao
                priority = NotificationPriority.HIGH;
                break;
            case DEADLINE_OVERDUE:
                // Nếu deadline đã quá hạn, đặt ưu tiên khẩn cấp
                priority = NotificationPriority.URGENT;
                break;
            case TASK_COMPLETED:
                priority = NotificationPriority.LOW;
                break;
            case TASK_ASSIGNED:
                priority = NotificationPriority.NORMAL;
                break;
            case PRIORITY_CHANGED:
                priority = NotificationPriority.NORMAL;
                break;
            default:
                priority = NotificationPriority.NORMAL;
        }
    }

    public enum NotificationType {
        DEADLINE_APPROACHING, DEADLINE_OVERDUE, TASK_ASSIGNED, TASK_COMPLETED, PRIORITY_CHANGED
    }
    
    public enum NotificationPriority {
        LOW, NORMAL, HIGH, URGENT
    }
} 