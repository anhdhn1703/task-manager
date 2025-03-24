package com.net.ken.server.repository;

import com.net.ken.server.model.Project;
import com.net.ken.server.model.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProjectRepository extends JpaRepository<Project, Long> {
    // Lọc dự án theo người dùng với eager loading tasks
    @EntityGraph(attributePaths = {"tasks"})
    List<Project> findByUser(User user);
    
    // Phân trang cho findByUser
    @EntityGraph(attributePaths = {"tasks"})
    Page<Project> findByUser(User user, Pageable pageable);
    
    // Tìm dự án theo ID và người dùng để đảm bảo quyền truy cập
    @EntityGraph(attributePaths = {"tasks"})
    Optional<Project> findByIdAndUser(Long id, User user);
    
    // Ghi đè phương thức findById để sử dụng EntityGraph
    @Override
    @EntityGraph(attributePaths = {"tasks"})
    Optional<Project> findById(Long id);
} 