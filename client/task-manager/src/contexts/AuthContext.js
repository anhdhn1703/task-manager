import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import authService from '../services/authService';
import { message } from 'antd';

// Tạo context
const AuthContext = createContext(null);

// Hook sử dụng context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      try {
        console.log("AuthContext: Đang khởi tạo trạng thái xác thực");
        const savedUser = authService.getCurrentUser();
        
        if (savedUser) {
          console.log("AuthContext: Người dùng đã đăng nhập trước đó:", 
            savedUser.username || 'không có username');
          
          // Đảm bảo token vẫn hợp lệ
          const isValid = await authService.validateToken();
          
          if (isValid) {
            setUser(savedUser);
            console.log("AuthContext: Token hợp lệ, đã khôi phục trạng thái đăng nhập");
          } else {
            console.log("AuthContext: Token không hợp lệ, xóa dữ liệu người dùng");
            authService.logout();
            setUser(null);
          }
        } else {
          console.log("AuthContext: Không tìm thấy thông tin người dùng đã lưu");
          setUser(null);
        }
      } catch (err) {
        console.error("AuthContext - Lỗi khi khởi tạo xác thực:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username, password) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`AuthContext: Đang đăng nhập với username: ${username}`);
      
      // Log trước khi gọi service để theo dõi
      console.log('AuthContext: Chuẩn bị gọi authService.login');
      
      const response = await authService.login(username, password);
      
      // Log chi tiết phản hồi để kiểm tra cấu trúc dữ liệu
      console.log("AuthContext: Phản hồi đăng nhập:", JSON.stringify(response));
      console.log("AuthContext: Chi tiết phản hồi:", {
        token: response?.token ? 'Có token' : 'Không có token', 
        refreshToken: response?.refreshToken ? 'Có refresh token' : 'Không có refresh token',
        user: response?.user ? 'Có dữ liệu user' : 'Không có dữ liệu user'
      });
      
      // Kiểm tra xem phản hồi có chứa dữ liệu hợp lệ không
      if (!response || !response.token) {
        console.error('AuthContext: Phản hồi không hợp lệ, không có token', response);
        throw new Error('Phản hồi từ máy chủ không có token. Vui lòng thử lại hoặc liên hệ quản trị viên.');
      }
      
      // Tạo đối tượng user từ phản hồi
      let userData = response.user;
      
      // Kiểm tra và thiết lập thông tin người dùng
      if (userData) {
        setUser(userData);
        
        // Kiểm tra thông tin mật khẩu hết hạn
        if (userData.passwordExpired) {
          message.warning('Mật khẩu của bạn đã hết hạn. Vui lòng đổi mật khẩu ngay!', 10);
          // Có thể chuyển hướng đến trang đổi mật khẩu
          // navigate('/change-password');
        } else if (userData.daysUntilPasswordExpiry && userData.daysUntilPasswordExpiry <= 15) {
          message.info(`Mật khẩu của bạn sẽ hết hạn trong ${userData.daysUntilPasswordExpiry} ngày.`, 5);
        }
        
        // Hiển thị thông báo thành công
        const displayName = userData.fullName || userData.username || 'Người dùng';
        message.success(`Chào mừng ${displayName} đã quay trở lại!`);
        
        console.log("AuthContext: Đăng nhập thành công, đã thiết lập user:", userData);
        
        return userData;
      } else {
        console.error('AuthContext: Không có thông tin người dùng trong phản hồi', response);
        throw new Error('Không tìm thấy thông tin người dùng trong phản hồi');
      }
    } catch (err) {
      console.error("AuthContext - Lỗi đăng nhập:", err);
      let errorMessage = 'Đăng nhập thất bại';
      
      if (err.response) {
        // Lỗi từ máy chủ với phản hồi
        if (err.response.status === 401) {
          errorMessage = 'Tên đăng nhập hoặc mật khẩu không đúng';
        } else if (err.response.status === 429) {
          // Xử lý đặc biệt cho lỗi rate limit
          errorMessage = 'Quá nhiều yêu cầu, hãy thử lại sau.';
          
          // Trích xuất thông báo từ phản hồi nếu có
          if (err.response.data) {
            if (typeof err.response.data === 'string') {
              try {
                const data = JSON.parse(err.response.data);
                if (data.message) {
                  errorMessage = data.message;
                }
              } catch (e) {
                console.error('Không thể phân tích dữ liệu JSON từ lỗi:', e);
              }
            } else if (err.response.data.message) {
              errorMessage = err.response.data.message;
            }
          }
        } else if (err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Lỗi máy chủ: ${err.response.status}`;
        }
      } else if (err.message) {
        // Lỗi từ request hoặc xử lý
        errorMessage = err.message;
        
        if (err.message.includes('Network Error')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        }
      }
      
      setError(errorMessage);
      message.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithRedirect = async (username, password) => {
    console.log("AuthContext: Đăng nhập với chuyển hướng");
    const user = await login(username, password);
    
    if (user) {
      // Lấy địa chỉ chuyển hướng từ location state hoặc mặc định về trang chủ
      const from = location.state?.from?.pathname || "/";
      
      // Nếu mật khẩu đã hết hạn, không tự động chuyển hướng
      // hàm gọi sẽ xử lý việc chuyển hướng đến trang đổi mật khẩu
      if (!user.passwordExpired) {
        console.log(`AuthContext: Chuyển hướng đến ${from} sau khi đăng nhập`);
        navigate(from, { replace: true });
      }
      
      return user;
    }
    
    return null;
  };

  const register = async (username, email, password) => {
    setLoading(true);
    setError(null);
    try {
      console.log(`AuthContext: Đang đăng ký tài khoản mới với username: ${username}`);
      const response = await authService.register(username, email, password);
      
      if (response && response.success) {
        message.success('Đăng ký thành công! Vui lòng đăng nhập.');
        navigate('/login');
        return true;
      } else {
        throw new Error('Đăng ký thất bại');
      }
    } catch (err) {
      console.error("AuthContext - Lỗi đăng ký:", err);
      let errorMessage = 'Đăng ký thất bại';
      
      if (err.response) {
        if (err.response.status === 429) {
          // Xử lý đặc biệt cho lỗi rate limit
          errorMessage = 'Quá nhiều yêu cầu, hãy thử lại sau.';
          
          // Trích xuất thông báo từ phản hồi nếu có
          if (err.response.data) {
            if (typeof err.response.data === 'string') {
              try {
                const data = JSON.parse(err.response.data);
                if (data.message) {
                  errorMessage = data.message;
                }
              } catch (e) {
                console.error('Không thể phân tích dữ liệu JSON từ lỗi:', e);
              }
            } else if (err.response.data.message) {
              errorMessage = err.response.data.message;
            }
          }
        } else if (err.response.status === 400 && err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else {
          errorMessage = `Lỗi máy chủ: ${err.response.status}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
        
        if (err.message.includes('Network Error')) {
          errorMessage = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.';
        }
      }
      
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    console.log("AuthContext: Đăng xuất người dùng");
    authService.logout();
    setUser(null);
    
    // Xóa tất cả dữ liệu trong localStorage để đảm bảo không còn dữ liệu của người dùng trước đó
    console.log("AuthContext: Xóa tất cả dữ liệu trong localStorage");
    localStorage.clear();
    
    // Chuyển hướng về trang đăng nhập
    navigate('/login');
    
    // Tải lại trang để đảm bảo mọi dữ liệu đều được xóa sạch
    console.log("AuthContext: Tải lại trang để xóa dữ liệu còn trong bộ nhớ");
    window.location.reload();
  };

  const changePassword = async (oldPassword, newPassword) => {
    setLoading(true);
    setError(null);
    try {
      console.log("AuthContext: Đang thay đổi mật khẩu");
      const response = await authService.changePassword(oldPassword, newPassword);
      
      if (response && response.success) {
        message.success('Đổi mật khẩu thành công!');
        return true;
      } else {
        throw new Error('Đổi mật khẩu thất bại');
      }
    } catch (err) {
      console.error("AuthContext - Lỗi đổi mật khẩu:", err);
      let errorMessage = 'Đổi mật khẩu thất bại';
      
      if (err.response) {
        if (err.response.status === 429) {
          // Xử lý đặc biệt cho lỗi rate limit
          errorMessage = 'Quá nhiều yêu cầu, hãy thử lại sau.';
          
          // Trích xuất thông báo từ phản hồi nếu có
          if (err.response.data) {
            if (typeof err.response.data === 'string') {
              try {
                const data = JSON.parse(err.response.data);
                if (data.message) {
                  errorMessage = data.message;
                }
              } catch (e) {
                console.error('Không thể phân tích dữ liệu JSON từ lỗi:', e);
              }
            } else if (err.response.data.message) {
              errorMessage = err.response.data.message;
            }
          }
        } else if (err.response.status === 400 && err.response.data && err.response.data.message) {
          errorMessage = err.response.data.message;
        } else if (err.response.status === 401) {
          errorMessage = 'Mật khẩu hiện tại không chính xác';
        } else {
          errorMessage = `Lỗi máy chủ: ${err.response.status}`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      message.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const isAuthenticated = () => {
    return !!user && authService.hasValidToken();
  };

  const hasPermission = (requiredRole) => {
    if (!user || !user.roles) return false;
    return user.roles.includes(requiredRole);
  };

  const value = {
    user,
    loading,
    error,
    login,
    handleLoginWithRedirect,
    register,
    logout,
    changePassword,
    isAuthenticated,
    hasPermission,
    clearError: () => setError(null)
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 