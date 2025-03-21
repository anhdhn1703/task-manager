import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Card, 
  Button, 
  Space, 
  Typography, 
  Tag, 
  Modal, 
  Form, 
  Input, 
  Popconfirm,
  message,
  ColorPicker
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined 
} from '@ant-design/icons';
import tagService from '../services/tagService';

const { Title } = Typography;

const TagList = () => {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingTag, setEditingTag] = useState(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchTags();
  }, []);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const data = await tagService.getAllTags();
      setTags(data);
    } catch (error) {
      console.error("Error fetching tags:", error);
      message.error("Không thể tải danh sách tag");
    } finally {
      setLoading(false);
    }
  };

  const showAddModal = () => {
    setEditingTag(null);
    form.resetFields();
    form.setFieldsValue({
      color: '#1677ff'
    });
    setIsModalVisible(true);
  };

  const showEditModal = (tag) => {
    setEditingTag(tag);
    form.setFieldsValue({
      name: tag.name,
      description: tag.description,
      color: tag.color
    });
    setIsModalVisible(true);
  };

  const handleSubmit = async (values) => {
    try {
      if (editingTag) {
        await tagService.updateTag(editingTag.id, values);
        message.success("Cập nhật tag thành công");
      } else {
        await tagService.createTag(values);
        message.success("Tạo tag mới thành công");
      }
      setIsModalVisible(false);
      fetchTags();
    } catch (error) {
      console.error("Error saving tag:", error);
      message.error("Không thể lưu tag");
    }
  };

  const handleDelete = async (tagId) => {
    try {
      await tagService.deleteTag(tagId);
      message.success("Xóa tag thành công");
      fetchTags();
    } catch (error) {
      console.error("Error deleting tag:", error);
      message.error("Không thể xóa tag");
    }
  };

  const columns = [
    {
      title: 'Màu',
      dataIndex: 'color',
      key: 'color',
      render: (color) => (
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: '50%',
            backgroundColor: color,
            border: '1px solid #d9d9d9'
          }}
        />
      ),
      width: 80,
    },
    {
      title: 'Tên',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => <Tag color={record.color}>{text}</Tag>,
      sorter: (a, b) => a.name.localeCompare(b.name),
    },
    {
      title: 'Mô tả',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: 'Số công việc',
      dataIndex: 'taskCount',
      key: 'taskCount',
      render: (_, record) => record.tasks?.length || 0,
      sorter: (a, b) => (a.tasks?.length || 0) - (b.tasks?.length || 0),
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
            title="Bạn có chắc chắn muốn xóa tag này không?"
            description="Xóa tag sẽ gỡ bỏ tag này khỏi tất cả công việc liên quan."
            onConfirm={() => handleDelete(record.id)}
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
          <Title level={3}>Quản lý tag</Title>
          <Button 
            type="primary" 
            icon={<PlusOutlined />}
            onClick={showAddModal}
          >
            Tạo tag mới
          </Button>
        </div>
        
        <Table 
          columns={columns} 
          dataSource={tags} 
          rowKey="id"
          loading={loading}
          pagination={{ 
            defaultPageSize: 10, 
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50'],
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} tag` 
          }}
        />
      </Card>
      
      <Modal
        title={editingTag ? "Chỉnh sửa tag" : "Tạo tag mới"}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Tên tag"
            rules={[{ required: true, message: 'Vui lòng nhập tên tag' }]}
          >
            <Input />
          </Form.Item>
          
          <Form.Item
            name="description"
            label="Mô tả"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
          
          <Form.Item
            name="color"
            label="Màu sắc"
            rules={[{ required: true, message: 'Vui lòng chọn màu sắc' }]}
          >
            <ColorPicker showText />
          </Form.Item>
          
          <Form.Item>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button 
                style={{ marginRight: 8 }} 
                onClick={() => setIsModalVisible(false)}
              >
                Hủy
              </Button>
              <Button type="primary" htmlType="submit">
                {editingTag ? "Cập nhật" : "Tạo mới"}
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default TagList; 