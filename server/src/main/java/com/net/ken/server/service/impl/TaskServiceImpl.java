package com.net.ken.server.service.impl;

import com.net.ken.server.config.CacheConfig;
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
import com.net.ken.server.model.User;
import com.net.ken.server.repository.NotificationRepository;
import com.net.ken.server.repository.ProjectRepository;
import com.net.ken.server.repository.TagRepository;
import com.net.ken.server.repository.TaskRepository;
import com.net.ken.server.repository.UserRepository;
import com.net.ken.server.service.AuthService;
import com.net.ken.server.service.TaskService;
import com.net.ken.server.util.LogUtil;
import com.net.ken.server.util.PerformanceUtil;
import com.net.ken.server.util.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import org.slf4j.Logger;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;

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
    private final UserRepository userRepository;
    private final AuthService authService;
    private static final Logger log = LogUtil.getLogger(TaskServiceImpl.class);

    @Autowired
    public TaskServiceImpl(TaskRepository taskRepository, 
                         ProjectRepository projectRepository, 
                         TagRepository tagRepository,
                         NotificationRepository notificationRepository,
                         UserRepository userRepository,
                         AuthService authService) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.tagRepository = tagRepository;
        this.notificationRepository = notificationRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        LogUtil.info(log, "TaskServiceImpl đã được khởi tạo");
    }

    // Lấy người dùng hiện tại từ AuthService
    public User getCurrentUser() {
        return authService.getCurrentUser();
    }

    @Override
    @Cacheable(value = CacheConfig.TASK_CACHE, key = "'user-' + #root.target.getCurrentUser().getId()")
    public List<TaskDTO> getAllTasks() {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang lấy tất cả các task cho người dùng {}", currentUser.getUsername());
        
        return PerformanceUtil.measureExecutionTime(log, "getAllTasks", () -> {
            List<TaskDTO> tasks = taskRepository.findByUser(currentUser).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            LogUtil.debug(log, "Đã tìm thấy {} tasks", tasks.size());
            return tasks;
        });
    }

    @Override
    @Cacheable(value = CacheConfig.TASK_CACHE, key = "'task-' + #id + '-user-' + #root.target.getCurrentUser().getId()")
    public TaskDTO getTaskById(Long id) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang tìm task với ID: {}", id);
        
        return PerformanceUtil.measureExecutionTime(log, "getTaskById", () -> {
            Task task = taskRepository.findById(id)
                    .orElseThrow(() -> {
                        LogUtil.warn(log, "Không tìm thấy task với ID: {}", id);
                        return new EntityNotFoundException("Không tìm thấy công việc với ID: " + id);
                    });
            
            // Kiểm tra quyền truy cập
            if (task.getUser() != null && !task.getUser().getId().equals(currentUser.getId())) {
                LogUtil.warn(log, "Người dùng {} không có quyền truy cập task với ID: {}", 
                        currentUser.getUsername(), id);
                throw new AccessDeniedException("Không có quyền truy cập công việc này");
            }
            
            LogUtil.debug(log, "Đã tìm thấy task: {}", task.getTitle());
            return convertToDTO(task);
        });
    }

    @Override
    @Cacheable(value = CacheConfig.TASK_CACHE, key = "'projectTasks-' + #projectId + '-user-' + #root.target.getCurrentUser().getId()")
    public List<TaskDTO> getTasksByProjectId(Long projectId) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang lấy các task theo projectId: {}", projectId);
        
        return PerformanceUtil.measureExecutionTime(log, "getTasksByProjectId", () -> {
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> {
                        LogUtil.warn(log, "Không tìm thấy project với ID: {}", projectId);
                        return new EntityNotFoundException("Không tìm thấy dự án với ID: " + projectId);
                    });
            
            // Kiểm tra quyền truy cập
            if (project.getUser() != null && !project.getUser().getId().equals(currentUser.getId())) {
                LogUtil.warn(log, "Người dùng {} không có quyền truy cập project với ID: {}", 
                        currentUser.getUsername(), projectId);
                throw new AccessDeniedException("Không có quyền truy cập dự án này");
            }
            
            List<TaskDTO> tasks = taskRepository.findByProjectIdAndUser(projectId, currentUser).stream()
                    .map(this::convertToDTO)
                    .collect(Collectors.toList());
            
            LogUtil.debug(log, "Đã tìm thấy {} tasks cho projectId: {}", tasks.size(), projectId);
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
    @CacheEvict(value = {CacheConfig.TASK_CACHE}, allEntries = true)
    public TaskDTO createTask(CreateTaskDTO createTaskDTO) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang tạo task mới: {}", createTaskDTO.getTitle());
        
        return PerformanceUtil.measureExecutionTime(log, "createTask", () -> {
            Project project = null;
            if (createTaskDTO.getProjectId() != null) {
                project = projectRepository.findById(createTaskDTO.getProjectId())
                        .orElseThrow(() -> {
                            LogUtil.warn(log, "Không tìm thấy project với ID: {}", createTaskDTO.getProjectId());
                            return new EntityNotFoundException("Không tìm thấy dự án với ID: " + createTaskDTO.getProjectId());
                        });
                
                // Kiểm tra quyền truy cập vào project
                if (project.getUser() != null && !project.getUser().getId().equals(currentUser.getId())) {
                    LogUtil.warn(log, "Người dùng {} không có quyền tạo task trong project với ID: {}", 
                            currentUser.getUsername(), createTaskDTO.getProjectId());
                    throw new AccessDeniedException("Không có quyền thêm task vào dự án này");
                }
            }
            
            Task task = new Task();
            task.setTitle(createTaskDTO.getTitle());
            task.setDescription(createTaskDTO.getDescription());
            
            // Thiết lập ngày tháng
            if (createTaskDTO.getStartDate() != null) {
                task.setStartDate(createTaskDTO.getStartDate());
            } else {
                task.setStartDate(LocalDateTime.now());
            }
            
            if (createTaskDTO.getDueDate() != null) {
                task.setDueDate(createTaskDTO.getDueDate());
            }
            
            // Thiết lập ưu tiên
            if (createTaskDTO.getPriority() != null) {
                try {
                    task.setPriority(Priority.valueOf(createTaskDTO.getPriority().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    LogUtil.warn(log, "Giá trị priority không hợp lệ: {}", createTaskDTO.getPriority());
                    throw new TaskManagerException("Mức độ ưu tiên không hợp lệ: " + createTaskDTO.getPriority());
                }
            } else {
                task.setPriority(Priority.MEDIUM);
            }
            
            // Thiết lập trạng thái
            if (createTaskDTO.getStatus() != null && !createTaskDTO.getStatus().isEmpty()) {
                try {
                    task.setStatus(Status.valueOf(createTaskDTO.getStatus().toUpperCase()));
                } catch (IllegalArgumentException e) {
                    LogUtil.warn(log, "Giá trị status không hợp lệ: {}", createTaskDTO.getStatus());
                    throw new TaskManagerException("Trạng thái không hợp lệ: " + createTaskDTO.getStatus());
                }
            } else {
                task.setStatus(Status.NOT_STARTED);
            }
            
            // Thiết lập tiến độ
            if (createTaskDTO.getProgress() != null) {
                if (createTaskDTO.getProgress() < 0 || createTaskDTO.getProgress() > 100) {
                    LogUtil.warn(log, "Giá trị progress không hợp lệ: {}", createTaskDTO.getProgress());
                    throw new TaskManagerException("Tiến độ phải từ 0-100%");
                }
                task.setProgress(createTaskDTO.getProgress());
            } else {
                task.setProgress(0);
            }
            
            // Gắn project (nếu có)
            task.setProject(project);
            
            // Gắn user
            task.setUser(currentUser);
            
            // Xử lý tags (nếu có)
            if (createTaskDTO.getTagIds() != null && !createTaskDTO.getTagIds().isEmpty()) {
                Set<Tag> tags = new HashSet<>();
                for (Long tagId : createTaskDTO.getTagIds()) {
                    Tag tag = tagRepository.findById(tagId)
                            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + tagId));
                    
                    // Kiểm tra quyền truy cập vào tag
                    if (tag.getUser() != null && !tag.getUser().getId().equals(currentUser.getId())) {
                        LogUtil.warn(log, "Người dùng {} không có quyền sử dụng tag với ID: {}", 
                                currentUser.getUsername(), tagId);
                        throw new AccessDeniedException("Không có quyền sử dụng thẻ này");
                    }
                    
                    tags.add(tag);
                }
                task.setTags(tags);
            }
            
            // Lưu task
            Task savedTask = taskRepository.save(task);
            LogUtil.info(log, "Đã tạo task mới với ID: {}", savedTask.getId());
            
            // Tạo thông báo task mới nếu có deadline
            if (savedTask.getDueDate() != null) {
                createDueStatusNotification(savedTask);
            }
            
            return convertToDTO(savedTask);
        });
    }

    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.TASK_CACHE}, key = "'task-' + #id + '-user-' + #root.target.getCurrentUser().getId()")
    public TaskDTO updateTask(Long id, UpdateTaskDTO updateTaskDTO) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang cập nhật task với ID: {}", id);
        
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
    @CacheEvict(value = {CacheConfig.TASK_CACHE}, allEntries = true)
    public void deleteTask(Long id) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang xóa task với ID: {}", id);
        
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

    @Override
    @Cacheable(value = CacheConfig.TASK_CACHE, key = "'user-' + #root.target.getCurrentUser().getId() + '-paged-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<TaskDTO> getAllTasksPaged(Pageable pageable) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang lấy trang {} của tasks với kích thước trang {} cho người dùng {}", 
                pageable.getPageNumber(), pageable.getPageSize(), currentUser.getUsername());
        
        return PerformanceUtil.measureExecutionTime(log, "getAllTasksPaged", () -> {
            Page<Task> taskPage = taskRepository.findByUser(currentUser, pageable);
            return taskPage.map(this::convertToDTO);
        });
    }
    
    @Override
    @Cacheable(value = CacheConfig.TASK_CACHE, 
            key = "'projectTasks-' + #projectId + '-user-' + #root.target.getCurrentUser().getId() + '-paged-' + #pageable.pageNumber + '-' + #pageable.pageSize")
    public Page<TaskDTO> getTasksByProjectIdPaged(Long projectId, Pageable pageable) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang lấy trang {} của tasks theo projectId {} với kích thước trang {}", 
                pageable.getPageNumber(), projectId, pageable.getPageSize());
        
        return PerformanceUtil.measureExecutionTime(log, "getTasksByProjectIdPaged", () -> {
            // Kiểm tra quyền truy cập dự án
            Project project = projectRepository.findById(projectId)
                    .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dự án với ID: " + projectId));
            
            if (project.getUser() != null && !project.getUser().getId().equals(currentUser.getId())) {
                throw new AccessDeniedException("Không có quyền truy cập dự án này");
            }
            
            Page<Task> taskPage = taskRepository.findByProjectIdAndUser(projectId, currentUser, pageable);
            return taskPage.map(this::convertToDTO);
        });
    }

    // Thêm tag vào task
    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.TASK_CACHE}, key = "'task-' + #taskId + '-user-' + #root.target.getCurrentUser().getId()")
    public TaskDTO addTagToTask(Long taskId, Long tagId) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang thêm tag {} vào task {}", tagId, taskId);
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc với ID: " + taskId));
        
        // Kiểm tra quyền truy cập
        if (task.getUser() != null && !task.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền truy cập công việc này");
        }
        
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + tagId));
        
        // Kiểm tra quyền truy cập tag
        if (tag.getUser() != null && !tag.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền sử dụng thẻ này");
        }
        
        task.getTags().add(tag);
        Task updatedTask = taskRepository.save(task);
        
        return convertToDTO(updatedTask);
    }
    
    // Xóa tag khỏi task
    @Override
    @Transactional
    @CacheEvict(value = {CacheConfig.TASK_CACHE}, key = "'task-' + #taskId + '-user-' + #root.target.getCurrentUser().getId()")
    public TaskDTO removeTagFromTask(Long taskId, Long tagId) {
        User currentUser = getCurrentUser();
        LogUtil.debug(log, "Đang xóa tag {} khỏi task {}", tagId, taskId);
        
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy công việc với ID: " + taskId));
        
        // Kiểm tra quyền truy cập
        if (task.getUser() != null && !task.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền truy cập công việc này");
        }
        
        Tag tag = tagRepository.findById(tagId)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy thẻ với ID: " + tagId));
        
        task.getTags().remove(tag);
        Task updatedTask = taskRepository.save(task);
        
        return convertToDTO(updatedTask);
    }
}