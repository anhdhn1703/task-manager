import React, { useState, useEffect } from 'react';
import { 
  Card, Button, Table, Tag, Space, Modal, Form, Input, 
  DatePicker, Select, message, Typography, Row, Col, 
  Popover, Badge, Dropdown, Tooltip, Spin, Alert 
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  FilterOutlined, 
  CalendarOutlined,
  ProjectOutlined,
  PriorityHighOutlined,
  CheckCircleOutlined,
  LoginOutlined
} from '@ant-design/icons';
import moment from 'moment';
import taskService from '../services/taskService';
import projectService from '../services/projectService';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const { Title, Text } = Typography;
const { Option } = Select;
const { confirm } = Modal;
const { TextArea } = Input;

const Tasks = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: null,
    priority: null,
    projectId: null
  });
  
  const [form] = Form.useForm();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Kiểm tra xác thực trước khi gọi API
      if (!isAuthenticated()) {
        console.log('Tasks: Người dùng chưa đăng nhập, không gọi API');
        setError('Vui lòng đăng nhập để xem danh sách công việc');
        setLoading(false);
        return;
      }
      
      const [tasksData, projectsData] = await Promise.all([
        taskService.getTasks(),
        projectService.getProjects()
      ]);
      
      setTasks(tasksData);
      setProjects(projectsData);
    } catch (error) {
      console.error("Error fetching data:", error);
      if (error.response && error.response.status === 401) {
        setError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
      } else if (error.message && error.message.includes('Network Error')) {
        setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      } else {
        setError('Không thể tải danh sách công việc. Vui lòng thử lại sau.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAuthenticated]);

  // ... phần code còn lại giữ nguyên

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Đang tải dữ liệu công việc...</p>
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