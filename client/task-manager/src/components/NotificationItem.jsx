import React from 'react';
import { 
  List, 
  Avatar, 
  Typography, 
  Space, 
  Tag, 
  Tooltip, 
  Button 
} from 'antd';
import { 
  BellOutlined, 
  ClockCircleOutlined, 
  ExclamationCircleOutlined, 
  CheckCircleOutlined, 
  WarningOutlined, 
  DeleteOutlined, 
  EyeOutlined 
} from '@ant-design/icons';
import { formatDistance } from 'date-fns';
import { vi } from 'date-fns/locale';

const { Text, Paragraph } = Typography;

const NotificationItem = ({ notification, onMarkAsRead, onDelete }) => {
  // Lấy màu dựa trên độ ưu tiên
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT':
        return '#f5222d';
      case 'HIGH':
        return '#fa8c16';
      case 'NORMAL':
        return '#1890ff';
      case 'LOW':
        return '#52c41a';
      default:
        return '#1890ff';
    }
  };

  // Lấy icon dựa trên loại thông báo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'DEADLINE_REMINDER':
        return <ClockCircleOutlined style={{ color: '#1890ff' }} />;
      case 'TASK_ASSIGNED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'TASK_UPDATED':
        return <ExclamationCircleOutlined style={{ color: '#faad14' }} />;
      case 'TASK_COMPLETED':
        return <CheckCircleOutlined style={{ color: '#52c41a' }} />;
      case 'URGENT_TASK':
        return <WarningOutlined style={{ color: '#f5222d' }} />;
      default:
        return <BellOutlined style={{ color: '#1890ff' }} />;
    }
  };

  // Chuyển đổi độ ưu tiên sang tiếng Việt
  const getPriorityText = (priority) => {
    switch (priority) {
      case 'URGENT':
        return 'Khẩn cấp';
      case 'HIGH':
        return 'Cao';
      case 'NORMAL':
        return 'Bình thường';
      case 'LOW':
        return 'Thấp';
      default:
        return 'Bình thường';
    }
  };

  // Format thời gian tạo thông báo
  const formattedTime = formatDistance(
    new Date(notification.createdAt),
    new Date(),
    { addSuffix: true, locale: vi }
  );

  return (
    <List.Item
      style={{
        backgroundColor: notification.read ? 'transparent' : 'rgba(24, 144, 255, 0.1)',
        padding: '12px',
        borderRadius: '4px',
        margin: '8px 0'
      }}
      actions={[
        !notification.read && (
          <Tooltip title="Đánh dấu đã đọc">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => onMarkAsRead(notification.id)}
            />
          </Tooltip>
        ),
        <Tooltip title="Xóa thông báo">
          <Button
            type="text"
            icon={<DeleteOutlined />}
            onClick={() => onDelete(notification.id)}
            danger
          />
        </Tooltip>
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={
          <Avatar icon={getNotificationIcon(notification.type)} size="large" />
        }
        title={
          <Space>
            <Text strong>{notification.title}</Text>
            {notification.priority && (
              <Tag color={getPriorityColor(notification.priority)}>
                {getPriorityText(notification.priority)}
              </Tag>
            )}
            {!notification.read && (
              <Tag color="blue">Mới</Tag>
            )}
          </Space>
        }
        description={
          <Space direction="vertical" style={{ width: '100%' }}>
            <Paragraph>{notification.message}</Paragraph>
            <Text type="secondary">{formattedTime}</Text>
          </Space>
        }
      />
    </List.Item>
  );
};

export default NotificationItem; 