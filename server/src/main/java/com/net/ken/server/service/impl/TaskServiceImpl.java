package com.net.ken.server.service.impl;

import com.net.ken.server.dto.TagDTO;
import com.net.ken.server.dto.TaskDTO;
import com.net.ken.server.dto.TaskDTO.CreateTaskDTO;
import com.net.ken.server.dto.TaskDTO.UpdateTaskDTO;
import com.net.ken.server.exception.TaskManagerException;
import com.net.ken.server.model.Notification;
import com.net.ken.server.model.Project;
import com.net.ken.server.model.Tag;
import com.net.ken.server.model.Task;
import com.net.ken.server.model.Task.Priority;
import com.net.ken.server.model.Task.Status;
import com.net.ken.server.repository.NotificationRepository;
import com.net.ken.server.repository.ProjectRepository;
import com.net.ken.server.repository.TagRepository;
import com.net.ken.server.repository.TaskRepository;
import com.net.ken.server.service.TaskService;
import com.net.ken.server.util.LogUtil;
import com.net.ken.server.util.PerformanceUtil;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class TaskServiceImpl implements TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final TagRepository tagRepository;
    private final NotificationRepository notificationRepository;
    private static final Logger log = LogUtil.getLogger(TaskServiceImpl.class);

    @Autowired
    public TaskServiceImpl(TaskRepository taskRepository, 
                         ProjectRepository projectRepository, 
                         TagRepository tagRepository,
                         NotificationRepository notificationRepository) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
        this.notificationRepository = notificationRepository;
        LogUtil.info(log, "TaskServiceImpl đã được khởi tạo");
    }

    @Override
    public List<TaskDTO> getAllTasks() {
        LogUtil.debug(log, "Đang lấy tất cả các task");
        return PerformanceUtil.measureExecutionTime(log, "getAllTasks", () -> {
            List<TaskDTO> tasks = taskRepository.findAll().stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            LogUtil.debug(log, "Đã tìm thấy {} tasks", tasks.size());
            return tasks;
        });
    }

    @Override
    public TaskDTO getTaskById(Long id) {
        LogUtil.debug(log, "Đang tìm task với ID: {}", id);
        return PerformanceUtil.measureExecutionTime(log, "getTaskById", () -> {
            try {
                Task task = taskRepository.findById(id)
                        .orElseThrow(() -> new TaskManagerException.ResourceNotFoundException("Task", "id", id));
                LogUtil.debug(log, "Đã tìm thấy task: {}", task.getTitle());
                return convertToDTO(task);
            } catch (TaskManagerException.ResourceNotFoundException e) {
                LogUtil.error(log, "Không tìm thấy task với ID: {}", e, id);
                throw e;
            }
        });
    }

    @Override
    public List<TaskDTO> getTasksByProjectId(Long projectId) {
        LogUtil.debug(log, "Đang tìm tasks cho dự án với ID: {}", projectId);
        return PerformanceUtil.measureExecutionTime(log, "getTasksByProjectId", () -> {
            if (!projectRepository.existsById(projectId)) {
                throw new TaskManagerException.ResourceNotFoundException("Project", "id", projectId);
            }
            List<TaskDTO> tasks = taskRepository.findByProjectId(projectId).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            LogUtil.debug(log, "Đã tìm thấy {} tasks cho dự án ID: {}", tasks.size(), projectId);
            return tasks;
        });
    }

    @Override
    public List<TaskDTO> getTasksByStatus(String status) {
        try {
            Status taskStatus = Status.valueOf(status.toUpperCase());
            return taskRepository.findByProjectIdAndStatus(null, taskStatus).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }
    }

    @Override
    public List<TaskDTO> getTasksByPriority(String priority) {
        try {
            Priority taskPriority = Priority.valueOf(priority.toUpperCase());
            return taskRepository.findByPriority(taskPriority).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Mức ưu tiên không hợp lệ: " + priority);
        }
    }

    @Override
    public List<TaskDTO> getTasksDueWithinDays(int days) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime endDate = now.plusDays(days);
        return taskRepository.findTasksWithDueDateBetween(now, endDate).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public TaskDTO createTask(CreateTaskDTO createTaskDTO) {
        Project project = projectRepository.findById(createTaskDTO.getProjectId())
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dự án với ID: " + createTaskDTO.getProjectId()));
        
        Task task = new Task();
        task.setTitle(createTaskDTO.getTitle());
        task.setDescription(createTaskDTO.getDescription());
        
        // Xử lý startDate
        if (createTaskDTO.getStartDate() != null) {
            task.setStartDate(createTaskDTO.getStartDate());
        } else {
            task.setStartDate(LocalDateTime.now());
        }
        
        // Xử lý dueDate
        task.setDueDate(createTaskDTO.getDueDate());
        
        try {
            task.setPriority(Priority.valueOf(createTaskDTO.getPriority().toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Mức ưu tiên không hợp lệ: " + createTaskDTO.getPriority());
        }
        
        // Xử lý trạng thái nếu được cung cấp
        if (createTaskDTO.getStatus() != null && !createTaskDTO.getStatus().isEmpty()) {
            try {
                task.setStatus(Status.valueOf(createTaskDTO.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái không hợp lệ: " + createTaskDTO.getStatus());
            }
        } else {
            // Mặc định là NOT_STARTED nếu không được cung cấp
            task.setStatus(Status.NOT_STARTED);
        }
        
        // Xử lý tiến độ nếu được cung cấp
        if (createTaskDTO.getProgress() != null) {
            if (createTaskDTO.getProgress() < 0 || createTaskDTO.getProgress() > 100) {
                throw new IllegalArgumentException("Tiến độ phải nằm trong khoảng từ 0 đến 100");
            }
            task.setProgress(createTaskDTO.getProgress());
        } else {
            // Mặc định là 0 nếu không được cung cấp
            task.setProgress(0);
        }
        
        task.setProject(project);
        
        // Thêm tags
        if (createTaskDTO.getTagIds() != null && !createTaskDTO.getTagIds().isEmpty()) {
            Set<Tag> tags = new HashSet<>();
            for (Long tagId : createTaskDTO.getTagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + tagId));
                tags.add(tag);
            }
            task.setTags(tags);
        }
        
        Task savedTask = taskRepository.save(task);
        
        // Tạo thông báo dựa trên dueStatus
        createDueStatusNotification(savedTask);
        
        return convertToDTO(savedTask);
    }

    @Override
    @Transactional
    public TaskDTO updateTask(Long id, UpdateTaskDTO updateTaskDTO) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc với ID: " + id));
        
        if (updateTaskDTO.getTitle() != null) {
            task.setTitle(updateTaskDTO.getTitle());
        }
        
        if (updateTaskDTO.getDescription() != null) {
            task.setDescription(updateTaskDTO.getDescription());
        }
        
        // Xử lý startDate
        if (updateTaskDTO.getStartDate() != null) {
            task.setStartDate(updateTaskDTO.getStartDate());
        }
        
        // Xử lý dueDate
        if (updateTaskDTO.getDueDate() != null) {
            task.setDueDate(updateTaskDTO.getDueDate());
        }
        
        if (updateTaskDTO.getPriority() != null) {
            try {
                task.setPriority(Priority.valueOf(updateTaskDTO.getPriority().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Mức ưu tiên không hợp lệ: " + updateTaskDTO.getPriority());
            }
        }
        
        if (updateTaskDTO.getStatus() != null) {
            try {
                task.setStatus(Status.valueOf(updateTaskDTO.getStatus().toUpperCase()));
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Trạng thái không hợp lệ: " + updateTaskDTO.getStatus());
            }
        }
        
        if (updateTaskDTO.getProgress() != null) {
            if (updateTaskDTO.getProgress() < 0 || updateTaskDTO.getProgress() > 100) {
                throw new IllegalArgumentException("Tiến độ phải nằm trong khoảng từ 0 đến 100");
            }
            task.setProgress(updateTaskDTO.getProgress());
        }
        
        if (updateTaskDTO.getProjectId() != null) {
            Project project = projectRepository.findById(updateTaskDTO.getProjectId())
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dự án với ID: " + updateTaskDTO.getProjectId()));
            task.setProject(project);
        }
        
        // Cập nhật tags
        if (updateTaskDTO.getTagIds() != null) {
            Set<Tag> tags = new HashSet<>();
            for (Long tagId : updateTaskDTO.getTagIds()) {
                Tag tag = tagRepository.findById(tagId)
                        .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + tagId));
                tags.add(tag);
            }
            task.setTags(tags);
        }
        
        Task updatedTask = taskRepository.save(task);
        
        // Tạo thông báo dựa trên dueStatus
        createDueStatusNotification(updatedTask);
        
        return convertToDTO(updatedTask);
    }

    @Override
    @Transactional
    public TaskDTO updateTaskStatus(Long id, String status) {
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc với ID: " + id));
        
        try {
            task.setStatus(Status.valueOf(status.toUpperCase()));
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Trạng thái không hợp lệ: " + status);
        }
        
        // Tự động cập nhật tiến độ
        if (Status.COMPLETED.name().equals(status.toUpperCase())) {
            task.setProgress(100);
        } else if (Status.NOT_STARTED.name().equals(status.toUpperCase())) {
            task.setProgress(0);
        }
        
        Task updatedTask = taskRepository.save(task);
        return convertToDTO(updatedTask);
    }

    @Override
    @Transactional
    public TaskDTO updateTaskProgress(Long id, Integer progress) {
        if (progress < 0 || progress > 100) {
            throw new IllegalArgumentException("Tiến độ phải nằm trong khoảng từ 0 đến 100");
        }
        
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc với ID: " + id));
        
        task.setProgress(progress);
        
        // Tự động cập nhật trạng thái
        if (progress == 100) {
            task.setStatus(Status.COMPLETED);
        } else if (progress == 0) {
            task.setStatus(Status.NOT_STARTED);
        } else if (progress > 0) {
            task.setStatus(Status.IN_PROGRESS);
        }
        
        Task updatedTask = taskRepository.save(task);
        return convertToDTO(updatedTask);
    }

    @Override
    @Transactional
    public void deleteTask(Long id) {
        if (!taskRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy công việc với ID: " + id);
        }
        taskRepository.deleteById(id);
    }
    
    private TaskDTO convertToDTO(Task task) {
        TaskDTO dto = new TaskDTO();
        dto.setId(task.getId());
        dto.setTitle(task.getTitle());
        dto.setDescription(task.getDescription());
        dto.setStartDate(task.getStartDate());
        dto.setDueDate(task.getDueDate());
        dto.setCreatedAt(task.getCreatedAt());
        dto.setUpdatedAt(task.getUpdatedAt());
        
        if (task.getPriority() != null) {
            dto.setPriority(task.getPriority().name());
        }
        
        if (task.getStatus() != null) {
            dto.setStatus(task.getStatus().name());
        }
        
        if (task.getDueStatus() != null) {
            dto.setDueStatus(task.getDueStatus().name());
        }
        
        dto.setProgress(task.getProgress());
        
        if (task.getProject() != null) {
            dto.setProjectId(task.getProject().getId());
            dto.setProjectName(task.getProject().getName());
        }
        
        // Chuyển đổi tags
        Set<TagDTO> tagDTOs = task.getTags().stream()
                .map(tag -> new TagDTO(tag.getId(), tag.getName(), tag.getColor()))
                .collect(Collectors.toSet());
        dto.setTags(tagDTOs);
        
        return dto;
    }

    /**
     * Tạo thông báo dựa trên trạng thái hạn mức của công việc
     */
    private void createDueStatusNotification(Task task) {
        if (task.getDueStatus() == null || task.getDueStatus() == Task.DueStatus.NORMAL) {
            return;
        }
        
        Notification notification = new Notification();
        notification.setTask(task);
        
        if (task.getDueStatus() == Task.DueStatus.DUE_SOON) {
            notification.setMessage("Công việc '" + task.getTitle() + "' sắp đến hạn vào ngày " 
                + task.getDueDate().toLocalDate().toString());
            notification.setType(Notification.NotificationType.DEADLINE_APPROACHING);
        } else if (task.getDueStatus() == Task.DueStatus.OVERDUE) {
            notification.setMessage("Công việc '" + task.getTitle() + "' đã trễ hạn! Hạn chót là " 
                + task.getDueDate().toLocalDate().toString());
            notification.setType(Notification.NotificationType.DEADLINE_APPROACHING);
        }
        
        notificationRepository.save(notification);
        
        // Log thông báo
        LogUtil.info(log, "Task '{}' có trạng thái hạn mức: {}", task.getTitle(), task.getDueStatus());
    }
}