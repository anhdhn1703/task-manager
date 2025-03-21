package com.net.ken.server.service.impl;

import com.net.ken.server.dto.ProjectDTO;
import com.net.ken.server.model.Project;
import com.net.ken.server.model.Task;
import com.net.ken.server.repository.ProjectRepository;
import com.net.ken.server.service.ProjectService;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;

    @Autowired
    public ProjectServiceImpl(ProjectRepository projectRepository) {
        this.projectRepository = projectRepository;
    }

    @Override
    public List<ProjectDTO> getAllProjects() {
        return projectRepository.findAll().stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public ProjectDTO getProjectById(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dự án với ID: " + id));
        return convertToDTO(project);
    }

    @Override
    @Transactional
    public ProjectDTO createProject(ProjectDTO projectDTO) {
        Project project = new Project();
        project.setName(projectDTO.getName());
        project.setDescription(projectDTO.getDescription());
        
        Project savedProject = projectRepository.save(project);
        return convertToDTO(savedProject);
    }

    @Override
    @Transactional
    public ProjectDTO updateProject(Long id, ProjectDTO projectDTO) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Không tìm thấy dự án với ID: " + id));
        
        project.setName(projectDTO.getName());
        project.setDescription(projectDTO.getDescription());
        
        Project updatedProject = projectRepository.save(project);
        return convertToDTO(updatedProject);
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        if (!projectRepository.existsById(id)) {
            throw new EntityNotFoundException("Không tìm thấy dự án với ID: " + id);
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