-- Thêm cột start_date vào bảng tasks
ALTER TABLE tasks ADD COLUMN start_date DATETIME;

-- Thêm cột due_status vào bảng tasks
ALTER TABLE tasks ADD COLUMN due_status VARCHAR(20) DEFAULT 'NORMAL';

-- Cập nhật dữ liệu hiện có
UPDATE tasks SET start_date = created_at WHERE start_date IS NULL;
UPDATE tasks SET due_status = 
    CASE 
        WHEN due_date < NOW() THEN 'OVERDUE'
        WHEN due_date BETWEEN NOW() AND DATE_ADD(NOW(), INTERVAL 1 DAY) THEN 'DUE_SOON'
        ELSE 'NORMAL'
    END; 