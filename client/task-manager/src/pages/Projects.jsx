import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Tag, Space, Modal, Form, Input, 
  DatePicker, Select, message, Typography, Tooltip, Spin, Alert } from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  ExclamationCircleOutlined,
  TeamOutlined,
  CalendarOutlined,
  LoginOutlined
} from '@ant-design/icons';
import moment from 'moment';
import projectService from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;
const { Option } = Select;
const { confirm } = Modal;

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kiểm tra xác thực trước khi gọi API
      if (!isAuthenticated()) {
        console.log('Projects: Người dùng chưa đăng nhập, không gọi API');
        setError('Vui lòng đăng nhập để xem danh sách dự án');
        setLoading(false);
        return;
      }
      
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
      if (error.response && error.response.status === 401) {
        setError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.message && error.message.includes('Network Error')) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Không thể tải danh sách dự án. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [isAuthenticated]);

  // ... phần code còn lại giữ nguyên

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Đang tải dữ liệu dự án...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <Alert
          message="Lỗi tải dữ liệu"
          description={
            <div>
              <p>{error}</p>
              {error.includes('đăng nhập') && (
                <Button 
                  type="primary" 
                  icon={<LoginOutlined />} 
                  onClick={() => navigate('/login')}
                  style={{ marginTop: 16 }}
                >
                  Đăng nhập
                </Button>
              )}
            </div>
          }
          type="error"
          showIcon
        />
      </div>
    );
  }
} 