import React, { useState, useEffect } from 'react';
import { 
  Card,
  Typography, 
  List, 
  Spin, 
  Tabs, 
  Button, 
  Space, 
  Alert, 
  Empty,
  Badge,
  Divider
} from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import notificationService from '../services/notificationService';
import NotificationItem from '../components/NotificationItem';

const { Title } = Typography;
const { TabPane } = Tabs;

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [refreshed, setRefreshed] = useState(false);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      let notificationsData;
      
      if (activeTab === 'all') {
        // Tất cả thông báo
        notificationsData = await notificationService.getAllNotifications();
      } else if (activeTab === 'unread') {
        // Chỉ thông báo chưa đọc
        notificationsData = await notificationService.getUnreadNotifications();
      } else if (activeTab === 'recent') {
        // Thông báo trong 7 ngày gần đây
        notificationsData = await notificationService.getRecentNotifications(7);
      }
      
      // Sắp xếp thông báo theo mức độ ưu tiên và thời gian
      notificationsData.sort((a, b) => {
        // Ưu tiên các thông báo chưa đọc
        if (a.read !== b.read) {
          return a.read ? 1 : -1;
        }
        
        // Sau đó sắp xếp theo mức độ ưu tiên
        const priorityOrder = { 'URGENT': 0, 'HIGH': 1, 'NORMAL': 2, 'LOW': 3 };
        const priorityA = priorityOrder[a.priority] || 2;
        const priorityB = priorityOrder[b.priority] || 2;
        
        if (priorityA !== priorityB) {
          return priorityA - priorityB;
        }
        
        // Cuối cùng sắp xếp theo thời gian (mới nhất lên đầu)
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      
      setNotifications(notificationsData);
    } catch (err) {
      console.error('Lỗi khi tải thông báo:', err);
      setError('Không thể tải thông báo. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [activeTab]);

  const handleTabChange = (key) => {
    setActiveTab(key);
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationService.markNotificationAsRead(id);
      setNotifications(notifications.map(notification => 
        notification.id === id 
          ? { ...notification, read: true } 
          : notification
      ));
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err);
      setError('Không thể đánh dấu thông báo. Vui lòng thử lại.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.deleteNotification(id);
      setNotifications(notifications.filter(notification => notification.id !== id));
    } catch (err) {
      console.error('Lỗi khi xóa thông báo:', err);
      setError('Không thể xóa thông báo. Vui lòng thử lại.');
    }
  };

  const handleRefresh = async () => {
    await notificationService.checkAndCreateDeadlineNotifications();
    await loadNotifications();
    setRefreshed(true);
    setTimeout(() => setRefreshed(false), 3000);
  };

  // Đếm số thông báo chưa đọc
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div style={{ padding: '24px' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Title level={3}>Thông báo</Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
              disabled={loading}
            >
              Kiểm tra thông báo mới
            </Button>
          </div>
          
          {refreshed && (
            <Alert message="Đã cập nhật thành công các thông báo mới!" type="success" showIcon />
          )}

          {error && (
            <Alert message={error} type="error" showIcon />
          )}

          <Tabs activeKey={activeTab} onChange={handleTabChange}>
            <TabPane 
              tab={<span>Tất cả</span>}
              key="all"
            >
              {renderNotificationList()}
            </TabPane>
            <TabPane 
              tab={<span>Chưa đọc <Badge count={unreadCount} style={{ backgroundColor: unreadCount ? '#ff4d4f' : '#52c41a' }} /></span>}
              key="unread"
            >
              {renderNotificationList()}
            </TabPane>
            <TabPane 
              tab={<span>Gần đây</span>}
              key="recent"
            >
              {renderNotificationList()}
            </TabPane>
          </Tabs>
        </Space>
      </Card>
    </div>
  );

  function renderNotificationList() {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>Đang tải thông báo...</div>
        </div>
      );
    }

    if (notifications.length === 0) {
      return <Empty description="Không có thông báo nào" />;
    }

    return (
      <List
        dataSource={notifications}
        renderItem={notification => (
          <NotificationItem 
            key={notification.id} 
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
            onDelete={handleDelete}
          />
        )}
        pagination={{
          onChange: page => {
            window.scrollTo(0, 0);
          },
          pageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50'],
          showTotal: (total) => `Tổng ${total} thông báo`
        }}
      />
    );
  }
};

export default NotificationList; 