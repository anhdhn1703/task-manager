import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Row, Col } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';

const { Title, Text } = Typography;

const ChangePassword = () => {
  const { changePassword, loading, user } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isExpiredPassword, setIsExpiredPassword] = useState(false);

  // Kiểm tra nếu mật khẩu đã hết hạn
  useEffect(() => {
    const checkPasswordStatus = () => {
      // Kiểm tra từ người dùng hiện tại
      if (user && user.passwordExpired) {
        setIsExpiredPassword(true);
      }
      
      // Kiểm tra từ query param nếu được chuyển hướng từ trang đăng nhập
      const params = new URLSearchParams(location.search);
      if (params.get('expired') === 'true') {
        setIsExpiredPassword(true);
      }
    };
    
    checkPasswordStatus();
  }, [user, location]);

  const onFinish = async (values) => {
    try {
      console.log('Đang gửi yêu cầu đổi mật khẩu...');
      setError('');
      setSuccess(false);
      
      const { oldPassword, newPassword, username } = values;
      
      let result;
      
      // Sử dụng API khác cho mật khẩu hết hạn
      if (isExpiredPassword) {
        try {
          // Gọi API đổi mật khẩu đã hết hạn
          const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/auth/change-expired-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authService.getToken()}`
            },
            body: JSON.stringify({
              username: username || user.username,
              newPassword: newPassword
            })
          });
          
          const data = await response.json();
          
          if (!data.success) {
            throw new Error(data.message || 'Không thể đổi mật khẩu');
          }
          
          // Cập nhật token mới nếu có
          if (data.data && data.data.token) {
            localStorage.setItem('auth_token', data.data.token);
            if (data.data.refreshToken) {
              localStorage.setItem('refresh_token', data.data.refreshToken);
            }
          }
          
          result = true;
        } catch (err) {
          console.error('Đổi mật khẩu hết hạn thất bại:', err);
          throw err;
        }
      } else {
        // Đổi mật khẩu thông thường
        result = await changePassword(oldPassword, newPassword);
      }
      
      if (result) {
        setSuccess(true);
        form.resetFields();
        // Chuyển hướng về trang chính sau 2 giây
        setTimeout(() => {
          navigate('/');
        }, 2000);
      }
    } catch (err) {
      console.error('Đổi mật khẩu thất bại:', err);
      
      if (err.response) {
        setError(`Lỗi: ${err.response.data?.message || 'Không thể đổi mật khẩu'}`);
      } else if (err.request) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError(err.message || 'Đã xảy ra lỗi khi đổi mật khẩu');
      }
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '80vh' }}>
      <Col xs={22} sm={16} md={12} lg={8} xl={6}>
        <Card bordered={false}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2}>Đổi mật khẩu</Title>
            {isExpiredPassword ? (
              <Text type="warning" strong>Mật khẩu của bạn đã hết hạn. Vui lòng đặt mật khẩu mới để tiếp tục.</Text>
            ) : (
              <Text type="secondary">Vui lòng nhập mật khẩu cũ và mật khẩu mới</Text>
            )}
          </div>

          {error && (
            <Alert 
              message="Lỗi" 
              description={error} 
              type="error" 
              showIcon 
              style={{ marginBottom: 24 }}
              closable
              onClose={() => setError('')}
            />
          )}

          {success && (
            <Alert 
              message="Thành công" 
              description="Mật khẩu đã được đổi thành công. Đang chuyển hướng..." 
              type="success" 
              showIcon 
              style={{ marginBottom: 24 }}
            />
          )}

          <Form
            form={form}
            name="changePassword"
            onFinish={onFinish}
            layout="vertical"
          >
            {/* Hiển thị trường nhập username nếu đổi mật khẩu hết hạn */}
            {isExpiredPassword && !user && (
              <Form.Item
                name="username"
                rules={[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]}
              >
                <Input
                  placeholder="Tên đăng nhập"
                  size="large"
                />
              </Form.Item>
            )}
            
            {/* Hiển thị trường mật khẩu cũ chỉ khi không phải đổi mật khẩu đã hết hạn */}
            {!isExpiredPassword && (
              <Form.Item
                name="oldPassword"
                rules={[{ required: true, message: 'Vui lòng nhập mật khẩu cũ!' }]}
              >
                <Input.Password
                  prefix={<LockOutlined />}
                  placeholder="Mật khẩu cũ"
                  size="large"
                />
              </Form.Item>
            )}

            <Form.Item
              name="newPassword"
              rules={[
                { required: true, message: 'Vui lòng nhập mật khẩu mới!' },
                { min: 6, message: 'Mật khẩu phải có ít nhất 6 ký tự!' },
              ]}
              hasFeedback
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Mật khẩu mới"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              dependencies={['newPassword']}
              hasFeedback
              rules={[
                { required: true, message: 'Vui lòng xác nhận mật khẩu mới!' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('Mật khẩu xác nhận không khớp!'));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Xác nhận mật khẩu mới"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large"
                loading={loading}
                disabled={success}
              >
                Đổi mật khẩu
              </Button>
            </Form.Item>

            {!isExpiredPassword && (
              <Form.Item>
                <Button 
                  type="default" 
                  block 
                  size="large"
                  onClick={() => navigate('/')}
                >
                  Quay lại
                </Button>
              </Form.Item>
            )}
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default ChangePassword; 