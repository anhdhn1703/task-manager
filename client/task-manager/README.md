# Ứng dụng Quản lý Công việc

Ứng dụng web quản lý công việc và dự án với giao diện người dùng hiện đại, hỗ trợ quản lý dự án, công việc, nhãn và thông báo.

## Tính năng

- **Bảng điều khiển**: Xem tổng quan về dự án và công việc
- **Quản lý Dự án**: Tạo, chỉnh sửa, xóa dự án
- **Quản lý Công việc**: Tạo, chỉnh sửa, xóa công việc, phân loại theo dự án
- **Quản lý Nhãn**: Gắn nhãn cho công việc và dự án
- **Thông báo**: Nhận thông báo về các cập nhật quan trọng
- **Trợ lý AI**: Tích hợp trợ lý AI để hỗ trợ quản lý công việc

## Cài đặt và Chạy

### Yêu cầu

- Node.js phiên bản 16.x trở lên
- npm hoặc yarn

### Cài đặt

```bash
# Clone dự án
git clone https://github.com/anhdhn1703/task-manager.git

# Di chuyển vào thư mục dự án
cd task-manager

# Cài đặt dependencies
npm install
# hoặc
yarn
```

### Chạy ứng dụng

```bash
# Khởi động môi trường development
npm start
# hoặc
yarn start
```

Truy cập ứng dụng tại http://localhost:3000

### Build cho production

```bash
npm run build
# hoặc
yarn build
```

## Cấu trúc dự án

```
src/
├── api/               # Các API calls
├── components/        # Components tái sử dụng
├── contexts/          # React contexts
├── hooks/             # Custom hooks
├── layouts/           # Layout components
├── pages/             # Các trang chính của ứng dụng
├── services/          # Các service
├── utils/             # Utilities và helper functions
├── App.js             # Component chính
└── index.js           # Entry point
```

## Công nghệ sử dụng

- React
- React Router
- Ant Design
- Axios
- Moment.js
- Ant Design Charts

## Hướng dẫn phát triển

- **Thêm trang mới**: Tạo component trong thư mục `pages` và thêm route trong `App.js`
- **Thêm component**: Tạo component trong thư mục `components`
- **Styling**: Sử dụng Ant Design và CSS modules

## License

MIT
