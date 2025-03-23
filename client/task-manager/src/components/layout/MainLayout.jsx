import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Dropdown, Avatar, Space, Divider, message, Button } from 'antd';
import { 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  DashboardOutlined, 
  ProjectOutlined, 
  CheckSquareOutlined, 
  TagOutlined, 
  BellOutlined, 
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  DownOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

import notificationService from '../../services/notificationService';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, user } = useAuth();

  useEffect(() => {
    fetchUnreadNotifications();
    
    // Cập nhật thông báo mỗi 1 phút
    const intervalId = setInterval(fetchUnreadNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      if (!user) {
        // Nếu không có thông tin người dùng, không gọi API
        setNotifications([]);
        setUnreadCount(0);
        return;
      }
      
      // Lấy danh sách thông báo chưa đọc
      const notifications = await notificationService.getNotifications({ read: false });
      setNotifications(notifications.slice(0, 5)); // Lấy 5 thông báo gần nhất
      
      // Lấy số lượng thông báo chưa đọc
      const count = await notificationService.getUnreadCount();
      setUnreadCount(count);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
      // Nếu lỗi liên quan đến xác thực (401), logout và chuyển hướng
      if (error.response && error.response.status === 401) {
        message.error("Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại.");
        logout();
        navigate('/login');
      }
    }
  };

  const handleNotificationClick = (notification) => {
    // Đánh dấu là đã đọc
    notificationService.markAsRead(notification.id)
      .then(() => {
        fetchUnreadNotifications();
        
        // Điều hướng tới trang liên quan nếu có
        if (notification.taskId) {
          navigate(`/tasks?id=${notification.taskId}`);
        }
      })
      .catch(error => {
        console.error("Error marking notification as read:", error);
      });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const notificationItems = {
    items: [
      {
        key: 'notifications-title',
        label: <div style={{ fontWeight: 'bold' }}>Thông báo của bạn</div>,
        disabled: true,
      },
      {
        type: 'divider',
      },
      ...(notifications.length > 0 
        ? notifications.map((notification, index) => ({
            key: `notification-${index}`,
            label: (
              <div 
                style={{ maxWidth: 300 }}
                onClick={() => handleNotificationClick(notification)}
              >
                <div style={{ fontWeight: notification.read ? 'normal' : 'bold' }}>
                  {notification.title}
                </div>
                <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
                  {notification.message.length > 50 
                    ? `${notification.message.substring(0, 50)}...` 
                    : notification.message}
                </div>
              </div>
            ),
          }))
        : [{
            key: 'no-notifications',
            label: 'Không có thông báo mới',
            disabled: true,
          }]
      ),
      {
        type: 'divider',
      },
      {
        key: 'view-all',
        label: <div style={{ textAlign: 'center' }}>Xem tất cả thông báo</div>,
        onClick: () => navigate('/notifications'),
      },
    ],
  };

  const userMenu = [
    {
      key: 'profile',
      label: <Link to="/profile">{user?.fullName || user?.username || 'Hồ sơ cá nhân'}</Link>,
    },
    {
      key: 'change-password',
      label: <Link to="/change-password">Đổi mật khẩu</Link>,
    },
    {
      key: 'divider',
      type: 'divider',
    },
    {
      key: 'logout',
      label: <a onClick={handleLogout}>Đăng xuất</a>,
    },
  ];

  const menuItems = [
    {
      key: '/',
      icon: <DashboardOutlined />,
      label: 'Tổng quan',
    },
    {
      key: '/projects',
      icon: <ProjectOutlined />,
      label: 'Dự án',
    },
    {
      key: '/tasks',
      icon: <CheckSquareOutlined />,
      label: 'Công việc',
    },
    {
      key: '/tags',
      icon: <TagOutlined />,
      label: 'Tag',
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: 'Thông báo',
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider 
        trigger={null} 
        collapsible 
        collapsed={collapsed}
        theme="light"
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)'
        }}
      >
        <div style={{ 
          height: 64, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: collapsed ? 'center' : 'flex-start',
          padding: collapsed ? 0 : '0 16px',
        }}>
          {collapsed ? (
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1677ff' }}>TM</div>
          ) : (
            <div style={{ fontSize: 18, fontWeight: 'bold', color: '#1677ff' }}>
              Task Manager
            </div>
          )}
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout style={{ marginLeft: collapsed ? 80 : 200, transition: 'all 0.2s' }}>
        <Header style={{ 
          padding: '0 16px', 
          background: '#fff', 
          boxShadow: '0 2px 8px 0 rgba(29,35,41,.05)',
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{
                fontSize: '16px',
                width: 64,
                height: 64,
              }}
            />
          </div>
          <Space size="large">
            <Dropdown
              menu={notificationItems}
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
              trigger={['click']}
            >
              <Badge count={unreadCount} size="small">
                <BellOutlined style={{ fontSize: 18 }} />
              </Badge>
            </Dropdown>
            <Dropdown 
              menu={{ items: userMenu }}
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
              trigger={['click']}
            >
              <Space>
                <Avatar style={{ backgroundColor: '#1677ff' }} icon={<UserOutlined />} />
                {!collapsed && <span>{user?.fullName || user?.username}</span>}
              </Space>
            </Dropdown>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff', borderRadius: 4, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout; 