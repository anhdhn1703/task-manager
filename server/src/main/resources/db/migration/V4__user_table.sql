-- Tạo bảng users
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    account_non_expired BOOLEAN DEFAULT TRUE,
    account_non_locked BOOLEAN DEFAULT TRUE,
    credentials_non_expired BOOLEAN DEFAULT TRUE,
    enabled BOOLEAN DEFAULT TRUE
);

-- Tạo bảng user_roles
CREATE TABLE user_roles (
    user_id BIGINT NOT NULL,
    role VARCHAR(20) NOT NULL,
    PRIMARY KEY (user_id, role),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Tạo tài khoản admin mặc định với mật khẩu là "admin123"
-- Mật khẩu đã được mã hóa với BCrypt
INSERT INTO users (username, password, email, full_name, created_at, updated_at)
VALUES ('admin', '$2a$10$3NE.KoMx9U1YKcPHR8PyJuL6z5sT9QVL9JXtxNt.BgZEL9Z0YCGmO', 'admin@taskmanager.com', 'Admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Gán vai trò ADMIN cho tài khoản admin
INSERT INTO user_roles (user_id, role)
VALUES (1, 'ADMIN');

-- Thêm cột user_id vào bảng tasks
ALTER TABLE tasks
ADD COLUMN user_id BIGINT,
ADD FOREIGN KEY (user_id) REFERENCES users(id);

-- Thêm cột user_id vào bảng projects
ALTER TABLE projects
ADD COLUMN user_id BIGINT,
ADD FOREIGN KEY (user_id) REFERENCES users(id); 