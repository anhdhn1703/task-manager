import React, { useState, useEffect } from 'react';
import { Layout, Menu, Badge, Dropdown, Avatar, Space, Divider, message } from 'antd';
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
  SettingOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation, Link, Outlet } from 'react-router-dom';

import notificationService from '../../services/notificationService';

const { Header, Sider, Content } = Layout;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    fetchUnreadNotifications();
    
    // Cập nhật thông báo mỗi 1 phút
    const intervalId = setInterval(fetchUnreadNotifications, 60000);
    
    return () => clearInterval(intervalId);
  }, []);

  const fetchUnreadNotifications = async () => {
    try {
      const data = await notificationService.getUnreadNotifications();
      setNotifications(data.slice(0, 5)); // Lấy 5 thông báo gần nhất
      setUnreadCount(data.length);
    } catch (error) {
      console.error("Error fetching unread notifications:", error);
    }
  };

  const handleNotificationClick = (notification) => {
    // Đánh dấu là đã đọc
    notificationService.markNotificationAsRead(notification.id)
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
    // Trong demo này không có xử lý đăng xuất thực tế
    message.success("Đã đăng xuất");
    // Thực tế sẽ xóa token, chuyển về trang login,...
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

  const userItems = {
    items: [
      {
        key: 'user-info',
        label: (
          <div>
            <div style={{ fontWeight: 'bold' }}>Người dùng</div>
            <div style={{ fontSize: '12px', color: 'rgba(0, 0, 0, 0.45)' }}>
              admin@example.com
            </div>
          </div>
        ),
        disabled: true,
      },
      {
        type: 'divider',
      },
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Hồ sơ cá nhân',
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Cài đặt',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Đăng xuất',
        danger: true,
        onClick: handleLogout,
      },
    ],
  };

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
            {React.createElement(collapsed ? MenuUnfoldOutlined : MenuFoldOutlined, {
              onClick: () => setCollapsed(!collapsed),
              style: { fontSize: 18 }
            })}
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
              menu={userItems}
              placement="bottomRight"
              arrow={{ pointAtCenter: true }}
              trigger={['click']}
            >
              <Space>
                <Avatar icon={<UserOutlined />} />
                {!collapsed && <span>Admin</span>}
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