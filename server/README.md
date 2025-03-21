# 📊 Task Manager API Server

## 📋 Tổng quan
Đây là phần backend của ứng dụng Task Manager, được xây dựng bằng Spring Boot. API server này cung cấp các dịch vụ quản lý công việc, dự án, tag và thông báo.

## 🚀 Công nghệ sử dụng
- **Spring Boot** 3.4.4
- **Java** 24
- **Spring Data JPA**
- **MySQL**
- **Spring AOP**
- **Spring Actuator**

## 🏗️ Cấu trúc dự án
| Package | Mô tả |
|---------|-------|
| `model` | Các entity của ứng dụng |
| `repository` | Các repository để làm việc với cơ sở dữ liệu |
| `service` | Chứa business logic |
| `controller` | Xử lý các request từ client |
| `dto` | Các đối tượng dùng để truyền dữ liệu |
| `exception` | Xử lý ngoại lệ |
| `aspect` | Chứa các aspect cho logging |
| `config` | Cấu hình của ứng dụng |
| `util` | Các tiện ích |

## 🔧 Cài đặt và chạy

### ⚙️ Yêu cầu
- Java 24 hoặc cao hơn
- MySQL
- Maven

### 📥 Các bước cài đặt
1. Clone repository
   ```bash
   git clone https://github.com/anhdhn1703/task-manager.git
   cd task-manager/server
   ```

2. Cấu hình kết nối cơ sở dữ liệu trong `src/main/resources/application.properties`

3. Chạy ứng dụng
   ```bash
   mvn spring-boot:run
   ```

## 🌐 API Endpoints

| Endpoint | Mô tả |
|----------|-------|
| `/api/tasks` | Quản lý công việc |
| `/api/projects` | Quản lý dự án |
| `/api/tags` | Quản lý tag |
| `/api/notifications` | Quản lý thông báo |

## ✨ Tính năng
- ✅ CRUD đầy đủ cho tasks, projects, tags, notifications
- 📝 Logging tự động với AOP
- 📊 Monitoring với Spring Actuator
- ⚠️ Xử lý ngoại lệ tập trung
- 🔄 Cross-Origin Resource Sharing (CORS)
