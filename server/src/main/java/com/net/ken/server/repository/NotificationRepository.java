package com.net.ken.server.repository;

import com.net.ken.server.model.Notification;
import com.net.ken.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserOrderByCreatedAtDesc(User user);
    
    List<Notification> findByUserAndReadOrderByCreatedAtDesc(User user, boolean read);
    
    List<Notification> findByReadOrderByCreatedAtDesc(boolean read);
    
    List<Notification> findByTaskIdAndUser(Long taskId, User user);
    
    List<Notification> findByTaskId(Long taskId);
    
    List<Notification> findByUserAndCreatedAtAfterOrderByCreatedAtDesc(User user, LocalDateTime date);
    
    List<Notification> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime date);
    
    List<Notification> findByUserAndTaskIdAndTypeAndCreatedAtAfter(
            User user, Long taskId, Notification.NotificationType type, LocalDateTime date);
            
    List<Notification> findByTaskIdAndTypeAndCreatedAtAfter(
            Long taskId, Notification.NotificationType type, LocalDateTime date);
            
    List<Notification> findByUserAndNotifyAtBeforeAndReadOrderByPriority(
            User user, LocalDateTime time, boolean read);
            
    List<Notification> findByNotifyAtBeforeAndReadOrderByPriority(
            LocalDateTime time, boolean read);
            
    List<Notification> findByUserAndExpireAtBeforeAndRead(
            User user, LocalDateTime time, boolean read);
            
    List<Notification> findByExpireAtBeforeAndRead(
            LocalDateTime time, boolean read);
            
    List<Notification> findByUserAndTypeAndPriorityOrderByCreatedAtDesc(
            User user, Notification.NotificationType type, Notification.NotificationPriority priority);
            
    List<Notification> findByTypeAndPriorityOrderByCreatedAtDesc(
            Notification.NotificationType type, Notification.NotificationPriority priority);
} 