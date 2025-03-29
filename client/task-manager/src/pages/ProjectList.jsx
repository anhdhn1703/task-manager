import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Input, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Badge, 
  Modal, 
  Form, 
  message,
  Progress,
  Popconfirm
} from 'antd';
import { 
  PlusOutlined, 
  SearchOutlined, 
  EditOutlined, 
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import projectService from '../services/projectService';
import taskService from '../services/taskService';

const { Title } = Typography;
const { confirm } = Modal;

const ProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form] = Form.useForm();
  
  const navigate = useNavigate();

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getAllProjects();
      
      // Tính toán số công việc và tiến độ cho mỗi dự án
      const projectsWithStats = await Promise.all(data.map(async (project) => {
        try {
          const tasks = await taskService.getTasksByProjectId(project.id);
          const totalTasks = tasks.length;
          const completedTasks = tasks.filter(task => task.status === 'COMPLETED').length;
          const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
          
          return {
            ...project,
            taskCount: totalTasks,
            completedTaskCount: completedTasks,
            progress
          };
        } catch (error) {
          console.error(`Error fetching tasks for project ${project.id}:`, error);
          return {
            ...project,
            taskCount: 0,
            completedTaskCount: 0,
            progress: 0
          };
        }
      }));
      
      setProjects(projectsWithStats);
    } catch (error) {
      console.error("Error fetching projects:", error);
      message.error("Không thể tải danh sách dự án");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const showAddModal = () => {
    setEditingProject(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const showEditModal = (project) => {
    setEditingProject(project);
    form.setFieldsValue({
      name: project.name,
      description: project.description,
    });
    setIsModalVisible(true);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingProject) {
        await projectService.updateProject(editingProject.id, values);
        message.success("Cập nhật dự án thành công");
      } else {
        await projectService.createProject(values);
        message.success("Tạo dự án mới thành công");
      }
      setIsModalVisible(false);
      fetchProjects();
    } catch (error) {
      console.error("Error saving project:", error);
      message.error("Không thể lưu dự án");
    }
  };

  const showDeleteConfirm = (projectId) => {
    confirm({
      title: 'Bạn có chắc chắn muốn xóa dự án này?',
      icon: <ExclamationCircleOutlined />,
      content: 'Khi xóa dự án, tất cả công việc trong dự án cũng sẽ bị xóa. Hành động này không thể hoàn tác.',
      okText: 'Xóa',
      okType: 'danger',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await projectService.deleteProject(projectId);
          message.success("Xóa dự án thành công");
          fetchProjects();
        } catch (error) {
          console.error("Error deleting project:", error);
          message.error("Không thể xóa dự án");
        }
      },
    });
  };

  const getStatusBadge = (progress) => {
    if (progress === 0) return <Badge status="default" text="Chưa bắt đầu" />;
    if (progress === 100) return <Badge status="success" text="Hoàn thành" />;
    return <Badge status="processing" text="Đang thực hiện" />;
  };

  const columns = [
    {
      title: 'Tên dự án',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (text, record) => (
        <a onClick={() => navigate(`/projects/${record.id}`)}>{text}</a>
      ),
      filteredValue: searchText ? [searchText] : null,
      onFilter: (value, record) => 
        record.name.toLowerCase().includes(value.toLowerCase()) ||
        record.description.toLowerCase().includes(value.toLowerCase())
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Tiến độ',
      key: 'progress',
      render: (_, record) => (
        <Space direction="vertical" style={{ width: '100%' }}>
          <Progress percent={record.progress} size="small" />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{getStatusBadge(record.progress)}</span>
            <span>{record.completedTaskCount}/{record.taskCount} công việc</span>
          </div>
        </Space>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => new Date(date).toLocaleDateString('vi-VN'),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
            type="text"
          />
          <Popconfirm
            title="Bạn có chắc chắn muốn xóa dự án này không?"
            onConfirm={() => showDeleteConfirm(record.id)}
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

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>Danh sách dự án</Title>
          <Space>
            <Input
              placeholder="Tìm kiếm dự án"
              onChange={handleSearch}
              prefix={<SearchOutlined />}
              allowClear
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              Tạo dự án mới
            </Button>
          </Space>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={projects} 
          rowKey="id"
          loading={loading}
          pagination={{ 
            defaultPageSize: 10, 
            showSizeChanger: true, 
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} dự án` 
          }}
        />
      </Card>
      
      <Modal
        title={editingProject ? "Chỉnh sửa dự án" : "Tạo dự án mới"}
        open={isModalVisible}
        onCancel={handleCancel}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
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
              <Button style={{ marginRight: 8 }} onClick={handleCancel}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingProject ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectList; 