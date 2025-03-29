import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Typography, Progress, Statistic, List, Tag, Button, Spin, message, Alert } from 'antd';
import { 
  ProjectOutlined, 
  CheckCircleOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined,
  RightOutlined,
  LoginOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Column } from '@ant-design/charts';
import { useAuth } from '../contexts/AuthContext';

import projectService from '../services/projectService';
import taskService from '../services/taskService';
import aiAssistantService from '../services/aiAssistantService';

const { Title, Text } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    upcomingDeadlines: 0
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [optimizedTasks, setOptimizedTasks] = useState([]);
  const [optimizationExplanation, setOptimizationExplanation] = useState('');
  const [tasksByStatus, setTasksByStatus] = useState([]);
  
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Kiểm tra xác thực trước khi gọi API
        if (!isAuthenticated()) {
          console.log('Dashboard: Người dùng chưa đăng nhập, không gọi API');
          setError('Vui lòng đăng nhập để xem bảng điều khiển');
          setLoading(false);
          return;
        }
        
        console.log('Dashboard: Đang lấy dữ liệu...');
        
        // Sử dụng Promise.all để gọi các API đồng thời
        const [projectsData, tasksData] = await Promise.all([
          projectService.getAllProjects(),
          taskService.getAllTasks()
        ]);
        
        console.log('Dashboard: Dữ liệu projects:', projectsData);
        console.log('Dashboard: Dữ liệu tasks:', tasksData);
        
        // Chi tiết hơn về cấu trúc
        if (!Array.isArray(projectsData)) {
          console.error('Dashboard: projectsData không phải là mảng!', { 
            type: typeof projectsData,
            value: projectsData
          });
        }
        
        if (!Array.isArray(tasksData)) {
          console.error('Dashboard: tasksData không phải là mảng!', { 
            type: typeof tasksData,
            value: tasksData
          });
        }
        
        // Đảm bảo dữ liệu là mảng
        const projects = Array.isArray(projectsData) ? projectsData : [];
        const tasks = Array.isArray(tasksData) ? tasksData : [];
        
        // Tính toán số liệu thống kê
        const totalProjects = projects.length;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
        
        // Đếm công việc sắp đến hạn hoặc trễ hạn
        const upcomingDeadlines = tasks.filter(
          task => (task.dueStatus === 'DUE_SOON' || task.dueStatus === 'OVERDUE') && task.status !== 'COMPLETED'
        ).length;
        
        setStats({
          totalProjects,
          totalTasks,
          completedTasks,
          upcomingDeadlines
        });
        
        // Xử lý dữ liệu biểu đồ (số lượng công việc theo trạng thái)
        const statusGroups = {};
        tasks.forEach(task => {
          if (!statusGroups[task.status]) {
            statusGroups[task.status] = 0;
          }
          statusGroups[task.status]++;
        });
        
        setTasksByStatus(Object.entries(statusGroups).map(([status, count]) => ({
          status: getStatusText(status),
          count
        })));
        
        // Các dự án gần đây (5 dự án mới nhất)
        const sortedProjects = [...projects].sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );
        setRecentProjects(sortedProjects.slice(0, 5));
        
        // Công việc sắp đến hạn
        const upcomingTasksList = tasks
          .filter(task => (task.dueStatus === 'DUE_SOON' || task.dueStatus === 'OVERDUE') && task.status !== 'COMPLETED')
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);
        setUpcomingTasks(upcomingTasksList);
        
        // Đề xuất tối ưu hóa công việc dựa trên ưu tiên và deadline
        const now = new Date();
        const optimizationCandidates = tasks
          .filter(task => task.status !== 'COMPLETED' && task.dueDate)
          .sort((a, b) => {
            // Ưu tiên các việc trễ hạn
            if (a.dueStatus === 'OVERDUE' && b.dueStatus !== 'OVERDUE') return -1;
            if (a.dueStatus !== 'OVERDUE' && b.dueStatus === 'OVERDUE') return 1;
            
            // Sau đó đến các việc sắp đến hạn
            if (a.dueStatus === 'DUE_SOON' && b.dueStatus !== 'DUE_SOON') return -1;
            if (a.dueStatus !== 'DUE_SOON' && b.dueStatus === 'DUE_SOON') return 1;
            
            // Ưu tiên cao hơn trước
            const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
              return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            
            // Thời gian gần hơn trước
            return new Date(a.dueDate) - new Date(b.dueDate);
          })
          .slice(0, 5);
        
        setOptimizedTasks(optimizationCandidates);
        
        if (optimizationCandidates.length > 0) {
          let explanation = "Dựa trên phân tích công việc của bạn, tôi đề xuất bạn nên tập trung vào các công việc sau đây ";
          
          const overdueTasks = optimizationCandidates.filter(task => task.dueStatus === 'OVERDUE').length;
          const dueSoonTasks = optimizationCandidates.filter(task => task.dueStatus === 'DUE_SOON').length;
          
          if (overdueTasks > 0) {
            explanation += `(có ${overdueTasks} công việc đã trễ hạn`;
            if (dueSoonTasks > 0) {
              explanation += ` và ${dueSoonTasks} công việc sắp đến hạn)`;
            } else {
              explanation += ')';
            }
          } else if (dueSoonTasks > 0) {
            explanation += `(có ${dueSoonTasks} công việc sắp đến hạn)`;
          }
          
          setOptimizationExplanation(explanation);
        } else {
          setOptimizationExplanation("Không có công việc nào cần được ưu tiên vào lúc này.");
        }
        
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
        if (error.response && error.response.status === 401) {
          setError('Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.');
        } else if (error.message && error.message.includes('Network Error')) {
          setError('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
        } else {
          setError('Không thể tải dữ liệu bảng điều khiển. Vui lòng thử lại sau.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [isAuthenticated]);

  const getStatusTag = (status) => {
    const statusMap = {
      'NOT_STARTED': { color: 'default', text: 'Chưa bắt đầu' },
      'IN_PROGRESS': { color: 'processing', text: 'Đang thực hiện' },
      'COMPLETED': { color: 'success', text: 'Hoàn thành' },
      'ON_HOLD': { color: 'warning', text: 'Tạm dừng' }
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
  };

  const getPriorityTag = (priority) => {
    const priorityMap = {
      'LOW': { color: 'success', text: 'Thấp' },
      'MEDIUM': { color: 'blue', text: 'Trung bình' },
      'HIGH': { color: 'warning', text: 'Cao' },
      'URGENT': { color: 'error', text: 'Khẩn cấp' }
    };
    
    const priorityInfo = priorityMap[priority] || { color: 'default', text: priority };
    return <Tag color={priorityInfo.color}>{priorityInfo.text}</Tag>;
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'NOT_STARTED': return 'Chưa bắt đầu';
      case 'IN_PROGRESS': return 'Đang thực hiện';
      case 'COMPLETED': return 'Hoàn thành';
      case 'ON_HOLD': return 'Tạm dừng';
      default: return status;
    }
  };
  
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'URGENT': return 'Khẩn cấp';
      case 'HIGH': return 'Cao';
      case 'MEDIUM': return 'Trung bình';
      case 'LOW': return 'Thấp';
      default: return priority;
    }
  };
  
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return 'red';
      case 'HIGH': return 'orange';
      case 'MEDIUM': return 'blue';
      case 'LOW': return 'green';
      default: return 'default';
    }
  };

  const config = {
    data: tasksByStatus,
    xField: 'status',
    yField: 'count',
    label: {
      position: 'top',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    meta: {
      status: { alias: 'Trạng thái' },
      count: { alias: 'Số lượng' },
    },
    color: ({ status }) => {
      const colorMap = {
        'Chưa bắt đầu': '#bfbfbf',
        'Đang thực hiện': '#1677ff',
        'Hoàn thành': '#52c41a',
        'Tạm dừng': '#faad14'
      };
      return colorMap[status] || '#1677ff';
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Đang tải dữ liệu...</p>
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

  return (
    <div>
      <Title level={3}>Tổng quan</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Dự án"
              value={stats.totalProjects}
              prefix={<ProjectOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Công việc"
              value={stats.totalTasks}
              prefix={<CheckCircleOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Hoàn thành"
              value={stats.completedTasks}
              suffix={stats.totalTasks > 0 ? `/ ${stats.totalTasks}` : ''}
              prefix={<CheckCircleOutlined style={{ color: '#52c41a' }} />}
            />
            <Progress 
              percent={stats.totalTasks > 0 ? Math.round(stats.completedTasks / stats.totalTasks * 100) : 0} 
              status="active" 
              size="small" 
              style={{ marginTop: 10 }} 
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Sắp đến hạn"
              value={stats.upcomingDeadlines}
              prefix={<ClockCircleOutlined style={{ color: stats.upcomingDeadlines > 0 ? '#faad14' : undefined }} />}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card title="Công việc theo trạng thái" bordered={false}>
            <Column {...config} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title={
              <span>
                <ExclamationCircleOutlined style={{ marginRight: 8, color: '#1677ff' }} />
                Đề xuất từ AI
              </span>
            } 
            bordered={false}
          >
            <Text type="secondary">{optimizationExplanation}</Text>
            <List
              style={{ marginTop: 16 }}
              size="small"
              bordered
              dataSource={optimizedTasks}
              renderItem={item => (
                <List.Item>
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <Text strong>{item.title}</Text>
                      <div>
                        {getPriorityTag(item.priority)}
                        {getStatusTag(item.status)}
                        {item.dueStatus === 'OVERDUE' && item.status !== 'COMPLETED' && <Tag color="red">Trễ hạn</Tag>}
                        {item.dueStatus === 'DUE_SOON' && item.status !== 'COMPLETED' && <Tag color="orange">Sắp đến hạn</Tag>}
                      </div>
                    </div>
                    <Button 
                      type="link" 
                      icon={<RightOutlined />} 
                      onClick={() => navigate(`/tasks/${item.id}`)}
                    />
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: 'Không có công việc' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 20 }}>
        <Col xs={24} md={12}>
          <Card 
            title="Dự án gần đây" 
            bordered={false}
            extra={<Button type="link" onClick={() => navigate('/projects')}>Xem tất cả</Button>}
          >
            <List
              size="small"
              bordered
              dataSource={recentProjects}
              renderItem={item => (
                <List.Item>
                  <div style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                    <div style={{ flex: 1 }}>
                      <Text strong>{item.name}</Text>
                      <div>
                        <Text type="secondary">{item.tasks?.length || 0} công việc</Text>
                      </div>
                    </div>
                    <Button 
                      type="link" 
                      icon={<RightOutlined />} 
                      onClick={() => navigate(`/projects/${item.id}`)}
                    />
                  </div>
                </List.Item>
              )}
              locale={{ emptyText: 'Không có dự án' }}
            />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card 
            title="Công việc sắp đến hạn" 
            bordered={false}
            extra={<Button type="link" onClick={() => navigate('/tasks')}>Xem tất cả</Button>}
          >
            <List
              dataSource={upcomingTasks}
              renderItem={(task) => (
                <List.Item
                  extra={
                    <Button type="link" onClick={() => navigate(`/tasks/${task.id}`)}>
                      Xem
                    </Button>
                  }
                >
                  <List.Item.Meta
                    title={<div style={{ display: 'flex', alignItems: 'center' }}>
                      {task.title}
                      {task.dueStatus === 'OVERDUE' && task.status !== 'COMPLETED' && (
                        <Tag color="red" style={{ marginLeft: 8 }}>Trễ hạn</Tag>
                      )}
                      {task.dueStatus === 'DUE_SOON' && task.status !== 'COMPLETED' && (
                        <Tag color="orange" style={{ marginLeft: 8 }}>Sắp đến hạn</Tag>
                      )}
                      <Tag color={getPriorityColor(task.priority)} style={{ marginLeft: 8 }}>
                        {getPriorityText(task.priority)}
                      </Tag>
                    </div>}
                    description={`Hạn: ${new Date(task.dueDate).toLocaleDateString('vi-VN')}`}
                  />
                </List.Item>
              )}
              locale={{ emptyText: "Không có công việc sắp đến hạn" }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard; 