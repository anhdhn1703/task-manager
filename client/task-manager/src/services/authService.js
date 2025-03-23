import api from './api';
import { message } from 'antd';
import { jwtDecode } from 'jwt-decode';

// Key lưu trữ token và thông tin người dùng trong localStorage
const AUTH_TOKEN_KEY = 'auth_token';
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
      console.log('authService: Phản hồi từ server:', response.data);
      
      if (!response || !response.data) {
        console.error('authService: Phản hồi không hợp lệ');
        throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ');
      }
      
      const data = response.data;
      
      if (!data.token) {
        console.error('authService: Không tìm thấy token trong phản hồi');
        throw new Error('Không có token xác thực trong phản hồi từ máy chủ');
      }
      
      // Xác định dữ liệu người dùng (có thể từ user object hoặc trực tiếp từ phản hồi)
      let userData = null;
      
      if (data.user) {
        // Trường hợp phản hồi có user object
        userData = data.user;
      } else if (data.username) {
        // Trường hợp thông tin user nằm trực tiếp trong phản hồi
        userData = {
          id: data.id,
          username: data.username,
          email: data.email,
          fullName: data.fullName,
          roles: data.roles || []
        };
      } else {
        console.error('authService: Không thể xác định thông tin người dùng từ phản hồi');
        throw new Error('Không thể xác định thông tin người dùng từ phản hồi');
      }
      
      // In ra để debug
      console.log('authService: Thông tin user trước khi lưu:', JSON.stringify(userData));
      
      // Lưu token và thông tin người dùng vào localStorage
      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(USER_INFO_KEY, JSON.stringify(userData));
      
      console.log('authService: Đăng nhập thành công, đã lưu token và thông tin người dùng');
      
      // Trả về dữ liệu đã chuẩn hóa
      return {
        token: data.token,
        user: userData
      };
    } catch (error) {
      console.error('authService - Lỗi đăng nhập:', error);
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
  register: async (username, email, password) => {
    try {
      console.log(`authService: Đăng ký tài khoản mới - ${username}, ${email}`);
      
      const response = await api.post('/auth/register', { 
        username, 
        email, 
        password 
      });
      
      console.log('authService: Phản hồi đăng ký từ server:', response.data);
      
      if (!response || !response.data) {
        throw new Error('Không nhận được phản hồi hợp lệ từ máy chủ');
      }
      
      return { 
        success: true, 
        ...response.data 
      };
    } catch (error) {
      console.error('authService - Lỗi đăng ký:', error);
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
        oldPassword,
        newPassword
      });
      
      console.log('authService: Phản hồi đổi mật khẩu từ server:', response.data);
      
      return { 
        success: true, 
        ...response.data 
      };
    } catch (error) {
      console.error('authService - Lỗi đổi mật khẩu:', error);
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
      console.log('authService: Phản hồi xác minh token:', response.data);
      
      return response.data.valid === true;
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
    localStorage.removeItem(USER_INFO_KEY);
  },

  /**
   * Lấy token từ localStorage
   * @returns {string|null} - Token hoặc null nếu không tìm thấy
   */
  getToken: () => {
    return localStorage.getItem(AUTH_TOKEN_KEY);
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
   * Kiểm tra người dùng đã đăng nhập chưa
   * @returns {boolean} - Đã đăng nhập hay chưa
   */
  isLoggedIn: () => {
    return authService.getToken() !== null && !authService.isTokenExpired();
  },

  /**
   * Kiểm tra token còn hạn không
   * @returns {boolean} - Token đã hết hạn hay chưa
   */
  isTokenExpired: () => {
    const token = authService.getToken();
    if (!token) return true;
    
    try {
      const decoded = jwtDecode(token);
      // Kiểm tra xem token đã hết hạn chưa (exp là thời gian hết hạn tính bằng giây)
      const currentTime = Date.now() / 1000; // Chuyển đổi thành giây
      
      if (!decoded.exp) {
        console.log('authService: Token không có thông tin thời hạn');
        return true;
      }
      
      return decoded.exp < currentTime;
    } catch (error) {
      console.error('authService: Lỗi khi giải mã token:', error);
      return true;
    }
  },

  /**
   * Kiểm tra token có hợp lệ không
   * @returns {boolean} - Token có hợp lệ không
   */
  hasValidToken: () => {
    return !authService.isTokenExpired();
  },

  /**
   * Khởi tạo header Authorization cho API nếu có token
   */
  initializeAuth: () => {
    console.log('authService: Khởi tạo xác thực');
    const token = authService.getToken();
    if (token) {
      console.log('authService: Đã tìm thấy token, đặt header Authorization');
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('authService: Không tìm thấy token, xóa header Authorization');
      delete api.defaults.headers.common['Authorization'];
    }
  }
};

// Khởi tạo header Authorization nếu có token
authService.initializeAuth();

export default authService; 