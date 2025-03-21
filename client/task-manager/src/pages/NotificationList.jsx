import React, { useState, useEffect } from 'react';
import { 
  List, 
  Card, 
  Typography, 
  Button, 
  Space, 
  Badge, 
  Popconfirm, 
  message, 
  Tabs,
  Tag,
  Empty,
  Spin
} from 'antd';
import { 
  BellOutlined, 
  DeleteOutlined, 
  CheckOutlined,
  ArrowRightOutlined, 
  ClockCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import 'moment/locale/vi';

import notificationService from '../services/notificationService';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const data = await notificationService.getAllNotifications();
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      message.error("Không thể tải danh sách thông báo");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markNotificationAsRead(notificationId);
      message.success("Đã đánh dấu thông báo là đã đọc");
      fetchNotifications();
    } catch (error) {
      console.error("Error marking notification as read:", error);
      message.error("Không thể cập nhật trạng thái thông báo");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      // Đánh dấu tất cả thông báo chưa đọc là đã đọc
      const unreadNotifications = notifications.filter(notification => !notification.read);
      await Promise.all(
        unreadNotifications.map(notification => 
          notificationService.markNotificationAsRead(notification.id)
        )
      );
      
      message.success("Đã đánh dấu tất cả thông báo là đã đọc");
      fetchNotifications();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
      message.error("Không thể cập nhật trạng thái thông báo");
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
      message.success("Đã xóa thông báo");
      fetchNotifications();
    } catch (error) {
      console.error("Error deleting notification:", error);
      message.error("Không thể xóa thông báo");
    }
  };

  const navigateToTask = (taskId) => {
    if (taskId) {
      navigate(`/tasks?id=${taskId}`);
    }
  };

  const getTimeAgo = (date) => {
    moment.locale('vi');
    return moment(date).fromNow();
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'DEADLINE':
        return <ClockCircleOutlined style={{ color: '#faad14' }} />;
      case 'SYSTEM':
        return <InfoCircleOutlined style={{ color: '#1677ff' }} />;
      default:
        return <BellOutlined />;
    }
  };

  const getNotificationTypeTag = (type) => {
    const typeMap = {
      'DEADLINE': { color: 'warning', text: 'Hạn chót' },
      'SYSTEM': { color: 'processing', text: 'Hệ thống' },
      'TASK_ASSIGNED': { color: 'success', text: 'Công việc' },
      'PROJECT': { color: 'blue', text: 'Dự án' }
    };
    
    const typeInfo = typeMap[type] || { color: 'default', text: type };
    return <Tag color={typeInfo.color}>{typeInfo.text}</Tag>;
  };

  const renderNotificationItem = (item) => (
    <List.Item
      actions={[
        !item.read && (
          <Button 
            icon={<CheckOutlined />} 
            size="small"
            onClick={() => handleMarkAsRead(item.id)}
            title="Đánh dấu đã đọc"
          />
        ),
        item.taskId && (
          <Button 
            icon={<ArrowRightOutlined />} 
            size="small"
            onClick={() => navigateToTask(item.taskId)}
            title="Xem công việc"
          />
        ),
        <Popconfirm
          title="Bạn có chắc chắn muốn xóa thông báo này không?"
          onConfirm={() => handleDeleteNotification(item.id)}
          okText="Xóa"
          cancelText="Hủy"
        >
          <Button 
            icon={<DeleteOutlined />} 
            size="small"
            danger
            title="Xóa thông báo"
          />
        </Popconfirm>
      ].filter(Boolean)}
    >
      <List.Item.Meta
        avatar={
          <Badge dot={!item.read} offset={[0, 5]}>
            {getNotificationIcon(item.type)}
          </Badge>
        }
        title={
          <Space>
            <Text style={{ fontWeight: !item.read ? 'bold' : 'normal' }}>
              {item.title}
            </Text>
            {getNotificationTypeTag(item.type)}
          </Space>
        }
        description={
          <div>
            <div>{item.message}</div>
            <Text type="secondary" style={{ fontSize: '12px' }}>
              {getTimeAgo(item.createdAt)}
            </Text>
          </div>
        }
      />
    </List.Item>
  );

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <p>Đang tải dữ liệu thông báo...</p>
      </div>
    );
  }

  const unreadNotifications = notifications.filter(notification => !notification.read);
  const readNotifications = notifications.filter(notification => notification.read);

  return (
    <div>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
          <Title level={3}>Thông báo</Title>
          {unreadNotifications.length > 0 && (
            <Button onClick={handleMarkAllAsRead}>
              Đánh dấu tất cả là đã đọc
            </Button>
          )}
        </div>
        
        <Tabs defaultActiveKey="all">
          <TabPane 
            tab={
              <span>
                Tất cả <Badge count={notifications.length} />
              </span>
            } 
            key="all"
          >
            {notifications.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={notifications}
                renderItem={renderNotificationItem}
                pagination={{
                  onChange: page => {
                    window.scrollTo(0, 0);
                  },
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thông báo`
                }}
              />
            ) : (
              <Empty description="Không có thông báo nào" />
            )}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                Chưa đọc <Badge count={unreadNotifications.length} style={{ backgroundColor: unreadNotifications.length ? '#ff4d4f' : '#52c41a' }} />
              </span>
            } 
            key="unread"
          >
            {unreadNotifications.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={unreadNotifications}
                renderItem={renderNotificationItem}
                pagination={{
                  onChange: page => {
                    window.scrollTo(0, 0);
                  },
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thông báo`
                }}
              />
            ) : (
              <Empty description="Không có thông báo chưa đọc nào" />
            )}
          </TabPane>
          
          <TabPane 
            tab={
              <span>
                Đã đọc <Badge count={readNotifications.length} style={{ backgroundColor: '#8c8c8c' }} />
              </span>
            } 
            key="read"
          >
            {readNotifications.length > 0 ? (
              <List
                itemLayout="horizontal"
                dataSource={readNotifications}
                renderItem={renderNotificationItem}
                pagination={{
                  onChange: page => {
                    window.scrollTo(0, 0);
                  },
                  pageSize: 10,
                  showSizeChanger: true,
                  pageSizeOptions: ['10', '20', '50'],
                  showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} thông báo`
                }}
              />
            ) : (
              <Empty description="Không có thông báo đã đọc nào" />
            )}
          </TabPane>
        </Tabs>
      </Card>
    </div>
  );
};

export default NotificationList; 