package com.net.ken.server.repository;

import com.net.ken.server.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByTaskId(Long taskId);
    
    List<Notification> findByReadOrderByCreatedAtDesc(boolean read);
    
    List<Notification> findByCreatedAtAfterOrderByCreatedAtDesc(LocalDateTime date);
} 