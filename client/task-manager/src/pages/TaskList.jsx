import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Typography, 
  Tag, 
  Space, 
  Button, 
  Input, 
  Select, 
  Form, 
  DatePicker, 
  Modal, 
  Row, 
  Col, 
  Progress, 
  Popconfirm,
  message,
  Badge,
  Drawer
} from 'antd';
import { 
  SearchOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  EyeOutlined,
  FilterOutlined,
  SortAscendingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/vi';
import locale from 'antd/lib/date-picker/locale/vi_VN';

import taskService from '../services/taskService';
import projectService from '../services/projectService';
import tagService from '../services/tagService';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const TaskList = () => {
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTask, setEditingTask] = useState(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [filterDrawerVisible, setFilterDrawerVisible] = useState(false);
  const [viewingTask, setViewingTask] = useState(null);
  const [viewDrawerVisible, setViewDrawerVisible] = useState(false);
  
  const [filters, setFilters] = useState({
    search: '',
    status: [],
    priority: [],
    projectId: null,
    tagIds: [],
    dateRange: null
  });
  
  const [taskForm] = Form.useForm();
  const [filterForm] = Form.useForm();
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check if there's a task ID in the URL params
  useEffect(() => {
    const query = new URLSearchParams(location.search);
    const taskId = query.get('id');
    const paramTaskId = location.pathname.split('/').pop();

    if (taskId) {
      viewTaskDetails(taskId);
    } else if (paramTaskId && paramTaskId !== 'tasks') {
      viewTaskDetails(paramTaskId);
    }
  }, [location]);

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        const [tasksData, projectsData, tagsData] = await Promise.all([
          taskService.getAllTasks(),
          projectService.getAllProjects(),
          tagService.getAllTags()
        ]);
        
        setTasks(tasksData);
        setProjects(projectsData);
        setTags(tagsData);
      } catch (error) {
        console.error("Error fetching data:", error);
        message.error("Không thể tải dữ liệu");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Handlers
  const showAddModal = () => {
    setEditingTask(null);
    taskForm.resetFields();
    taskForm.setFieldsValue({
      status: 'NOT_STARTED',
      priority: 'MEDIUM'
    });
    setIsModalVisible(true);
  };

  const showEditModal = (task) => {
    setEditingTask(task);
    taskForm.setFieldsValue({
      title: task.title,
      description: task.description,
      projectId: task.projectId,
      status: task.status,
      priority: task.priority,
      progress: task.progress,
      startDate: task.startDate ? moment(task.startDate) : null,
      dueDate: task.dueDate ? moment(task.dueDate) : null,
      tagIds: task.tags?.map(tag => tag.id) || []
    });
    setIsModalVisible(true);
  };

  const viewTaskDetails = async (taskId) => {
    try {
      setLoading(true);
      const task = await taskService.getTaskById(taskId);
      setViewingTask(task);
      setViewDrawerVisible(true);
    } catch (error) {
      console.error("Error fetching task details:", error);
      message.error("Không thể tải thông tin công việc");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async (values) => {
    try {
      const taskData = {
        ...values,
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
      
      setIsModalVisible(false);
      fetchTasks();
    } catch (error) {
      console.error("Error saving task:", error);
      message.error("Không thể lưu công việc");
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      await taskService.deleteTask(taskId);
      message.success("Xóa công việc thành công");
      fetchTasks();
    } catch (error) {
      console.error("Error deleting task:", error);
      message.error("Không thể xóa công việc");
    }
  };

  const handleFilterSubmit = (values) => {
    setFilters(values);
    setFilterDrawerVisible(false);
  };

  const resetFilters = () => {
    filterForm.resetFields();
    setFilters({
      search: '',
      status: [],
      priority: [],
      projectId: null,
      tagIds: [],
      dateRange: null
    });
    setFilterDrawerVisible(false);
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const tasksData = await taskService.getAllTasks();
      setTasks(tasksData);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      message.error("Không thể tải danh sách công việc");
    } finally {
      setLoading(false);
    }
  };

  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Text search
    if (filters.search && 
        !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !task.description?.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0 && !filters.status.includes(task.status)) {
      return false;
    }
    
    // Priority filter
    if (filters.priority && filters.priority.length > 0 && !filters.priority.includes(task.priority)) {
      return false;
    }
    
    // Project filter
    if (filters.projectId && task.projectId !== filters.projectId) {
      return false;
    }
    
    // Tag filter
    if (filters.tagIds && filters.tagIds.length > 0) {
      const taskTagIds = task.tags?.map(tag => tag.id) || [];
      if (!filters.tagIds.some(tagId => taskTagIds.includes(tagId))) {
        return false;
      }
    }
    
    // Date range filter
    if (filters.dateRange && filters.dateRange.length === 2 && task.dueDate) {
      const dueDate = moment(task.dueDate);
      if (!dueDate.isBetween(filters.dateRange[0], filters.dateRange[1], null, '[]')) {
        return false;
      }
    }
    
    return true;
  });

  // Status and priority renderers
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

  // Table columns
  const columns = [
    {
      title: 'Tên công việc',
      dataIndex: 'title',
      key: 'title',
      render: (text, record) => (
        <Space>
          {record.dueStatus === 'OVERDUE' && <Badge status="error" />}
          {record.dueStatus === 'DUE_SOON' && <Badge status="warning" />}
          <a onClick={() => viewTaskDetails(record.id)}>{text}</a>
        </Space>
      ),
      sorter: (a, b) => a.title.localeCompare(b.title),
    },
    {
      title: 'Dự án',
      dataIndex: 'projectId',
      key: 'projectId',
      render: (projectId) => {
        const project = projects.find(p => p.id === projectId);
        return project ? <a onClick={() => navigate(`/projects/${projectId}`)}>{project.name}</a> : 'N/A';
      },
      filters: projects.map(project => ({ text: project.name, value: project.id })),
      onFilter: (value, record) => record.projectId === value,
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
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
      render: (priority) => getPriorityTag(priority),
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
      render: (date) => {
        if (!date) return 'Không có';
        return new Date(date).toLocaleDateString('vi-VN');
      },
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
        
        if (record.dueStatus === 'OVERDUE') {
          textType = "danger";
        } else if (record.dueStatus === 'DUE_SOON') {
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
            icon={<EyeOutlined />} 
            onClick={() => viewTaskDetails(record.id)}
            type="text"
          />
          <Button 
            icon={<EditOutlined />} 
            onClick={() => showEditModal(record)}
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
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>Danh sách công việc</Title>
          <Space>
            <Input
              placeholder="Tìm kiếm"
              value={filters.search}
              onChange={e => setFilters({...filters, search: e.target.value})}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
              allowClear
            />
            <Button 
              icon={<FilterOutlined />} 
              onClick={() => setFilterDrawerVisible(true)}
            >
              Bộ lọc
            </Button>
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={showAddModal}
            >
              Thêm công việc
            </Button>
          </Space>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={filteredTasks} 
          rowKey="id"
          loading={loading}
          pagination={{ 
            defaultPageSize: 10, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} công việc`
          }}
        />
      </Card>
      
      {/* Task Modal */}
      <Modal
        title={editingTask ? "Chỉnh sửa công việc" : "Thêm công việc mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={700}
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={handleTaskSubmit}
        >
          <Row gutter={16}>
            <Col span={16}>
              <Form.Item
                name="title"
                label="Tên công việc"
                rules={[{ required: true, message: 'Vui lòng nhập tên công việc' }]}
              >
                <Input />
              </Form.Item>
            </Col>
            
            <Col span={8}>
              <Form.Item
                name="projectId"
                label="Dự án"
                rules={[{ required: true, message: 'Vui lòng chọn dự án' }]}
              >
                <Select placeholder="Chọn dự án">
                  {projects.map(project => (
                    <Option key={project.id} value={project.id}>{project.name}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={4} />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={8}>
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
            
            <Col span={8}>
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
            
            <Col span={8}>
              <Form.Item
                name="progress"
                label="Tiến độ (%)"
              >
                <Input type="number" min={0} max={100} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row gutter={16}>
            <Col span={8}>
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
            
            <Col span={8}>
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
            
            <Col span={8}>
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
            </Col>
          </Row>
          
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button style={{ marginRight: 8 }} onClick={() => setIsModalVisible(false)}>
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTask ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
      
      {/* Filter Drawer */}
      <Drawer
        title="Bộ lọc công việc"
        placement="right"
        width={400}
        onClose={() => setFilterDrawerVisible(false)}
        open={filterDrawerVisible}
        extra={
          <Space>
            <Button onClick={resetFilters}>Đặt lại</Button>
            <Button type="primary" onClick={() => filterForm.submit()}>
              Áp dụng
            </Button>
          </Space>
        }
      >
        <Form
          form={filterForm}
          layout="vertical"
          onFinish={handleFilterSubmit}
          initialValues={filters}
        >
          <Form.Item name="search" label="Tìm kiếm">
            <Input placeholder="Nhập từ khóa" prefix={<SearchOutlined />} allowClear />
          </Form.Item>
          
          <Form.Item name="status" label="Trạng thái">
            <Select mode="multiple" placeholder="Chọn trạng thái" allowClear>
              <Option value="NOT_STARTED">Chưa bắt đầu</Option>
              <Option value="IN_PROGRESS">Đang thực hiện</Option>
              <Option value="COMPLETED">Hoàn thành</Option>
              <Option value="ON_HOLD">Tạm dừng</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="priority" label="Mức độ ưu tiên">
            <Select mode="multiple" placeholder="Chọn mức độ ưu tiên" allowClear>
              <Option value="LOW">Thấp</Option>
              <Option value="MEDIUM">Trung bình</Option>
              <Option value="HIGH">Cao</Option>
              <Option value="URGENT">Khẩn cấp</Option>
            </Select>
          </Form.Item>
          
          <Form.Item name="projectId" label="Dự án">
            <Select placeholder="Chọn dự án" allowClear>
              {projects.map(project => (
                <Option key={project.id} value={project.id}>{project.name}</Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="tagIds" label="Tags">
            <Select mode="multiple" placeholder="Chọn tags" allowClear>
              {tags.map(tag => (
                <Option key={tag.id} value={tag.id}>
                  <Tag color={tag.color}>{tag.name}</Tag>
                </Option>
              ))}
            </Select>
          </Form.Item>
          
          <Form.Item name="dateRange" label="Khoảng thời gian hạn chót">
            <RangePicker 
              style={{ width: '100%' }} 
              format="DD/MM/YYYY"
              locale={locale}
            />
          </Form.Item>
        </Form>
      </Drawer>
      
      {/* View Task Drawer */}
      {viewingTask && (
        <Drawer
          title="Chi tiết công việc"
          placement="right"
          width={500}
          onClose={() => setViewDrawerVisible(false)}
          open={viewDrawerVisible}
          extra={
            <Space>
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                onClick={() => {
                  setViewDrawerVisible(false);
                  showEditModal(viewingTask);
                }}
              >
                Chỉnh sửa
              </Button>
            </Space>
          }
        >
          <div style={{ marginBottom: 20 }}>
            <Title level={4}>{viewingTask.title}</Title>
            <Space>
              {getStatusTag(viewingTask.status)}
              {getPriorityTag(viewingTask.priority)}
              {viewingTask.dueStatus === 'OVERDUE' && <Tag color="red">Trễ hạn</Tag>}
              {viewingTask.dueStatus === 'DUE_SOON' && <Tag color="orange">Sắp đến hạn</Tag>}
            </Space>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <Text strong>Dự án: </Text>
            {projects.find(p => p.id === viewingTask.projectId)?.name || 'N/A'}
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <Text strong>Mô tả: </Text>
            <p>{viewingTask.description || 'Không có mô tả'}</p>
          </div>
          
          <div style={{ marginBottom: 20 }}>
            <Text strong>Tiến độ: </Text>
            <Progress percent={viewingTask.progress || 0} />
          </div>
          
          <Row gutter={16} style={{ marginBottom: 20 }}>
            <Col span={12}>
              <Text strong>Hạn chót: </Text>
              <div>{viewingTask.dueDate ? new Date(viewingTask.dueDate).toLocaleDateString('vi-VN') : 'Không có'}</div>
            </Col>
            <Col span={12}>
              <Text strong>Ngày bắt đầu: </Text>
              <div>{viewingTask.startDate ? new Date(viewingTask.startDate).toLocaleDateString('vi-VN') : 'Không có'}</div>
            </Col>
          </Row>
          
          <div>
            <Text strong>Tags: </Text>
            <div style={{ marginTop: 8 }}>
              {viewingTask.tags?.length > 0 ? (
                viewingTask.tags.map(tag => (
                  <Tag color={tag.color} key={tag.id} style={{ marginBottom: 8 }}>
                    {tag.name}
                  </Tag>
                ))
              ) : (
                'Không có tag'
              )}
            </div>
          </div>
        </Drawer>
      )}
    </div>
  );
};

export default TaskList; 