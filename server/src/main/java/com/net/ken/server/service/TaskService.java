package com.net.ken.server.service;

import com.net.ken.server.dto.TaskDTO;
import com.net.ken.server.dto.TaskDTO.CreateTaskDTO;
import com.net.ken.server.dto.TaskDTO.UpdateTaskDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface TaskService {
    List<TaskDTO> getAllTasks();
    
    Page<TaskDTO> getAllTasksPaged(Pageable pageable);
    
    TaskDTO getTaskById(Long id);
    
    List<TaskDTO> getTasksByProjectId(Long projectId);
    
    Page<TaskDTO> getTasksByProjectIdPaged(Long projectId, Pageable pageable);
    
    List<TaskDTO> getTasksByStatus(String status);
    
    List<TaskDTO> getTasksByPriority(String priority);
    
    List<TaskDTO> getTasksDueWithinDays(int days);
    
    TaskDTO createTask(CreateTaskDTO createTaskDTO);
    
    TaskDTO updateTask(Long id, UpdateTaskDTO updateTaskDTO);
    
    TaskDTO updateTaskStatus(Long id, String status);
    
    TaskDTO updateTaskProgress(Long id, Integer progress);
    
    void deleteTask(Long id);
    
    TaskDTO addTagToTask(Long taskId, Long tagId);
    
    TaskDTO removeTagFromTask(Long taskId, Long tagId);
} 