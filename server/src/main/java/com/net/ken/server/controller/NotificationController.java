package com.net.ken.server.controller;

import com.net.ken.server.dto.NotificationDTO;
import com.net.ken.server.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = "*")
public class NotificationController {

    private final NotificationService notificationService;

    @Autowired
    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getAllNotifications() {
        return ResponseEntity.ok(notificationService.getAllNotifications());
    }

    @GetMapping("/{id}")
    public ResponseEntity<NotificationDTO> getNotificationById(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.getNotificationById(id));
    }

    @GetMapping("/unread")
    public ResponseEntity<List<NotificationDTO>> getUnreadNotifications() {
        return ResponseEntity.ok(notificationService.getUnreadNotifications());
    }

    @GetMapping("/task/{taskId}")
    public ResponseEntity<List<NotificationDTO>> getNotificationsByTaskId(@PathVariable Long taskId) {
        return ResponseEntity.ok(notificationService.getNotificationsByTaskId(taskId));
    }

    @GetMapping("/recent/{days}")
    public ResponseEntity<List<NotificationDTO>> getRecentNotifications(@PathVariable int days) {
        return ResponseEntity.ok(notificationService.getRecentNotifications(days));
    }

    @PostMapping
    public ResponseEntity<NotificationDTO> createNotification(@RequestBody Map<String, Object> notificationMap) {
        String message = (String) notificationMap.get("message");
        String type = (String) notificationMap.get("type");
        Long taskId = Long.valueOf(notificationMap.get("taskId").toString());
        
        if (message == null || type == null || taskId == null) {
            return ResponseEntity.badRequest().build();
        }
        
        return new ResponseEntity<>(notificationService.createNotification(message, type, taskId), HttpStatus.CREATED);
    }

    @PatchMapping("/{id}/read")
    public ResponseEntity<NotificationDTO> markNotificationAsRead(@PathVariable Long id) {
        return ResponseEntity.ok(notificationService.markNotificationAsRead(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNotification(@PathVariable Long id) {
        notificationService.deleteNotification(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/check-deadlines")
    public ResponseEntity<Void> checkAndCreateDeadlineNotifications() {
        notificationService.checkAndCreateDeadlineNotifications();
        return ResponseEntity.ok().build();
    }
} 