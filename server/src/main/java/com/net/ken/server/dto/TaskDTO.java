package com.net.ken.server.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long id;
    private String title;
    private String description;
    private LocalDateTime startDate;
    private LocalDateTime dueDate;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String priority;
    private String status;
    private Integer progress;
    private String dueStatus;
    private Long projectId;
    private String projectName;
    private Set<TagDTO> tags = new HashSet<>();
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateTaskDTO {
        private String title;
        private String description;
        private LocalDateTime startDate;
        private LocalDateTime dueDate;
        private String priority;
        private String status;
        private Integer progress;
        private Long projectId;
        private Set<Long> tagIds = new HashSet<>();
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateTaskDTO {
        private String title;
        private String description;
        private LocalDateTime startDate;
        private LocalDateTime dueDate;
        private String priority;
        private String status;
        private Integer progress;
        private Long projectId;
        private Set<Long> tagIds = new HashSet<>();
    }
} 