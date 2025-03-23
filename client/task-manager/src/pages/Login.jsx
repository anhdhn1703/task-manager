import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Card, Alert, Space } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { handleLoginWithRedirect, error: contextError, isAuthenticated } = useAuth();
  
  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Xử lý đăng nhập
  const onFinish = async (values) => {
    try {
      setLoading(true);
      setLocalError(null);
      
      // Ghi log dữ liệu đăng nhập để debug
      console.log('Login page - Dữ liệu đăng nhập:', {
        username: values.username,
        password: values.password ? '******' : 'không có mật khẩu'
      });
      
      // Gọi API đăng nhập từ AuthContext
      await handleLoginWithRedirect(values.username, values.password);
      
      console.log('Login page - Đăng nhập thành công');
    } catch (error) {
      console.error('Login page - Lỗi khi đăng nhập:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.response) {
        // Lỗi server có phản hồi
        const { status, data } = error.response;
        
        if (status === 401) {
          setLocalError('Tên đăng nhập hoặc mật khẩu không đúng.');
        } else if (status === 403) {
          setLocalError('Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.');
        } else if (data && data.message) {
          setLocalError(data.message);
        } else {
          setLocalError(`Lỗi máy chủ: ${status}`);
        }
      } else if (error.message && error.message.includes('Network Error')) {
        setLocalError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setLocalError(error.message || 'Đăng nhập thất bại. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị thông báo lỗi
  const errorMessage = localError || contextError;

  return (
    <div style={{ 
      maxWidth: '400px', 
      margin: '50px auto', 
      padding: '20px' 
    }}>
      <Card
        bordered={false}
        style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={2}>Đăng nhập</Title>
            <Text type="secondary">
              Quản lý công việc hiệu quả với Task Manager
            </Text>
          </div>
          
          {errorMessage && (
            <Alert
              message="Lỗi đăng nhập"
              description={errorMessage}
              type="error"
              showIcon
              closable
              onClose={() => setLocalError(null)}
            />
          )}
          
          <Form
            name="login"
            form={form}
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Tên đăng nhập" 
                size="large" 
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' }
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
                icon={<LoginOutlined />}
                loading={loading}
                block
                size="large"
              >
                Đăng nhập
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ textAlign: 'center' }}>
            <Text>
              Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Login; 