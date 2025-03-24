import api from './api';
import { message } from 'antd';
import { jwtDecode } from 'jwt-decode';

// Key lưu trữ token và thông tin người dùng trong localStorage
const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_INFO_KEY = 'user_info';

// Các khóa localStorage khác cần xóa khi đăng nhập/đăng xuất
const APP_DATA_KEYS = [
  'projects', 
  'tasks', 
  'notifications',
  'tags',
  'user_settings',
  'cached_data',
  // Thêm các khóa khác nếu có
];

/**
 * Xóa tất cả dữ liệu ứng dụng khỏi localStorage
 */
const clearAppData = () => {
  console.log('AuthService: Xóa tất cả dữ liệu ứng dụng');
  
  // Xóa các khóa dữ liệu ứng dụng đã biết
  APP_DATA_KEYS.forEach(key => {
    localStorage.removeItem(key);
  });
  
  // Xóa sessionStorage nếu có lưu dữ liệu
  sessionStorage.clear();
  
  // Xóa cache trong IndexedDB nếu có
  if ('caches' in window) {
    try {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('task-manager')) {
            caches.delete(name);
          }
        });
      });
    } catch (e) {
      console.error('Không thể xóa cache:', e);
    }
  }
};

const authService = {
  /**
   * Đăng nhập người dùng
   * @param {string} username - Tên đăng nhập
   * @param {string} password - Mật khẩu
   * @returns {Promise<Object>} - Thông tin người dùng và token
   */
  login: async (username, password) => {
    try {
      console.log(`authService: Đang đăng nhập với username: ${username}`);
      
      const response = await api.post('/auth/login', { username, password });
      console.log('authService: Phản hồi từ server:', response);
      
      // Log cấu trúc phản hồi chi tiết
      console.log('authService: Cấu trúc phản hồi login:', {
        status: response?.status,
        statusText: response?.statusText,
        hasData: !!response?.data,
        dataKeys: response?.data ? Object.keys(response.data) : [],
        dataObject: response?.data,
        hasNestedData: !!(response?.data?.data),
        nestedDataKeys: response?.data?.data ? Object.keys(response.data.data) : []
      });
      
      if (!response || !response.data) {
        console.error('authService: Phản hồi không hợp lệ');
        throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ');
      }
      
      const responseData = response.data;
      
      // Kiểm tra xem có success không
      if (responseData.success === false) {
        console.error('authService: Đăng nhập thất bại', responseData.message);
        throw new Error(responseData.message || 'Đăng nhập thất bại');
      }
      
      // Lấy dữ liệu từ cấu trúc ResponseDTO
      const userData = responseData.data;
      
      // Kiểm tra xem data có tồn tại không
      if (!userData) {
        console.error('authService: Không tìm thấy dữ liệu trong phản hồi', responseData);
        throw new Error('Không có dữ liệu trong phản hồi từ máy chủ');
      }
      
      // Nếu có dữ liệu nhưng không có token, báo lỗi
      if (!userData.token) {
        console.error('authService: Không tìm thấy token trong phản hồi', userData);
        throw new Error('Không có token xác thực trong phản hồi từ máy chủ');
      }
      
      // Lưu token và refresh token vào localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, userData.token);
      if (userData.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, userData.refreshToken);
      }
      
      // Xây dựng đối tượng user từ dữ liệu phản hồi
      const user = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName,
        roles: userData.roles || []
      };
      
      // In ra để debug
      console.log('authService: Thông tin user trước khi lưu:', JSON.stringify(user));
      
      // Lưu thông tin người dùng vào localStorage
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
      
      console.log('authService: Đăng nhập thành công, đã lưu token và thông tin người dùng');
      
      // Trả về dữ liệu đã chuẩn hóa
      return {
        token: userData.token,
        refreshToken: userData.refreshToken,
        user: user
      };
    } catch (error) {
      console.error('authService - Lỗi đăng nhập:', error);
      
      // Xử lý các loại lỗi chi tiết
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 401) {
          throw new Error('Tên đăng nhập hoặc mật khẩu không đúng');
        } else if (status === 403) {
          throw new Error('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên');
        } else if (data && data.message) {
          throw new Error(data.message);
        }
      }
      
      throw error;
    }
  },

  /**
   * Đăng ký người dùng mới
   * @param {string} username - Tên đăng nhập
   * @param {string} email - Email
   * @param {string} password - Mật khẩu
   * @returns {Promise<Object>} - Kết quả đăng ký
   */
  register: async (username, email, password, fullName = '') => {
    try {
      console.log(`authService: Đăng ký tài khoản mới - ${username}, ${email}`);
      
      const response = await api.post('/auth/register', { 
        username, 
        email, 
        password,
        fullName 
      });
      
      console.log('authService: Phản hồi đăng ký từ server:', response);
      
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ');
      }
      
      // Lấy dữ liệu từ cấu trúc phản hồi mới
      const responseData = response.data.data;
      
      // Kiểm tra xem data có tồn tại không
      if (!responseData) {
        console.error('authService: Không tìm thấy dữ liệu trong phản hồi đăng ký', response.data);
        throw new Error('Không có dữ liệu trong phản hồi từ máy chủ');
      }
      
      // Kiểm tra xem data có chứa token không
      if (!responseData.token) {
        console.error('authService: Không tìm thấy token trong phản hồi đăng ký', responseData);
        throw new Error('Không có token xác thực trong phản hồi từ máy chủ');
      }
      
      // Lưu token và refresh token vào localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, responseData.token);
      if (responseData.refreshToken) {
        localStorage.setItem(REFRESH_TOKEN_KEY, responseData.refreshToken);
      }
      
      // Xây dựng đối tượng user từ dữ liệu phản hồi
      const userData = {
        id: responseData.id,
        username: responseData.username,
        email: responseData.email,
        fullName: responseData.fullName || fullName,
        roles: responseData.roles || []
      };
      
      // Lưu thông tin người dùng vào localStorage
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));
      
      return { 
        success: true, 
        token: responseData.token,
        refreshToken: responseData.refreshToken,
        user: userData
      };
    } catch (error) {
      console.error('authService - Lỗi đăng ký:', error);
      
      // Xử lý các loại lỗi chi tiết
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400) {
          if (data.validationErrors) {
            // Có lỗi validation
            const errors = Object.values(data.validationErrors).join(', ');
            throw new Error(`Lỗi xác thực dữ liệu: ${errors}`);
          } else if (data.message) {
            throw new Error(data.message);
          }
        } else if (data && data.message) {
          throw new Error(data.message);
        }
      }
      
      throw error;
    }
  },

  /**
   * Đổi mật khẩu người dùng
   * @param {string} oldPassword - Mật khẩu cũ
   * @param {string} newPassword - Mật khẩu mới
   * @returns {Promise<Object>} - Kết quả đổi mật khẩu
   */
  changePassword: async (oldPassword, newPassword) => {
    try {
      console.log('authService: Đang thực hiện đổi mật khẩu');
      
      // Kiểm tra xem người dùng đã đăng nhập chưa
      if (!authService.getToken()) {
        throw new Error('Vui lòng đăng nhập để thực hiện thao tác này');
      }
      
      const response = await api.post('/auth/change-password', {
        currentPassword: oldPassword,
        newPassword
      });
      
      console.log('authService: Phản hồi đổi mật khẩu từ server:', response);
      
      // Truy cập cấu trúc phản hồi mới
      const responseData = response.data;
      
      return { 
        success: true,
        message: responseData.message || 'Đổi mật khẩu thành công'
      };
    } catch (error) {
      console.error('authService - Lỗi đổi mật khẩu:', error);
      
      // Xử lý các loại lỗi chi tiết
      if (error.response) {
        const { status, data } = error.response;
        
        if (status === 400 && data.message) {
          throw new Error(data.message);
        } else if (status === 401) {
          throw new Error('Mật khẩu hiện tại không đúng');
        }
      }
      
      throw error;
    }
  },

  /**
   * Xác minh token với server
   * @returns {Promise<boolean>} - Token có hợp lệ không
   */
  validateToken: async () => {
    try {
      const token = authService.getToken();
      
      if (!token) {
        console.log('authService: Không có token để xác minh');
        return false;
      }
      
      // Kiểm tra xem token đã hết hạn chưa
      if (authService.isTokenExpired()) {
        console.log('authService: Token đã hết hạn');
        return false;
      }
      
      // Gọi API để xác minh token còn hợp lệ không
      const response = await api.get('/auth/validate-token');
      console.log('authService: Phản hồi xác minh token:', response);
      
      if (response.success && response.data && response.data.token) {
        // Cập nhật token mới nếu có
        localStorage.setItem(AUTH_TOKEN_KEY, response.data.token);
        
        if (response.data.refreshToken) {
          localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refreshToken);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('authService - Lỗi xác minh token:', error);
      return false;
    }
  },

  /**
   * Đăng xuất người dùng
   */
  logout: () => {
    console.log('authService: Đang đăng xuất, xóa token và thông tin người dùng');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_INFO_KEY);
    
    // Xóa các dữ liệu liên quan
    clearAppData();
  },

  /**
   * Xóa tất cả dữ liệu ứng dụng khỏi localStorage
   */
  clearAppData: () => {
    clearAppData();
  },

  /**
   * Lấy token từ localStorage
   * @returns {string|null} - Token hoặc null nếu không tìm thấy
   */
  getToken: () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  },

  /**
   * Lấy refresh token từ localStorage
   * @returns {string|null} - Refresh token hoặc null nếu không tìm thấy
   */
  getRefreshToken: () => {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Lấy thông tin người dùng hiện tại
   * @returns {Object|null} - Thông tin người dùng hoặc null nếu không tìm thấy
   */
  getCurrentUser: () => {
    try {
      const userInfoString = localStorage.getItem(USER_INFO_KEY);
      
      if (!userInfoString || userInfoString === 'undefined' || userInfoString === 'null') {
        console.log('authService: Không tìm thấy thông tin người dùng trong localStorage');
        return null;
      }
      
      return JSON.parse(userInfoString);
    } catch (error) {
      console.error('authService: Lỗi khi lấy thông tin người dùng:', error);
      return null;
    }
  },

  /**
   * Kiểm tra token có hợp lệ không
   * @returns {boolean} - Token có hợp lệ hay không
   */
  hasValidToken: () => {
    const token = authService.getToken();
    if (!token) return false;
    return !authService.isTokenExpired();
  },

  /**
   * Kiểm tra người dùng đã đăng nhập chưa
   * @returns {boolean} - Đã đăng nhập hay chưa
   */
  isAuthenticated: () => {
    const token = authService.getToken();
    const user = authService.getCurrentUser();
    
    if (!token || !user) return false;
    
    // Kiểm tra token hết hạn
    return !authService.isTokenExpired();
  },

  /**
   * Kiểm tra token đã hết hạn chưa
   * @returns {boolean} - Token đã hết hạn hay chưa
   */
  isTokenExpired: () => {
    const token = authService.getToken();
    
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      
      // Trả về true nếu token đã hết hạn
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('authService: Lỗi khi kiểm tra token hết hạn:', error);
      return true;
    }
  },
  
  /**
   * Xóa dữ liệu hiện tại và làm mới ứng dụng
   */
  clearAndRefresh: () => {
    console.log('authService: Xóa dữ liệu và làm mới ứng dụng');
    authService.logout();
    window.location.href = '/login';
  }
};

export default authService; 