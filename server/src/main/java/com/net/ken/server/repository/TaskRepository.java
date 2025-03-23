package com.net.ken.server.repository;

import com.net.ken.server.model.Task;
import com.net.ken.server.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TaskRepository extends JpaRepository<Task, Long> {
    // Lọc tasks theo người dùng
    List<Task> findByUser(User user);
    
    // Tìm task theo ID và người dùng để đảm bảo quyền truy cập
    Task findByIdAndUser(Long id, User user);
    
    // Lọc tasks theo project và người dùng
    List<Task> findByProjectIdAndUser(Long projectId, User user);
    
    // Phương thức cũ - giữ để tương thích ngược
    List<Task> findByProjectId(Long projectId);
    
    // Lọc tasks theo deadline và người dùng
    List<Task> findByUserAndDueDateBefore(User user, LocalDateTime date);
    
    List<Task> findByDueDateBefore(LocalDateTime date);
    
    // Lọc tasks trong khoảng thời gian và theo người dùng
    @Query("SELECT t FROM Task t WHERE t.user = :user AND t.dueDate BETWEEN :startDate AND :endDate")
    List<Task> findUserTasksWithDueDateBetween(
            @Param("user") User user,
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate);
    
    @Query("SELECT t FROM Task t WHERE t.dueDate BETWEEN :startDate AND :endDate")
    List<Task> findTasksWithDueDateBetween(
            @Param("startDate") LocalDateTime startDate, 
            @Param("endDate") LocalDateTime endDate);
    
    // Lọc tasks theo project, trạng thái và người dùng
    List<Task> findByProjectIdAndStatusAndUser(Long projectId, Task.Status status, User user);
    
    List<Task> findByProjectIdAndStatus(Long projectId, Task.Status status);
    
    // Lọc tasks theo mức độ ưu tiên và người dùng
    List<Task> findByPriorityAndUser(Task.Priority priority, User user);
    
    List<Task> findByPriority(Task.Priority priority);
    
    // Lọc tasks khác trạng thái cụ thể và theo người dùng
    List<Task> findByStatusNotAndUser(Task.Status status, User user);
    
    List<Task> findByStatusNot(Task.Status status);
    
    // Các phương thức khác với lọc theo người dùng
    List<Task> findByUserAndStatusNotAndDueDateIsNotNull(User user, Task.Status status);
    
    List<Task> findByStatusNotAndDueDateIsNotNull(Task.Status status);
    
    List<Task> findByUserAndStatusNotAndDueDateBetween(
            User user, Task.Status status, 
            LocalDateTime startDate, LocalDateTime endDate);
    
    List<Task> findByStatusNotAndDueDateBetween(
            Task.Status status, LocalDateTime startDate, LocalDateTime endDate);
} 