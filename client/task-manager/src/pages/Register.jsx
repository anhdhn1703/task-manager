import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Typography, Card, Alert, Space } from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  MailOutlined, 
  UserAddOutlined 
} from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const { register, error: contextError, isAuthenticated, clearError } = useAuth();
  
  // Kiểm tra xem người dùng đã đăng nhập chưa
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  // Xử lý đăng ký
  const onFinish = async (values) => {
    try {
      setLoading(true);
      setLocalError(null);
      
      const { username, email, password } = values;
      
      // Ghi log dữ liệu đăng ký để debug
      console.log('Register page - Dữ liệu đăng ký:', {
        username,
        email,
        password: password ? '******' : 'không có mật khẩu'
      });
      
      // Kiểm tra 2 mật khẩu có khớp nhau không
      if (values.password !== values.confirmPassword) {
        setLocalError('Xác nhận mật khẩu không khớp với mật khẩu đã nhập');
        return;
      }
      
      // Gọi API đăng ký từ AuthContext
      const success = await register(username, email, password);
      
      if (success) {
        console.log('Register page - Đăng ký thành công');
        
        // Hiển thị thông báo thành công và chuyển về trang đăng nhập
        // Chuyển hướng được xử lý bởi register function trong AuthContext
      }
    } catch (error) {
      console.error('Register page - Lỗi khi đăng ký:', error);
      
      // Xử lý các loại lỗi khác nhau
      if (error.response) {
        // Lỗi server có phản hồi
        const { status, data } = error.response;
        
        if (status === 400) {
          if (data.message && data.message.includes('username')) {
            setLocalError('Tên đăng nhập đã tồn tại. Vui lòng chọn tên khác.');
          } else if (data.message && data.message.includes('email')) {
            setLocalError('Email đã được sử dụng. Vui lòng sử dụng email khác.');
          } else if (data.message) {
            setLocalError(data.message);
          } else {
            setLocalError('Dữ liệu đăng ký không hợp lệ. Vui lòng kiểm tra lại.');
          }
        } else {
          setLocalError(`Lỗi máy chủ: ${status}. Vui lòng thử lại sau.`);
        }
      } else if (error.message && error.message.includes('Network Error')) {
        setLocalError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setLocalError(error.message || 'Đăng ký thất bại. Vui lòng thử lại sau.');
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
            <Title level={2}>Đăng ký tài khoản</Title>
            <Text type="secondary">
              Tạo tài khoản để sử dụng Task Manager
            </Text>
          </div>
          
          {errorMessage && (
            <Alert
              message="Lỗi đăng ký"
              description={errorMessage}
              type="error"
              showIcon
              closable
              onClose={() => {
                setLocalError(null);
                if (clearError) clearError();
              }}
            />
          )}
          
          <Form
            name="register"
            form={form}
            onFinish={onFinish}
            autoComplete="off"
            layout="vertical"
          >
            <Form.Item
              name="username"
              rules={[
                { required: true, message: 'Vui lòng nhập tên đăng nhập!' },
                { min: 3, message: 'Tên đăng nhập phải có ít nhất 3 ký tự!' },
                { max: 20, message: 'Tên đăng nhập không được quá 20 ký tự!' },
                { 
                  pattern: /^[a-zA-Z0-9_]+$/, 
                  message: 'Tên đăng nhập chỉ được chứa chữ cái, số và dấu gạch dưới!' 
                }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="Tên đăng nhập" 
                size="large" 
              />
            </Form.Item>
            
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Vui lòng nhập email!' },
                { type: 'email', message: 'Email không hợp lệ!' }
              ]}
            >
              <Input 
                prefix={<MailOutlined />} 
                placeholder="Email" 
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
            
            <Form.Item
              name="confirmPassword"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                })
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="Xác nhận mật khẩu" 
                size="large" 
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<UserAddOutlined />}
                loading={loading}
                block
                size="large"
              >
                Đăng ký
              </Button>
            </Form.Item>
          </Form>
          
          <div style={{ textAlign: 'center' }}>
            <Text>
              Đã có tài khoản? <Link to="/login">Đăng nhập</Link>
            </Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default Register; 