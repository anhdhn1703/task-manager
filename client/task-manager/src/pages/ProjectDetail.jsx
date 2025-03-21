import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card,
  Typography,
  Button,
  Space,
  Tabs,
  Progress,
  Statistic,
  Row,
  Col,
  Table,
  Tag,
  Modal,
  Form,
  Input,
  DatePicker,
  Select,
  Divider,
  Spin,
  message,
  Popconfirm,
  Badge
} from 'antd';
import {
  ArrowLeftOutlined,
  EditOutlined,
  DeleteOutlined,
  PlusOutlined,
  CheckOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import moment from 'moment';
import 'moment/locale/vi';
import locale from 'antd/lib/date-picker/locale/vi_VN';

import projectService from '../services/projectService';
import taskService from '../services/taskService';
import tagService from '../services/tagService';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [editProjectModalVisible, setEditProjectModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  
  const [projectForm] = Form.useForm();
  const [taskForm] = Form.useForm();

  useEffect(() => {
    fetchProjectData();
    fetchTags();
  }, [id]);

  const fetchProjectData = async () => {
    try {
      setLoading(true);
      
      const projectData = await projectService.getProjectById(id);
      setProject(projectData);
      
      const tasksData = await taskService.getTasksByProjectId(id);
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching project data:", error);
      message.error("Không thể tải thông tin dự án");
    } finally {
      setLoading(false);
    }
  };

  const fetchTags = async () => {
    try {
      const tagsData = await tagService.getAllTags();
      setTags(tagsData);
    } catch (error) {
      console.error("Error fetching tags:", error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Đang tải dữ liệu dự án...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Text type="danger">Không tìm thấy dự án hoặc dự án đã bị xóa.</Text>
        <br />
        <Button 
          type="primary" 
          onClick={() => navigate('/projects')}
          style={{ marginTop: '20px' }}
        >
          Quay lại danh sách dự án
        </Button>
      </div>
    );
  }

  // Tính toán thống kê
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
  
  const tasksByStatus = {
    'NOT_STARTED': tasks.filter(task => task.status === 'NOT_STARTED').length,
    'IN_PROGRESS': tasks.filter(task => task.status === 'IN_PROGRESS').length,
    'COMPLETED': completedTasks,
    'ON_HOLD': tasks.filter(task => task.status === 'ON_HOLD').length
  };
  
  const upcomingDeadlines = tasks.filter(task => {
    if (task.status === 'COMPLETED') return false;
    return task.dueStatus === 'DUE_SOON' || task.dueStatus === 'OVERDUE';
  }).length;

  // Xử lý chỉnh sửa dự án
  const showEditProjectModal = () => {
    projectForm.setFieldsValue({
      name: project.name,
      description: project.description
    });
    setEditProjectModalVisible(true);
  };

  const handleUpdateProject = async (values) => {
    try {
      await projectService.updateProject(id, values);
      message.success("Cập nhật dự án thành công");
      setEditProjectModalVisible(false);
      fetchProjectData();
    } catch (error) {
      console.error("Error updating project:", error);
      message.error("Không thể cập nhật dự án");
    }
  };

  // Xử lý xóa dự án
  const handleDeleteProject = async () => {
    try {
      await projectService.deleteProject(id);
      message.success("Xóa dự án thành công");
      navigate('/projects');
    } catch (error) {
      console.error("Error deleting project:", error);
      message.error("Không thể xóa dự án");
    }
  };

  // Xử lý thêm/sửa công việc
  const showAddTaskModal = () => {
    setEditingTask(null);
    taskForm.resetFields();
    taskForm.setFieldsValue({
      projectId: id,
      status: 'NOT_STARTED',
      priority: 'MEDIUM'
    });
    setTaskModalVisible(true);
  };

  const showEditTaskModal = (task) => {
    setEditingTask(task);
    taskForm.setFieldsValue({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      startDate: task.startDate ? moment(task.startDate) : null,
      dueDate: task.dueDate ? moment(task.dueDate) : null,
      tagIds: task.tags?.map(tag => tag.id) || []
    });
    setTaskModalVisible(true);
  };

  const handleTaskSubmit = async (values) => {
    try {
      setSubmitting(true);
      
      const taskData = {
        ...values,
        projectId: id,
        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
        dueDate: values.dueDate ? values.dueDate.format('YYYY-MM-DD') : null
      };
      
      if (editingTask) {
        await taskService.updateTask(editingTask.id, taskData);
        message.success("Cập nhật công việc thành công");
      } else {
        await taskService.createTask(taskData);
        message.success("Tạo công việc mới thành công");
      }
      
      setTaskModalVisible(false);
      fetchProjectData();
    } catch (error) {
      console.error("Error saving task:", error);
      message.error("Không thể lưu công việc");
    } finally {
      setSubmitting(false);
    }
  };

  // Xử lý xóa công việc
  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      message.success("Xóa công việc thành công");
      fetchProjectData();
    } catch (error) {
      console.error("Error deleting task:", error);
      message.error("Không thể xóa công việc");
    }
  };

  // Định nghĩa cột bảng công việc
  const taskColumns = [
    {
      title: 'Tên công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          {record.dueStatus === 'OVERDUE' && record.status !== 'COMPLETED' && <Badge status="error" />}
          {record.dueStatus === 'DUE_SOON' && record.status !== 'COMPLETED' && <Badge status="warning" />}
          <span>{text}</span>
        </Space>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const statusMap = {
          'NOT_STARTED': { color: 'default', text: 'Chưa bắt đầu' },
          'IN_PROGRESS': { color: 'processing', text: 'Đang thực hiện' },
          'COMPLETED': { color: 'success', text: 'Hoàn thành' },
          'ON_HOLD': { color: 'warning', text: 'Tạm dừng' }
        };
        
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
      },
      filters: [
        { text: 'Chưa bắt đầu', value: 'NOT_STARTED' },
        { text: 'Đang thực hiện', value: 'IN_PROGRESS' },
        { text: 'Hoàn thành', value: 'COMPLETED' },
        { text: 'Tạm dừng', value: 'ON_HOLD' },
      ],
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Ưu tiên',
      dataIndex: 'priority',
      key: 'priority',
      render: (priority) => {
        const priorityMap = {
          'LOW': { color: 'success', text: 'Thấp' },
          'MEDIUM': { color: 'blue', text: 'Trung bình' },
          'HIGH': { color: 'warning', text: 'Cao' },
          'URGENT': { color: 'error', text: 'Khẩn cấp' }
        };
        
        const priorityInfo = priorityMap[priority] || { color: 'default', text: priority };
        return <Tag color={priorityInfo.color}>{priorityInfo.text}</Tag>;
      },
      filters: [
        { text: 'Thấp', value: 'LOW' },
        { text: 'Trung bình', value: 'MEDIUM' },
        { text: 'Cao', value: 'HIGH' },
        { text: 'Khẩn cấp', value: 'URGENT' },
      ],
      onFilter: (value, record) => record.priority === value,
    },
    {
      title: 'Tiến độ',
      dataIndex: 'progress',
      key: 'progress',
      render: (progress) => <Progress percent={progress || 0} size="small" />,
      sorter: (a, b) => (a.progress || 0) - (b.progress || 0),
    },
    {
      title: 'Ngày bắt đầu',
      dataIndex: 'startDate',
      key: 'startDate',
      render: (date) => date ? new Date(date).toLocaleDateString('vi-VN') : 'Không có',
      sorter: (a, b) => {
        if (!a.startDate && !b.startDate) return 0;
        if (!a.startDate) return 1;
        if (!b.startDate) return -1;
        return new Date(a.startDate) - new Date(b.startDate);
      },
    },
    {
      title: 'Hạn chót',
      dataIndex: 'dueDate',
      key: 'dueDate',
      render: (date, record) => {
        if (!date) return 'Không có';
        
        const formattedDate = new Date(date).toLocaleDateString('vi-VN');
        let textType = undefined;
        
        if (record.dueStatus === 'OVERDUE' && record.status !== 'COMPLETED') {
          textType = "danger";
        } else if (record.dueStatus === 'DUE_SOON' && record.status !== 'COMPLETED') {
          textType = "warning";
        }
        
        return <Text type={textType}>{formattedDate}</Text>;
      },
      sorter: (a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      },
    },
    {
      title: 'Tag',
      key: 'tags',
      dataIndex: 'tags',
      render: (_, { tags }) => (
        <>
          {tags?.map(tag => (
            <Tag color={tag.color} key={tag.id}>
              {tag.name}
            </Tag>
          )) || 'Không có'}
        </>
      ),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditTaskModal(record)}
            type="text"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa công việc này không?"
            onConfirm={() => handleDeleteTask(record.id)}
            okText="Xóa"
            cancelText="Hủy"
          >
            <Button 
              icon={<DeleteOutlined />} 
              type="text"
              danger
            />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Button 
          type="link" 
          icon={<ArrowLeftOutlined />} 
          onClick={() => navigate('/projects')}
          style={{ paddingLeft: 0 }}
        >
          Quay lại danh sách dự án
        </Button>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <Title level={3}>{project.name}</Title>
            <Paragraph ellipsis={{ rows: 2, expandable: true, symbol: 'Xem thêm' }}>
              {project.description || 'Không có mô tả'}
            </Paragraph>
            <Text type="secondary">Ngày tạo: {new Date(project.createdAt).toLocaleDateString('vi-VN')}</Text>
          </div>
          
          <Space>
            <Button 
              icon={<EditOutlined />} 
              onClick={showEditProjectModal}
            >
              Chỉnh sửa
            </Button>
            <Popconfirm
              title="Bạn có chắc chắn muốn xóa dự án này không?"
              description="Khi xóa dự án, tất cả công việc trong dự án cũng sẽ bị xóa. Hành động này không thể hoàn tác."
              onConfirm={handleDeleteProject}
              okText="Xóa"
              cancelText="Hủy"
              okButtonProps={{ danger: true }}
            >
              <Button danger icon={<DeleteOutlined />}>Xóa</Button>
            </Popconfirm>
          </Space>
        </div>
      </div>
      
      {/* Thống kê */}
      <Card style={{ marginBottom: 20 }}>
        <Row gutter={16}>
          <Col span={6}>
            <Statistic 
              title="Tiến độ" 
              value={progressPercent} 
              suffix="%" 
              prefix={<CheckOutlined />} 
            />
            <Progress percent={progressPercent} status={progressPercent === 100 ? "success" : "active"} />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Tổng công việc" 
              value={totalTasks} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Đã hoàn thành" 
              value={completedTasks} 
              suffix={`/${totalTasks}`} 
            />
          </Col>
          <Col span={6}>
            <Statistic 
              title="Sắp đến hạn" 
              value={upcomingDeadlines} 
              prefix={<ClockCircleOutlined style={{ color: upcomingDeadlines > 0 ? '#faad14' : undefined }} />} 
            />
          </Col>
        </Row>
      </Card>
      
      {/* Tabs */}
      <Tabs defaultActiveKey="tasks">
        <TabPane tab="Công việc" key="tasks">
          <div style={{ marginBottom: 16, textAlign: 'right' }}>
            <Button 
              type="primary" 
              icon={<PlusOutlined />} 
              onClick={showAddTaskModal}
            >
              Thêm công việc
            </Button>
          </div>
          
          <Table 
            columns={taskColumns} 
            dataSource={tasks}
            rowKey="id"
            pagination={{ 
              defaultPageSize: 10, 
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50'] 
            }}
          />
        </TabPane>
        
        <TabPane tab="Thống kê" key="statistics">
          <Card>
            <Title level={4}>Thống kê trạng thái công việc</Title>
            <Row gutter={16} style={{ marginTop: 20 }}>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Chưa bắt đầu" 
                    value={tasksByStatus.NOT_STARTED} 
                    valueStyle={{ color: '#bfbfbf' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Đang thực hiện" 
                    value={tasksByStatus.IN_PROGRESS} 
                    valueStyle={{ color: '#1677ff' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Hoàn thành" 
                    value={tasksByStatus.COMPLETED} 
                    valueStyle={{ color: '#52c41a' }}
                  />
                </Card>
              </Col>
              <Col span={6}>
                <Card>
                  <Statistic 
                    title="Tạm dừng" 
                    value={tasksByStatus.ON_HOLD} 
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </TabPane>
      </Tabs>
      
      {/* Modal chỉnh sửa dự án */}
      <Modal
        title="Chỉnh sửa dự án"
        open={editProjectModalVisible}
        onCancel={() => setEditProjectModalVisible(false)}
        footer={null}
      >
        <Form
          form={projectForm}
          layout="vertical"
          onFinish={handleUpdateProject}
        >
          <Form.Item
            name="name"
            label="Tên dự án"
            rules={[{ required: true, message: 'Vui lòng nhập tên dự án' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                style={{ marginRight: 8 }} 
                onClick={() => setEditProjectModalVisible(false)}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                Cập nhật
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Modal thêm/sửa công việc */}
      <Modal
        title={editingTask ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
        open={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={handleTaskSubmit}
        >
          <Form.Item
            name="title"
            label="Tên công việc"
            rules={[{ required: true, message: 'Vui lòng nhập tên công việc' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="status"
                label="Trạng thái"
                rules={[{ required: true, message: 'Vui lòng chọn trạng thái' }]}
              >
                <Select>
                  <Option value="NOT_STARTED">Chưa bắt đầu</Option>
                  <Option value="IN_PROGRESS">Đang thực hiện</Option>
                  <Option value="COMPLETED">Hoàn thành</Option>
                  <Option value="ON_HOLD">Tạm dừng</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="priority"
                label="Ưu tiên"
                rules={[{ required: true, message: 'Vui lòng chọn mức độ ưu tiên' }]}
              >
                <Select>
                  <Option value="LOW">Thấp</Option>
                  <Option value="MEDIUM">Trung bình</Option>
                  <Option value="HIGH">Cao</Option>
                  <Option value="URGENT">Khẩn cấp</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="startDate"
                label="Ngày bắt đầu"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  locale={locale}
                />
              </Form.Item>
            </Col>
            
            <Col span={12}>
              <Form.Item
                name="dueDate"
                label="Hạn chót"
              >
                <DatePicker 
                  style={{ width: '100%' }} 
                  format="DD/MM/YYYY"
                  locale={locale}
                />
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="tagIds"
            label="Tags"
          >
            <Select mode="multiple" placeholder="Chọn tags">
              {tags.map(tag => (
                <Option key={tag.id} value={tag.id}>
                  <Tag color={tag.color}>{tag.name}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                style={{ marginRight: 8 }} 
                onClick={() => setTaskModalVisible(false)}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTask ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDetail; 