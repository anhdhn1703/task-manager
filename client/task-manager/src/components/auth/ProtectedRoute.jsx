import React, { useEffect, memo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Spin, message } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import { useAuth } from '../../contexts/AuthContext';

const ProtectedRoute = memo(({ children, requiredRoles = [] }) => {
  const { 
    isLoading, 
    isAuthenticated, 
    user, 
    logout 
  } = useAuth();
  
  const location = useLocation();

  console.log('ProtectedRoute: Kiểm tra xác thực cho đường dẫn:', location.pathname);

  // Kiểm tra token hết hạn
  useEffect(() => {
    const checkTokenExpiration = () => {
      if (!isAuthenticated()) {
        console.log('ProtectedRoute: Token không hợp lệ, đăng xuất người dùng');
        message.error('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        logout();
      }
    };

    // Kiểm tra token khi component mount và mỗi 5 phút
    checkTokenExpiration();
    const intervalId = setInterval(checkTokenExpiration, 5 * 60 * 1000);
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated, logout]);

  // Hiển thị loading khi đang kiểm tra xác thực
  if (isLoading) {
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

  // Kiểm tra xác thực
  if (!isAuthenticated()) {
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
});

export default ProtectedRoute; 