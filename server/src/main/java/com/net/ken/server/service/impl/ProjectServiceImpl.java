package com.net.ken.server.service.impl;

import com.net.ken.server.dto.ProjectDTO;
import com.net.ken.server.model.Project;
import com.net.ken.server.model.Task;
import com.net.ken.server.model.User;
import com.net.ken.server.repository.ProjectRepository;
import com.net.ken.server.repository.UserRepository;
import com.net.ken.server.service.ProjectService;
import com.net.ken.server.util.SecurityUtils;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    @Autowired
    public ProjectServiceImpl(ProjectRepository projectRepository, UserRepository userRepository) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }
    
    // Lấy người dùng hiện tại từ context bảo mật
    private User getCurrentUser() {
        String username = SecurityUtils.getCurrentUsername()
            .orElseThrow(() -> new AccessDeniedException("Không tìm thấy thông tin người dùng hiện tại"));
        return userRepository.findByUsername(username)
            .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy người dùng: " + username));
    }

    @Override
    public List<ProjectDTO> getAllProjects() {
        User currentUser = getCurrentUser();
        return projectRepository.findByUser(currentUser).stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProjectDTO getProjectById(Long id) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dự án với ID: " + id));
                
        // Kiểm tra quyền truy cập
        if (project.getUser() != null && !project.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền truy cập dự án này");
        }
        
        return convertToDTO(project);
    }

    @Override
    @Transactional
    public ProjectDTO createProject(ProjectDTO projectDTO) {
        User currentUser = getCurrentUser();
        
        Project project = new Project();
        project.setName(projectDTO.getName());
        project.setDescription(projectDTO.getDescription());
        project.setUser(currentUser);
        
        Project savedProject = projectRepository.save(project);
        return convertToDTO(savedProject);
    }

    @Override
    @Transactional
    public ProjectDTO updateProject(Long id, ProjectDTO projectDTO) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dự án với ID: " + id));
                
        // Kiểm tra quyền truy cập
        if (project.getUser() != null && !project.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền chỉnh sửa dự án này");
        }
        
        project.setName(projectDTO.getName());
        project.setDescription(projectDTO.getDescription());
        
        Project updatedProject = projectRepository.save(project);
        return convertToDTO(updatedProject);
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        User currentUser = getCurrentUser();
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dự án với ID: " + id));
                
        // Kiểm tra quyền truy cập
        if (project.getUser() != null && !project.getUser().getId().equals(currentUser.getId())) {
            throw new AccessDeniedException("Không có quyền xóa dự án này");
        }
        
        projectRepository.deleteById(id);
    }
    
    private ProjectDTO convertToDTO(Project project) {
        ProjectDTO dto = new ProjectDTO();
        dto.setId(project.getId());
        dto.setName(project.getName());
        dto.setDescription(project.getDescription());
        dto.setCreatedAt(project.getCreatedAt());
        dto.setUpdatedAt(project.getUpdatedAt());
        
        // Chuyển đổi danh sách Task thành TaskSummaryDTO
        List<ProjectDTO.TaskSummaryDTO> taskSummaries = project.getTasks().stream()
                .map(this::convertToTaskSummaryDTO)
                .collect(Collectors.toList());
        dto.setTasks(taskSummaries);
        
        return dto;
    }
    
    private ProjectDTO.TaskSummaryDTO convertToTaskSummaryDTO(Task task) {
        return new ProjectDTO.TaskSummaryDTO(
                task.getId(),
                task.getTitle(),
                task.getDueDate(),
                task.getStatus().name(),
                task.getProgress()
        );
    }
} 