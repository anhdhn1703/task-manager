import axios from 'axios';
import { message } from 'antd';

// Lấy URL API từ biến môi trường
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// Key lưu trữ token trong localStorage
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

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

// Biến để theo dõi refresh token đang xử lý
let isRefreshing = false;
let failedQueue = [];

// Xử lý hàng đợi các request bị lỗi
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

// Interceptor cho request
api.interceptors.request.use(
  (config) => {
    // Thêm token xác thực vào header nếu có
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor cho response
api.interceptors.response.use(
  (response) => {
    // Log thông tin phản hồi cho debug
    console.log(`api.js: Phản hồi thành công từ ${response.config.url}`, response);
    
    // Kiểm tra cấu trúc phản hồi
    if (response && response.data) {
      // Nếu phản hồi có cấu trúc success, message, data thì đó là ResponseDTO
      if (typeof response.data === 'object' && 'success' in response.data) {
        // Kiểm tra thành công/thất bại từ success flag
        if (response.data.success === false) {
          console.warn('api.js: Phản hồi có trạng thái success = false', response.data);
          
          // Nếu có thông báo lỗi, hiển thị cho người dùng
          if (response.data.message) {
            message.error(response.data.message);
          }
          
          // Tạo lỗi từ phản hồi
          const error = new Error(response.data.message || 'Lỗi không xác định');
          error.response = response;
          error.errorCode = response.data.errorCode;
          
          return Promise.reject(error);
        }
        
        // Nếu là ResponseDTO thành công, trả về response để service có thể truy cập response.data.data
        return response;
      } else {
        // Nếu phản hồi không có cấu trúc ResponseDTO, gắn dữ liệu vào cấu trúc giống ResponseDTO
        // Để đảm bảo các service có thể truy cập nhất quán qua response.data.data
        response.data = {
          success: true,
          message: 'OK',
          data: response.data
        };
      }
      
      return response;
    }
    
    // Nếu không theo cấu trúc chuẩn, trả về nguyên bản
    return response;
  },
  async (error) => {
    console.error('api.js: Lỗi phản hồi từ server:', error);
    
    const originalRequest = error.config;
    
    // Xử lý các loại lỗi khác nhau
    if (error.response) {
      // Phản hồi từ máy chủ với mã lỗi
      const { status } = error.response;
      
      // Token hết hạn - thử refresh token
      if (status === 401 && !originalRequest._retry) {
        if (isRefreshing) {
          // Nếu đang trong quá trình refresh token, thêm request vào hàng đợi
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(token => {
              originalRequest.headers['Authorization'] = `Bearer ${token}`;
              return api(originalRequest);
            })
            .catch(err => {
              return Promise.reject(err);
            });
        }
        
        originalRequest._retry = true;
        isRefreshing = true;
        
        const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
        
        if (!refreshToken) {
          // Không có refresh token - chuyển hướng đến trang đăng nhập
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem('user_info');
          
          message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
          
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
          
          return Promise.reject(error);
        }
        
        try {
          // Gọi API để refresh token
          const response = await axios.post(`${apiUrl}/auth/refresh-token`, {
            refreshToken: refreshToken
          });
          
          if (response.data && response.data.success && response.data.data && response.data.data.token) {
            const responseData = response.data.data;
            const newToken = responseData.token;
            const newRefreshToken = responseData.refreshToken || refreshToken;
            
            // Lưu token mới
            localStorage.setItem(AUTH_TOKEN_KEY, newToken);
            localStorage.setItem(REFRESH_TOKEN_KEY, newRefreshToken);
            
            // Cập nhật header cho request hiện tại
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
            originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
            
            // Xử lý hàng đợi các request bị lỗi
            processQueue(null, newToken);
            
            // Thử lại request ban đầu
            return api(originalRequest);
          } else {
            // Refresh token thất bại, chuyển hướng đến trang đăng nhập
            processQueue(new Error('Refresh token failed'));
            localStorage.removeItem(AUTH_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            localStorage.removeItem('user_info');
            
            message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
            
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        } catch (refreshError) {
          // Xử lý lỗi khi refresh token
          processQueue(refreshError);
          localStorage.removeItem(AUTH_TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem('user_info');
          
          message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
          
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        } finally {
          isRefreshing = false;
        }
        
        return Promise.reject(error);
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
      else if (error.response.data && error.response.data.message) {
        // Hiển thị thông báo lỗi từ server nếu có
        message.error(error.response.data.message);
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