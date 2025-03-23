package com.net.ken.server.repository;

import com.net.ken.server.model.Tag;
import com.net.ken.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    // Tìm tag theo tên và người dùng
    Optional<Tag> findByNameAndUser(String name, User user);
    
    // Lọc tags theo người dùng
    List<Tag> findByUser(User user);
    
    // Kiểm tra tag đã tồn tại cho người dùng chưa
    boolean existsByNameAndUser(String name, User user);
} 