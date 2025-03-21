package com.net.ken.server.controller;

import com.net.ken.server.dto.TaskDTO;
import com.net.ken.server.service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai-assistant")
@CrossOrigin(origins = "*")
public class AiAssistantController {

    private final TaskService taskService;

    @Autowired
    public AiAssistantController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping("/optimize-tasks")
    public ResponseEntity<Map<String, Object>> getOptimizedTaskOrder() {
        List<TaskDTO> allTasks = taskService.getAllTasks();
        
        // Lọc các công việc chưa hoàn thành
        List<TaskDTO> incompleteTasks = allTasks.stream()
                .filter(task -> !"COMPLETED".equals(task.getStatus()))
                .collect(Collectors.toList());
        
        // Sắp xếp công việc dựa trên thuật toán tối ưu
        List<TaskDTO> optimizedTasks = optimizeTasks(incompleteTasks);
        
        Map<String, Object> response = new HashMap<>();
        response.put("optimizedTasks", optimizedTasks);
        response.put("explanation", generateExplanation(optimizedTasks));
        
        return ResponseEntity.ok(response);
    }
    
    private List<TaskDTO> optimizeTasks(List<TaskDTO> tasks) {
        // Đây là thuật toán tối ưu đơn giản, có thể cải thiện thêm sau
        // Thuật toán này ưu tiên:
        // 1. Độ ưu tiên của công việc
        // 2. Ngày đến hạn
        
        return tasks.stream()
                .sorted(Comparator
                        // Sắp xếp theo độ ưu tiên (URGENT > HIGH > MEDIUM > LOW)
                        .comparing((TaskDTO task) -> {
                            String priority = task.getPriority();
                            if ("URGENT".equals(priority)) return 0;
                            if ("HIGH".equals(priority)) return 1;
                            if ("MEDIUM".equals(priority)) return 2;
                            return 3; // LOW
                        })
                        // Sau đó sắp xếp theo deadline (sớm nhất lên đầu)
                        .thenComparing(task -> {
                            LocalDateTime dueDate = task.getDueDate();
                            return dueDate != null ? dueDate : LocalDateTime.MAX;
                        }))
                .collect(Collectors.toList());
    }
    
    private String generateExplanation(List<TaskDTO> optimizedTasks) {
        StringBuilder explanation = new StringBuilder();
        explanation.append("Thứ tự công việc được tối ưu hóa dựa trên mức độ ưu tiên và deadline. ");
        
        if (!optimizedTasks.isEmpty()) {
            explanation.append("Bạn nên tập trung vào các công việc khẩn cấp và quan trọng trước. ");
            
            // Tìm các công việc sắp đến hạn trong 2 ngày tới
            LocalDateTime twoDaysLater = LocalDateTime.now().plusDays(2);
            List<TaskDTO> urgentTasks = optimizedTasks.stream()
                    .filter(task -> task.getDueDate() != null && task.getDueDate().isBefore(twoDaysLater))
                    .collect(Collectors.toList());
            
            if (!urgentTasks.isEmpty()) {
                explanation.append("Lưu ý: Có ").append(urgentTasks.size())
                        .append(" công việc sắp đến hạn trong vòng 2 ngày tới cần được ưu tiên cao nhất.");
            }
        } else {
            explanation.append("Hiện tại không có công việc nào cần xử lý.");
        }
        
        return explanation.toString();
    }
} 