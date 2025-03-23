package com.net.ken.server.repository;

import com.net.ken.server.model.Project;
import com.net.ken.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    // Lọc dự án theo người dùng
    List<Project> findByUser(User user);
    
    // Tìm dự án theo ID và người dùng để đảm bảo quyền truy cập
    Project findByIdAndUser(Long id, User user);
} 