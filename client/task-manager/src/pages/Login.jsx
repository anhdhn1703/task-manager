import React, { useState, useCallback, memo, useEffect } from 'react';
import { Form, Input, Button, Card, Alert, Typography, Space } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title } = Typography;

const Login = memo(() => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [localError, setLocalError] = useState('');
  
  // Sử dụng hook auth mới
  const { 
    isLoading, 
    error: authError, 
    clearError, 
    handleLoginWithRedirect,
    isAuthenticated
  } = useAuth();
  
  const location = useLocation();
  
  // Nếu người dùng đã đăng nhập, chuyển hướng đến trang chính
  useEffect(() => {
    if (isAuthenticated()) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location.state]);

  // Xử lý form submit với useCallback để tránh tạo lại hàm mỗi khi render
  const onFinish = useCallback(async (values) => {
    try {
      setLocalError('');
      if (clearError) clearError();
      
      console.log('Login: Đang gửi yêu cầu đăng nhập:', {
        username: values.username
      });
      
      // Gọi hàm đăng nhập với chuyển hướng
      await handleLoginWithRedirect(values.username, values.password);
    } catch (error) {
      console.error('Login error:', error);
      setLocalError(error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin đăng nhập.');
    }
  }, [handleLoginWithRedirect, clearError]);

  // Hiển thị lỗi - ưu tiên lỗi cục bộ
  const errorMessage = localError || authError;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: '#f0f2f5'
    }}>
      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
          borderRadius: '8px'
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={2}>Đăng nhập</Title>
          <p>Đăng nhập vào Hệ thống Quản lý Công việc</p>
        </div>
        
        {errorMessage && (
          <Alert 
            message="Lỗi đăng nhập" 
            description={errorMessage} 
            type="error" 
            closable 
            style={{ marginBottom: 24 }}
            onClose={() => {
              setLocalError('');
              if (clearError) clearError();
            }}
          />
        )}
        
        <Form
          name="login"
          form={form}
          initialValues={{ remember: true }}
          onFinish={onFinish}
          autoComplete="off"
          layout="vertical"
        >
          <Form.Item
            name="username"
            rules={[
              { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
            ]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="Tên đăng nhập" 
              size="large"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Vui lòng nhập mật khẩu!' },
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="Mật khẩu" 
              size="large"
            />
          </Form.Item>

          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              loading={isLoading}
              size="large"
              style={{ width: '100%' }}
            >
              Đăng nhập
            </Button>
          </Form.Item>
        </Form>
        
        <div style={{ textAlign: 'center' }}>
          <Space>
            <span>Chưa có tài khoản?</span>
            <Link to="/register">Đăng ký ngay</Link>
          </Space>
        </div>
      </Card>
    </div>
  );
});

export default Login; 