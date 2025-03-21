package com.net.ken.server.repository;

import com.net.ken.server.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    // Có thể thêm các phương thức truy vấn tùy chỉnh nếu cần
} 