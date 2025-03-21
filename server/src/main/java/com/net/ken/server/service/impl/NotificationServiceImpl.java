package com.net.ken.server.service.impl;

import com.net.ken.server.dto.NotificationDTO;
import com.net.ken.server.model.Notification;
import com.net.ken.server.model.Notification.NotificationType;
import com.net.ken.server.model.Task;
import com.net.ken.server.repository.NotificationRepository;
import com.net.ken.server.repository.TaskRepository;
import com.net.ken.server.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final TaskRepository taskRepository;
    
    @Autowired
    public NotificationServiceImpl(NotificationRepository notificationRepository, 
                                   TaskRepository taskRepository) {
        this.notificationRepository = notificationRepository;
        this.taskRepository = taskRepository;
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        return notificationRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationDTO getNotificationById(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo với ID: " + id));
        return convertToDTO(notification);
    }

    @Override
    public List<NotificationDTO> getUnreadNotifications() {
        return notificationRepository.findByReadOrderByCreatedAtDesc(false).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getNotificationsByTaskId(Long taskId) {
        if (!taskRepository.existsById(taskId)) {
            throw new EntityNotFoundException("Không tìm thấy công việc với ID: " + taskId);
        }
        return notificationRepository.findByTaskId(taskId).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getRecentNotifications(int days) {
        LocalDateTime fromDate = LocalDateTime.now().minusDays(days);
        return notificationRepository.findByCreatedAtAfterOrderByCreatedAtDesc(fromDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationDTO createNotification(String message, String type, Long taskId) {
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc với ID: " + taskId));
        
        Notification notification = new Notification();
        notification.setMessage(message);
        
        try {
            notification.setType(NotificationType.valueOf(type.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Loại thông báo không hợp lệ: " + type);
        }
        
        notification.setTask(task);
        
        Notification savedNotification = notificationRepository.save(notification);
        return convertToDTO(savedNotification);
    }

    @Override
    @Transactional
    public NotificationDTO markNotificationAsRead(Long id) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo với ID: " + id));
        
        notification.setRead(true);
        
        Notification updatedNotification = notificationRepository.save(notification);
        return convertToDTO(updatedNotification);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        if (!notificationRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy thông báo với ID: " + id);
        }
        notificationRepository.deleteById(id);
    }
    
    @Override
    @Scheduled(cron = "0 0 0 * * ?") // Kiểm tra hàng ngày vào lúc nửa đêm
    @Transactional
    public void checkAndCreateDeadlineNotifications() {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime twoDaysLater = now.plusDays(2);
        
        // Tìm các task sắp đến hạn trong vòng 2 ngày tới
        List<Task> upcomingDeadlines = taskRepository.findTasksWithDueDateBetween(now, twoDaysLater);
        
        for (Task task : upcomingDeadlines) {
            // Chỉ tạo thông báo cho các task chưa hoàn thành
            if (task.getStatus() != Task.Status.COMPLETED) {
                String message = "Công việc \"" + task.getTitle() + "\" sắp đến hạn vào " + 
                        task.getDueDate().toLocalDate();
                
                Notification notification = new Notification();
                notification.setMessage(message);
                notification.setType(NotificationType.DEADLINE_APPROACHING);
                notification.setTask(task);
                
                notificationRepository.save(notification);
            }
        }
    }
    
    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType().name());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        
        if (notification.getTask() != null) {
            dto.setTaskId(notification.getTask().getId());
            dto.setTaskTitle(notification.getTask().getTitle());
        }
        
        return dto;
    }
}