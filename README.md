# Task Manager

Ứng dụng quản lý công việc và dự án với giao diện người dùng hiện đại và đầy đủ tính năng.

## Lịch sử phiên bản

### Phiên bản 1.0.0 (22/03/2025)
**Khởi tạo Task Manager**

* Tạo cấu trúc dự án Spring Boot (Backend)
* Xây dựng các model cơ bản: Project, Task, Tag
* Thiết kế database và mối quan hệ giữa các entity
* Tạo các REST API cơ bản để quản lý task và project
* Xây dựng giao diện React (Frontend) với Ant Design
* Thiết kế các trang cơ bản: 
  - Dashboard
  - Danh sách dự án
  - Danh sách công việc
  - Chi tiết dự án
  - Chi tiết công việc

### Phiên bản 1.1.0 (23/03/2025)
**Tích hợp xác thực (Authentication)**

* Thêm Spring Security và JWT cho backend
* Xây dựng User model và các API liên quan đến user
* Tích hợp JWT token, cơ chế refresh token
* Thêm các tính năng xác thực người dùng:
  - Đăng nhập
  - Đăng ký
  - Đổi mật khẩu
  - Đăng xuất
* Tạo AuthContext và quản lý trạng thái người dùng trong ReactJS
* Thêm bảo vệ route (Protected Route) cho các trang yêu cầu xác thực
* Thêm trang Unauthorized để hiển thị khi người dùng không có quyền truy cập

### Phiên bản 1.2.0 (24/03/2025)
**Cải thiện hiệu suất và sửa lỗi**

* Cải thiện cấu trúc phản hồi API:
  - Tiêu chuẩn hóa cấu trúc ResponseDTO
  - Đảm bảo nhất quán giữa các API
* Sửa lỗi hiển thị:
  - Sửa lỗi "Cannot read properties of undefined" trong các component
  - Cải thiện việc xử lý lỗi không có dữ liệu
* Tối ưu hóa xử lý phản hồi API trong client:
  - Cập nhật interceptor để trả về toàn bộ response thay vì chỉ response.data
  - Sửa lỗi xử lý token trong authService
  - Cải thiện ghi log và debug thông tin
* Thêm kiểm tra đầy đủ cho dữ liệu không xác định
* Sửa lỗi đăng nhập không nhận token
* Cải thiện thông báo lỗi người dùng

## Công nghệ sử dụng

### Backend
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT (JSON Web Token)
- MySQL/PostgreSQL

### Frontend
- React
- Ant Design (antd)
- Axios
- React Router
- JWT Decode

## Hướng dẫn cài đặt

### Backend
1. Clone repository
2. Cài đặt Java 17 và Maven
3. Cấu hình database trong `application.properties`
4. Chạy lệnh: `mvn spring-boot:run`

### Frontend
1. Di chuyển đến thư mục `client/task-manager`
2. Cài đặt dependencies: `npm install`
3. Chạy ứng dụng: `npm start`

## Tác giả
- Ken 