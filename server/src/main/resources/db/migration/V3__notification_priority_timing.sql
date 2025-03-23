ALTER TABLE notifications
ADD COLUMN priority VARCHAR(20) DEFAULT 'NORMAL' NOT NULL,
ADD COLUMN notify_at TIMESTAMP,
ADD COLUMN expire_at TIMESTAMP;

-- Cập nhật các giá trị notify_at và expire_at cho dữ liệu hiện có
UPDATE notifications
SET notify_at = created_at,
    expire_at = DATE_ADD(created_at, INTERVAL 7 DAY);

-- Cập nhật priority dựa trên type
UPDATE notifications
SET priority = CASE
    WHEN type = 'DEADLINE_APPROACHING' THEN 'HIGH'
    WHEN type = 'DEADLINE_OVERDUE' THEN 'URGENT'
    WHEN type = 'TASK_COMPLETED' THEN 'LOW'
    ELSE 'NORMAL'
END; 