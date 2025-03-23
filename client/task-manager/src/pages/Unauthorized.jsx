import React from 'react';
import { Button, Result } from 'antd';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center',
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Result
        status="403"
        title="Không có quyền truy cập"
        subTitle="Xin lỗi, bạn không có quyền truy cập vào trang này."
        extra={[
          <Button type="primary" key="dashboard">
            <Link to="/">Quay lại trang chủ</Link>
          </Button>,
          <Button key="login">
            <Link to="/login">Đăng nhập với tài khoản khác</Link>
          </Button>,
        ]}
      />
    </div>
  );
};

export default Unauthorized; 