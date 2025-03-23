import axios from 'axios';
import { message } from 'antd';

// Lấy URL API từ biến môi trường
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Tạo instance Axios với cấu hình mặc định
const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000, // 10 giây
  headers: {
    'Content-Type': 'application/json',
  },
});

// Hàm helper để lấy ID người dùng từ localStorage
const getCurrentUserId = () => {
  try {
    const userInfo = localStorage.getItem('user_info');
    
    // Kiểm tra xem userInfo có tồn tại không
    if (!userInfo || userInfo === 'undefined' || userInfo === 'null') {
      console.log('api.js: Không tìm thấy thông tin người dùng trong localStorage');
      return null;
    }
    
    const user = JSON.parse(userInfo);
    
    if (!user || !user.id) {
      console.log('api.js: Thông tin người dùng không có ID:', user);
      return null;
    }
    
    return user.id;
  } catch (error) {
    console.error('api.js: Lỗi khi lấy ID người dùng:', error);
    return null;
  }
};

// Interceptor cho request
api.interceptors.request.use(
  (config) => {
    // Thêm token xác thực vào header nếu có
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Không thêm X-User-ID nữa vì gây lỗi CORS
    // const userId = getCurrentUserId();
    // if (userId) {
    //   config.headers['X-User-ID'] = userId;
    // }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho response
api.interceptors.response.use(
  (response) => {
    console.log(`api.js: Phản hồi thành công từ ${response.config.url}`, response);
    
    // Trả về toàn bộ response thay vì chỉ data
    return response;
  },
  (error) => {
    console.error('api.js: Lỗi phản hồi từ server:', error);
    
    // Xử lý các loại lỗi khác nhau
    if (error.response) {
      // Phản hồi từ máy chủ với mã lỗi
      const { status, data } = error.response;
      
      if (status === 401) {
        // Lỗi xác thực - đăng xuất người dùng
        console.log('api.js: Lỗi xác thực 401, đang chuyển hướng đến trang đăng nhập');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('user_info');
        
        // Thông báo cho người dùng
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        
        // Chuyển hướng đến trang đăng nhập sau 1 giây
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      } 
      else if (status === 403) {
        message.error('Bạn không có quyền thực hiện hành động này');
      }
      else if (status === 404) {
        message.error('Không tìm thấy tài nguyên');
      }
      else if (status === 500) {
        message.error('Lỗi máy chủ. Vui lòng thử lại sau.');
      }
      else if (data && data.message) {
        // Hiển thị thông báo lỗi từ server nếu có
        message.error(data.message);
      }
    } 
    else if (error.request) {
      // Yêu cầu đã được gửi nhưng không nhận được phản hồi
      console.error('api.js: Không nhận được phản hồi từ server:', error.request);
      message.error('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
    } 
    else {
      // Lỗi khi thiết lập yêu cầu
      console.error('api.js: Lỗi khi gửi yêu cầu:', error.message);
      message.error('Có lỗi xảy ra khi gửi yêu cầu.');
    }
    
    return Promise.reject(error);
  }
);

// Hàm helper để phân tích JWT token
export const parseJwt = (token) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Lỗi khi phân tích JWT token:', e);
    return null;
  }
};

export default api; 