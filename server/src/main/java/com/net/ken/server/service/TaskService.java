package com.net.ken.server.service;

import com.net.ken.server.dto.TaskDTO;
import com.net.ken.server.dto.TaskDTO.CreateTaskDTO;
import com.net.ken.server.dto.TaskDTO.UpdateTaskDTO;

import java.util.List;

public interface TaskService {
    List<TaskDTO> getAllTasks();
    
    TaskDTO getTaskById(Long id);
    
    List<TaskDTO> getTasksByProjectId(Long projectId);
    
    List<TaskDTO> getTasksByStatus(String status);
    
    List<TaskDTO> getTasksByPriority(String priority);
    
    List<TaskDTO> getTasksDueWithinDays(int days);
    
    TaskDTO createTask(CreateTaskDTO createTaskDTO);
    
    TaskDTO updateTask(Long id, UpdateTaskDTO updateTaskDTO);
    
    TaskDTO updateTaskStatus(Long id, String status);
    
    TaskDTO updateTaskProgress(Long id, Integer progress);
    
    void deleteTask(Long id);
} 