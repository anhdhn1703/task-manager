import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';
import { parseJwt } from '../../services/api';
import authService from '../../services/authService';

const ProtectedRoute = ({ children, requiredRoles = [] }) => {
  const { isAuthenticated, loading, logout, user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: Kiểm tra xác thực cho đường dẫn:', location.pathname);
  console.log('ProtectedRoute: Trạng thái loading:', loading);

  // Kiểm tra token hết hạn
  useEffect(() => {
    const checkTokenExpiration = () => {
      const token = authService.getToken();
      
      if (!token) {
        console.log('ProtectedRoute: Không tìm thấy token');
        return;
      }
      
      console.log('ProtectedRoute: Kiểm tra token hết hạn');
      
      try {
        const decodedToken = parseJwt(token);
        if (decodedToken) {
          // Kiểm tra nếu token đã hết hạn (exp là timestamp hết hạn)
          const currentTime = Date.now() / 1000;
          const expirationTime = decodedToken.exp;
          const timeLeft = expirationTime - currentTime;
          
          console.log(`ProtectedRoute: Token còn hạn trong ${Math.floor(timeLeft / 60)} phút`);
          
          if (expirationTime && expirationTime < currentTime) {
            console.log('ProtectedRoute: Token đã hết hạn, đăng xuất người dùng');
            message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
            logout();
          }
        } else {
          console.log('ProtectedRoute: Không thể giải mã token');
        }
      } catch (error) {
        console.error('ProtectedRoute: Lỗi khi kiểm tra token:', error);
      }
    };

    checkTokenExpiration();
    // Kiểm tra token mỗi 5 phút
    const intervalId = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [logout, location.pathname]);

  // Hiển thị loading khi đang kiểm tra xác thực
  if (loading) {
    console.log('ProtectedRoute: Đang hiển thị loading spinner');
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        height: '100vh'
      }}>
        <Spin 
          indicator={<LoadingOutlined style={{ fontSize: 24 }} spin />} 
          tip="Đang kiểm tra xác thực..." 
        />
      </div>
    );
  }

  // Kiểm tra xác thực - gọi isAuthenticated như một hàm
  const authenticated = isAuthenticated();
  console.log('ProtectedRoute: Trạng thái xác thực:', authenticated);
  
  if (!authenticated) {
    console.log('ProtectedRoute: Chưa xác thực, chuyển hướng đến trang đăng nhập');
    // Lưu lại đường dẫn hiện tại để chuyển hướng sau khi đăng nhập
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Kiểm tra quyền
  if (requiredRoles.length > 0) {
    console.log('ProtectedRoute: Kiểm tra quyền cần thiết:', requiredRoles);
    
    const userRoles = user?.roles || [];
    console.log('ProtectedRoute: Quyền của người dùng:', userRoles);
    
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      console.log('ProtectedRoute: Không đủ quyền, chuyển hướng đến trang không có quyền');
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Người dùng đã đăng nhập và có quyền truy cập
  console.log('ProtectedRoute: Xác thực thành công, hiển thị nội dung được bảo vệ');
  return children;
};

export default ProtectedRoute; 