package com.net.ken.server.service;

import com.net.ken.server.dto.NotificationDTO;

import java.util.List;

public interface NotificationService {
    List<NotificationDTO> getAllNotifications();
    
    NotificationDTO getNotificationById(Long id);
    
    List<NotificationDTO> getUnreadNotifications();
    
    List<NotificationDTO> getNotificationsByTaskId(Long taskId);
    
    List<NotificationDTO> getRecentNotifications(int days);
    
    NotificationDTO createNotification(String message, String type, Long taskId);
    
    NotificationDTO markNotificationAsRead(Long id);
    
    void deleteNotification(Long id);
    
    void checkAndCreateDeadlineNotifications();
} 