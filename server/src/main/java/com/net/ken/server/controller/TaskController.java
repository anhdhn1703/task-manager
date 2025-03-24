package com.net.ken.server.controller;

import com.net.ken.server.dto.TaskDTO;
import com.net.ken.server.dto.TaskDTO.CreateTaskDTO;
import com.net.ken.server.dto.TaskDTO.UpdateTaskDTO;
import com.net.ken.server.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    @Autowired
    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public ResponseEntity<List<TaskDTO>> getAllTasks() {
        return ResponseEntity.ok(taskService.getAllTasks());
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<TaskDTO>> getTasksPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dueDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? 
                Sort.Direction.DESC : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        return ResponseEntity.ok(taskService.getAllTasksPaged(pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskDTO> getTaskById(@PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(id));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<TaskDTO>> getTasksByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(taskService.getTasksByProjectId(projectId));
    }

    @GetMapping("/project/{projectId}/paged")
    public ResponseEntity<Page<TaskDTO>> getTasksByProjectIdPaged(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "dueDate") String sortBy,
            @RequestParam(defaultValue = "asc") String direction) {
        
        Sort.Direction sortDirection = "desc".equalsIgnoreCase(direction) ? 
                Sort.Direction.DESC : Sort.Direction.ASC;
        
        Pageable pageable = PageRequest.of(page, size, Sort.by(sortDirection, sortBy));
        return ResponseEntity.ok(taskService.getTasksByProjectIdPaged(projectId, pageable));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<TaskDTO>> getTasksByStatus(@PathVariable String status) {
        return ResponseEntity.ok(taskService.getTasksByStatus(status));
    }

    @GetMapping("/priority/{priority}")
    public ResponseEntity<List<TaskDTO>> getTasksByPriority(@PathVariable String priority) {
        return ResponseEntity.ok(taskService.getTasksByPriority(priority));
    }

    @GetMapping("/due-within/{days}")
    public ResponseEntity<List<TaskDTO>> getTasksDueWithinDays(@PathVariable int days) {
        return ResponseEntity.ok(taskService.getTasksDueWithinDays(days));
    }

    @PostMapping
    public ResponseEntity<TaskDTO> createTask(@Valid @RequestBody CreateTaskDTO createTaskDTO) {
        return new ResponseEntity<>(taskService.createTask(createTaskDTO), HttpStatus.CREATED);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskDTO> updateTask(@PathVariable Long id, @Valid @RequestBody UpdateTaskDTO updateTaskDTO) {
        return ResponseEntity.ok(taskService.updateTask(id, updateTaskDTO));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskDTO> updateTaskStatus(@PathVariable Long id, @RequestBody Map<String, String> statusMap) {
        String status = statusMap.get("status");
        if (status == null || status.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(taskService.updateTaskStatus(id, status));
    }

    @PatchMapping("/{id}/progress")
    public ResponseEntity<TaskDTO> updateTaskProgress(@PathVariable Long id, @RequestBody Map<String, Integer> progressMap) {
        Integer progress = progressMap.get("progress");
        if (progress == null || progress < 0 || progress > 100) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(taskService.updateTaskProgress(id, progress));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id) {
        taskService.deleteTask(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{taskId}/tags/{tagId}")
    public ResponseEntity<TaskDTO> addTagToTask(@PathVariable Long taskId, @PathVariable Long tagId) {
        return ResponseEntity.ok(taskService.addTagToTask(taskId, tagId));
    }

    @DeleteMapping("/{taskId}/tags/{tagId}")
    public ResponseEntity<TaskDTO> removeTagFromTask(@PathVariable Long taskId, @PathVariable Long tagId) {
        return ResponseEntity.ok(taskService.removeTagFromTask(taskId, tagId));
    }
} 