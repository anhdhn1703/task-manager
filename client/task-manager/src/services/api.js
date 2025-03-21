import axios from 'axios';
import { message } from 'antd';

const BASE_URL = 'http://localhost:8080/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor xử lý lỗi
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      if (status === 400) {
        if (data.validationErrors) {
          // Nếu có lỗi validation, hiển thị chi tiết
          const errorMessages = Object.values(data.validationErrors).join(', ');
          message.error(`Lỗi dữ liệu: ${errorMessages}`);
        } else {
          message.error(data.message || 'Dữ liệu không hợp lệ.');
        }
      } else if (status === 401) {
        message.error('Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
        // TODO: Xử lý đăng xuất nếu cần
      } else if (status === 403) {
        message.error('Bạn không có quyền thực hiện thao tác này.');
      } else if (status === 404) {
        message.error(data.message || 'Không tìm thấy tài nguyên yêu cầu.');
      } else if (status === 500) {
        message.error('Đã xảy ra lỗi từ máy chủ. Vui lòng thử lại sau.');
      } else {
        message.error(data.message || 'Đã xảy ra lỗi không xác định.');
      }
    } else {
      message.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    }
    
    return Promise.reject(error);
  }
);

export default api; 