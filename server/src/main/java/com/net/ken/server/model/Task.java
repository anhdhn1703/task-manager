package com.net.ken.server.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "tasks")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    private String description;

    @Column(name = "start_date")
    private LocalDateTime startDate;

    @Column(name = "due_date")
    private LocalDateTime dueDate;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Enumerated(EnumType.STRING)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    private Status status;

    private Integer progress;

    @Enumerated(EnumType.STRING)
    private DueStatus dueStatus = DueStatus.NORMAL;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
        name = "task_tags",
        joinColumns = @JoinColumn(name = "task_id"),
        inverseJoinColumns = @JoinColumn(name = "tag_id")
    )
    private Set<Tag> tags = new HashSet<>();

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        
        if (startDate == null) {
            startDate = LocalDateTime.now();
        }
        
        if (status == null) {
            status = Status.NOT_STARTED;
        }
        
        if (progress == null) {
            progress = 0;
        }
        
        updateDueStatus();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
        updateDueStatus();
    }
    
    private void updateDueStatus() {
        if (dueDate == null || Status.COMPLETED.equals(status)) {
            dueStatus = DueStatus.NORMAL;
            return;
        }
        
        LocalDateTime today = LocalDateTime.now();
        LocalDateTime todayStart = today.toLocalDate().atStartOfDay();
        LocalDateTime todayEnd = today.toLocalDate().plusDays(1).atStartOfDay().minusNanos(1);
        
        if (dueDate.isBefore(todayStart)) {
            dueStatus = DueStatus.OVERDUE;
        } else if (dueDate.isAfter(todayStart) && dueDate.isBefore(todayEnd)) {
            dueStatus = DueStatus.DUE_SOON;
        } else {
            dueStatus = DueStatus.NORMAL;
        }
    }

    public enum Priority {
        LOW, MEDIUM, HIGH, URGENT
    }

    public enum Status {
        NOT_STARTED, IN_PROGRESS, COMPLETED, ON_HOLD
    }
    
    public enum DueStatus {
        NORMAL, DUE_SOON, OVERDUE
    }
} 