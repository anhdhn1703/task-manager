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

### Phiên bản 1.2.1 (25/03/2025)
**Sửa lỗi tiến độ công việc**

* Sửa lỗi quan trọng: tiến độ công việc luôn hiển thị 0% thay vì giá trị thực từ cơ sở dữ liệu
* Cải thiện xử lý giá trị null trong chuyển đổi dữ liệu:
  - Thêm kiểm tra null cho thuộc tính progress trong TaskServiceImpl
  - Thiết lập giá trị mặc định 0 khi progress là null
  - Thêm ghi log cảnh báo khi phát hiện giá trị progress null
* Đảm bảo tính nhất quán trong việc hiển thị tiến độ công việc
* Tăng cường tính ổn định khi hiển thị task trên giao diện người dùng

### Phiên bản 1.3.0 (31/03/2025)
**Cải thiện bảo mật và trải nghiệm người dùng**

* Nâng cao tính bảo mật của hệ thống:
  - Thêm giới hạn tốc độ yêu cầu (Rate limiting) cho API, đặc biệt là các endpoint xác thực
  - Bảo vệ chống lại tấn công brute force bằng cách khóa tài khoản sau 6 lần đăng nhập sai
  - Tự động mở khóa tài khoản bằng chức năng Admin
* Cải thiện quản lý xác thực và phiên làm việc:
  - Sửa lỗi tăng đôi số lần đăng nhập sai khi nhập sai mật khẩu
  - Cải thiện luồng xử lý mật khẩu hết hạn
  - Thêm cơ chế tự động chuyển hướng đến trang đổi mật khẩu
* Sửa lỗi hiển thị tiếng Việt trong thông báo lỗi:
  - Cấu hình UTF-8 cho API response
  - Sửa lỗi hiển thị ký tự tiếng Việt trong thông báo lỗi rate limit
* Tối ưu trải nghiệm người dùng:
  - Giải quyết vấn đề thông báo lỗi trùng lặp giữa API và giao diện người dùng
  - Cải thiện chi tiết thông báo lỗi để người dùng hiểu rõ hơn
  - Hiển thị số lần đăng nhập sai còn lại trước khi tài khoản bị khóa

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