import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, Alert, Row, Col } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const { Title, Text } = Typography;

const ChangePassword = () => {
  const { changePassword, loading } = useAuth();
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const onFinish = async (values) => {
    try {
      console.log('Đang gửi yêu cầu đổi mật khẩu...');
      setError('');
      setSuccess(false);
      
      const result = await changePassword(values);
      
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
            <Text type="secondary">Vui lòng nhập mật khẩu cũ và mật khẩu mới</Text>
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
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default ChangePassword; 