import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { message } from 'antd';
import useAuthStore from '../stores/authStore';
import authService from '../services/authService';

/**
 * Custom hook để cung cấp các chức năng xác thực
 * Kết hợp giữa Zustand store và các chức năng bổ sung
 */
export const useAuth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Lấy state và actions từ store
  const {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    login: storeLogin,
    register: storeRegister,
    logout: storeLogout,
    changePassword: storeChangePassword,
    clearError
  } = useAuthStore();
  
  /**
   * Đăng nhập và chuyển hướng đến trang trước đó hoặc trang chủ
   */
  const handleLoginWithRedirect = async (username, password) => {
    try {
      console.log('useAuth: Đăng nhập với chuyển hướng', { username });
      
      // Sử dụng login từ store
      await storeLogin(username, password);
      
      // Xử lý chuyển hướng sau khi đăng nhập thành công
      const { from } = location.state || { from: { pathname: '/' } };
      console.log('useAuth: Đăng nhập thành công, chuyển hướng đến', from);
      
      navigate(from, { replace: true });
      
      // Hiển thị thông báo thành công
      message.success('Đăng nhập thành công');
      
      return true;
    } catch (err) {
      console.error('useAuth: Lỗi đăng nhập với chuyển hướng', err);
      return false;
    }
  };
  
  /**
   * Đăng xuất và chuyển hướng đến trang đăng nhập
   */
  const logoutAndRedirect = () => {
    // Gọi hàm logout từ store
    storeLogout();
    
    // Chuyển hướng đến trang đăng nhập
    navigate('/login', { replace: true });
    
    // Hiển thị thông báo
    message.success('Đã đăng xuất thành công');
  };
  
  /**
   * Hook lifecycle để kiểm tra token khi component mount
   */
  useEffect(() => {
    // Kiểm tra token mỗi khi địa chỉ URL thay đổi
    const validateAuth = async () => {
      const isValid = authService.isAuthenticated();
      
      if (!isValid && token) {
        // Token không hợp lệ nhưng vẫn còn trong store
        // Thực hiện logout
        storeLogout();
      }
    };
    
    validateAuth();
  }, [location.pathname, storeLogout, token]);
  
  // Trả về tất cả các chức năng và trạng thái cần thiết
  return {
    user,
    isLoading,
    error,
    clearError,
    isAuthenticated: () => isAuthenticated(),
    login: storeLogin,
    register: storeRegister,
    changePassword: storeChangePassword,
    logout: logoutAndRedirect,
    handleLoginWithRedirect,
    hasPermission: (requiredRole) => {
      if (!user || !user.roles) return false;
      return user.roles.includes(requiredRole);
    }
  };
};

export default useAuth; 