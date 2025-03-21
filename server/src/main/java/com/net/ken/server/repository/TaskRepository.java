package com.net.ken.server.repository;

import com.net.ken.server.model.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByProjectId(Long projectId);
    
    List<Task> findByDueDateBefore(LocalDateTime date);
    
    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :start AND :end")
    List<Task> findTasksWithDueDateBetween(LocalDateTime start, LocalDateTime end);
    
    List<Task> findByProjectIdAndStatus(Long projectId, Task.Status status);
    
    List<Task> findByPriority(Task.Priority priority);
} 