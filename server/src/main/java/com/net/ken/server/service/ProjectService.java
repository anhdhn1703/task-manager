package com.net.ken.server.service;

import com.net.ken.server.dto.ProjectDTO;

import java.util.List;

public interface ProjectService {
    List<ProjectDTO> getAllProjects();
    
    ProjectDTO getProjectById(Long id);
    
    ProjectDTO createProject(ProjectDTO projectDTO);
    
    ProjectDTO updateProject(Long id, ProjectDTO projectDTO);
    
    void deleteProject(Long id);
} 