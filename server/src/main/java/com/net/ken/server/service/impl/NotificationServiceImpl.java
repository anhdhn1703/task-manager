package com.net.ken.server.service.impl;

import com.net.ken.server.dto.NotificationDTO;
import com.net.ken.server.model.Notification;
import com.net.ken.server.model.Notification.NotificationType;
import com.net.ken.server.model.Notification.NotificationPriority;
import com.net.ken.server.model.Task;
import com.net.ken.server.model.User;
import com.net.ken.server.repository.NotificationRepository;
import com.net.ken.server.repository.TaskRepository;
import com.net.ken.server.repository.UserRepository;
import com.net.ken.server.service.AuthService;
import com.net.ken.server.service.NotificationService;
import com.net.ken.server.util.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    
    @Autowired
    public NotificationServiceImpl(NotificationRepository notificationRepository, 
                                   TaskRepository taskRepository,
                                   UserRepository userRepository,
                                   AuthService authService) {
        this.notificationRepository = notificationRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.authService = authService;
    }

    // Lấy người dùng hiện tại từ AuthService
    protected User getCurrentUser() {
        try {
            return authService.getCurrentUser();
        } catch (Exception e) {
            // Trong trường hợp scheduled tasks, trả về null
            return null;
        }
    }

    @Override
    public List<NotificationDTO> getAllNotifications() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByUserOrderByCreatedAtDesc(currentUser).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public NotificationDTO getNotificationById(Long id) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo với ID: " + id));
        
        // Kiểm tra quyền truy cập
        if (notification.getUser() != null && !notification.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền truy cập thông báo này");
        }
        
        return convertToDTO(notification);
    }

    @Override
    public List<NotificationDTO> getUnreadNotifications() {
        User currentUser = getCurrentUser();
        return notificationRepository.findByUserAndReadOrderByCreatedAtDesc(currentUser, false).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getNotificationsByTaskId(Long taskId) {
        User currentUser = getCurrentUser();
        
        if (!taskRepository.existsById(taskId)) {
            throw new EntityNotFoundException("Không tìm thấy công việc với ID: " + taskId);
        }
        
        // Kiểm tra quyền truy cập task
        Task task = taskRepository.findById(taskId)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc với ID: " + taskId));
            
        if (task.getUser() != null && !task.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền truy cập công việc này");
        }
        
        return notificationRepository.findByTaskIdAndUser(taskId, currentUser).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public List<NotificationDTO> getRecentNotifications(int days) {
        User currentUser = getCurrentUser();
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        return notificationRepository.findByUserAndCreatedAtAfterOrderByCreatedAtDesc(currentUser, startDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public NotificationDTO createNotification(String message, String type, Long taskId) {
        User currentUser = getCurrentUser();
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc với ID: " + taskId));
        
        // Kiểm tra quyền truy cập task
        if (task.getUser() != null && !task.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền tạo thông báo cho công việc này");
        }
        
        Notification notification = new Notification();
        notification.setMessage(message);
        
        try {
            notification.setType(NotificationType.valueOf(type.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Loại thông báo không hợp lệ: " + type);
        }
        
        notification.setTask(task);
        notification.setUser(currentUser);
        
        // Thiết lập thời gian thông báo và hết hạn dựa trên loại thông báo
        setNotificationTiming(notification, task);
        
        Notification savedNotification = notificationRepository.save(notification);
        return convertToDTO(savedNotification);
    }

    @Override
    @Transactional
    public NotificationDTO markNotificationAsRead(Long id) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo với ID: " + id));
        
        // Kiểm tra quyền truy cập
        if (notification.getUser() != null && !notification.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền đọc thông báo này");
        }
        
        notification.setRead(true);
        
        Notification updatedNotification = notificationRepository.save(notification);
        return convertToDTO(updatedNotification);
    }

    @Override
    @Transactional
    public void deleteNotification(Long id) {
        User currentUser = getCurrentUser();
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thông báo với ID: " + id));
        
        // Kiểm tra quyền truy cập
        if (notification.getUser() != null && !notification.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền xóa thông báo này");
        }
        
        notificationRepository.deleteById(id);
    }
    
    @Override
    @Scheduled(cron = "0 0 0 * * ?") // Kiểm tra hàng ngày vào lúc nửa đêm
    @Transactional
    public void checkAndCreateDeadlineNotifications() {
        try {
            // Với tác vụ hệ thống, chúng ta cần xử lý thông báo cho tất cả người dùng
            List<User> allUsers = userRepository.findAll();
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime threeDaysLater = now.plusDays(3);
            LocalDateTime twoDaysLater = now.plusDays(2);
            LocalDateTime oneDayLater = now.plusDays(1);
            
            for (User user : allUsers) {
                // Tìm các task chưa hoàn thành có deadline
                List<Task> tasks = taskRepository.findByUserAndStatusNotAndDueDateIsNotNull(user, Task.Status.COMPLETED);
                
                for (Task task : tasks) {
                    LocalDateTime dueDate = task.getDueDate();
                    
                    if (dueDate.isBefore(now)) {
                        // Đã quá hạn
                        createOverdueNotification(task, user);
                    } else {
                        // Tính số giờ đến deadline
                        long hoursToDeadline = ChronoUnit.HOURS.between(now, dueDate);
                        
                        if (hoursToDeadline <= 24) {
                            // Còn dưới 24 giờ
                            createApproachingDeadlineNotification(task, "trong vòng 24 giờ", NotificationPriority.URGENT, user);
                        } else if (dueDate.isBefore(oneDayLater) || dueDate.isEqual(oneDayLater)) {
                            // Còn 1 ngày
                            createApproachingDeadlineNotification(task, "ngày mai", NotificationPriority.HIGH, user);
                        } else if (dueDate.isBefore(twoDaysLater)) {
                            // Còn 2 ngày
                            createApproachingDeadlineNotification(task, "trong 2 ngày", NotificationPriority.NORMAL, user);
                        } else if (dueDate.isBefore(threeDaysLater)) {
                            // Còn 3 ngày
                            createApproachingDeadlineNotification(task, "trong 3 ngày", NotificationPriority.LOW, user);
                        }
                    }
                }
            }
        } catch (Exception e) {
            // Log lỗi nhưng không ném ngoại lệ để tránh dừng các tác vụ theo lịch khác
            log.error("Lỗi khi thực hiện checkAndCreateDeadlineNotifications: ", e);
        }
    }
    
    // Kiểm tra thông báo hàng giờ (cho những thông báo gấp)
    @Override
    @Scheduled(cron = "0 0 * * * ?") // Mỗi giờ
    @Transactional
    public void checkHourlyDeadlineNotifications() {
        try {
            // Với tác vụ hệ thống, chúng ta cần xử lý thông báo cho tất cả người dùng
            List<User> allUsers = userRepository.findAll();
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime oneHourLater = now.plusHours(1);
            
            for (User user : allUsers) {
                // Tìm các task có deadline trong vòng 1 giờ tới
                List<Task> urgentTasks = taskRepository.findByUserAndStatusNotAndDueDateBetween(
                        user, Task.Status.COMPLETED, now, oneHourLater);
                
                for (Task task : urgentTasks) {
                    String message = "KHẨN CẤP: Công việc \"" + task.getTitle() + "\" sẽ hết hạn trong vòng 1 giờ tới!";
                    
                    Notification notification = new Notification();
                    notification.setMessage(message);
                    notification.setType(NotificationType.DEADLINE_APPROACHING);
                    notification.setPriority(NotificationPriority.URGENT);
                    notification.setTask(task);
                    notification.setUser(user);
                    notification.setNotifyAt(now);
                    notification.setExpireAt(task.getDueDate());
                    
                    notificationRepository.save(notification);
                }
            }
        } catch (Exception e) {
            // Log lỗi nhưng không ném ngoại lệ để tránh dừng các tác vụ theo lịch khác
            log.error("Lỗi khi thực hiện checkHourlyDeadlineNotifications: ", e);
        }
    }
    
    @Override
    @Transactional
    public int deleteExpiredNotifications() {
        User currentUser = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        List<Notification> expiredNotifications = notificationRepository.findByUserAndExpireAtBeforeAndRead(currentUser, now, true);
        
        if (!expiredNotifications.isEmpty()) {
            notificationRepository.deleteAll(expiredNotifications);
        }
        
        return expiredNotifications.size();
    }
    
    @Override
    @Transactional
    public int markAllAsRead() {
        User currentUser = getCurrentUser();
        List<Notification> unreadNotifications = notificationRepository.findByUserAndReadOrderByCreatedAtDesc(currentUser, false);
        
        if (!unreadNotifications.isEmpty()) {
            unreadNotifications.forEach(notification -> notification.setRead(true));
            notificationRepository.saveAll(unreadNotifications);
        }
        
        return unreadNotifications.size();
    }
    
    private void createOverdueNotification(Task task) {
        createOverdueNotification(task, getCurrentUser());
    }
    
    private void createOverdueNotification(Task task, User user) {
        if (user == null) {
            log.warn("Không thể tạo thông báo quá hạn cho task {} - người dùng null", task.getId());
            return;
        }
        
        String message = "Công việc \"" + task.getTitle() + "\" đã quá hạn! (Hạn chót: " + 
                task.getDueDate().toLocalDate() + ")";
        
        // Kiểm tra xem đã có thông báo quá hạn nào cho task này chưa
        if (!hasExistingNotificationOfType(task, NotificationType.DEADLINE_OVERDUE, user)) {
            Notification notification = new Notification();
            notification.setMessage(message);
            notification.setType(NotificationType.DEADLINE_OVERDUE);
            notification.setPriority(NotificationPriority.URGENT);
            notification.setTask(task);
            notification.setUser(user);
            notification.setNotifyAt(LocalDateTime.now());
            notification.setExpireAt(LocalDateTime.now().plusDays(1)); // Hết hạn sau 1 ngày
            
            notificationRepository.save(notification);
        }
    }
    
    private void createApproachingDeadlineNotification(Task task, String timeframe, NotificationPriority priority) {
        createApproachingDeadlineNotification(task, timeframe, priority, getCurrentUser());
    }
    
    private void createApproachingDeadlineNotification(Task task, String timeframe, NotificationPriority priority, User user) {
        if (user == null) {
            log.warn("Không thể tạo thông báo sắp đến hạn cho task {} - người dùng null", task.getId());
            return;
        }
        
        String message = "Công việc \"" + task.getTitle() + "\" sẽ đến hạn " + timeframe + 
                " (" + task.getDueDate().toLocalDate() + ")";
        
        // Kiểm tra xem đã có thông báo tương tự nào cho task này chưa
        if (!hasExistingNotificationOfType(task, NotificationType.DEADLINE_APPROACHING, user)) {
            Notification notification = new Notification();
            notification.setMessage(message);
            notification.setType(NotificationType.DEADLINE_APPROACHING);
            notification.setPriority(priority);
            notification.setTask(task);
            notification.setUser(user);
            notification.setNotifyAt(LocalDateTime.now());
            notification.setExpireAt(task.getDueDate());
            
            notificationRepository.save(notification);
        }
    }
    
    private boolean hasExistingNotificationOfType(Task task, NotificationType type) {
        return hasExistingNotificationOfType(task, type, getCurrentUser());
    }
    
    private boolean hasExistingNotificationOfType(Task task, NotificationType type, User user) {
        if (user == null) {
            return false;
        }
        
        // Chỉ kiểm tra thông báo được tạo trong vòng 24h trở lại
        LocalDateTime oneDayAgo = LocalDateTime.now().minusDays(1);
        List<Notification> notifications = notificationRepository.findByUserAndTaskIdAndTypeAndCreatedAtAfter(
                user, task.getId(), type, oneDayAgo);
        return !notifications.isEmpty();
    }
    
    private void setNotificationTiming(Notification notification, Task task) {
        User currentUser = getCurrentUser();
        LocalDateTime now = LocalDateTime.now();
        
        // Mặc định thông báo ngay lập tức và hết hạn sau 7 ngày
        notification.setNotifyAt(now);
        notification.setExpireAt(now.plusDays(7));
        
        // Nếu là thông báo liên quan đến deadline
        if (task.getDueDate() != null) {
            switch (notification.getType()) {
                case DEADLINE_APPROACHING:
                    // Thông báo ngay và hết hạn khi đến deadline
                    notification.setExpireAt(task.getDueDate());
                    break;
                case DEADLINE_OVERDUE:
                    // Thông báo ngay và hết hạn sau 1 ngày
                    notification.setExpireAt(now.plusDays(1));
                    break;
                default:
                    // Giữ nguyên mặc định
                    break;
            }
        }
        
        // Thiết lập ưu tiên dựa trên loại thông báo và thời gian deadline (nếu có)
        if (task.getDueDate() != null && notification.getType() == NotificationType.DEADLINE_APPROACHING) {
            long hoursToDeadline = ChronoUnit.HOURS.between(now, task.getDueDate());
            
            if (hoursToDeadline <= 24) {
                notification.setPriority(NotificationPriority.URGENT);
            } else if (hoursToDeadline <= 48) {
                notification.setPriority(NotificationPriority.HIGH);
            } else if (hoursToDeadline <= 72) {
                notification.setPriority(NotificationPriority.NORMAL);
            } else {
                notification.setPriority(NotificationPriority.LOW);
            }
        }
    }
    
    private NotificationDTO convertToDTO(Notification notification) {
        NotificationDTO dto = new NotificationDTO();
        dto.setId(notification.getId());
        dto.setMessage(notification.getMessage());
        dto.setType(notification.getType().name());
        dto.setPriority(notification.getPriority().name());
        dto.setRead(notification.isRead());
        dto.setCreatedAt(notification.getCreatedAt());
        dto.setNotifyAt(notification.getNotifyAt());
        dto.setExpireAt(notification.getExpireAt());
        
        if (notification.getTask() != null) {
            dto.setTaskId(notification.getTask().getId());
            dto.setTaskTitle(notification.getTask().getTitle());
        }
        
        return dto;
    }
}