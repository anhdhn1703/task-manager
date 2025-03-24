import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';
import App from './App';
import './index.css';
import reportWebVitals from './reportWebVitals';
import { AuthProvider } from './contexts/AuthContext';

// Tách phần render ra để có thể tối ưu hóa
const renderApp = () => (
  <React.StrictMode>
    <BrowserRouter>
      <ConfigProvider
        locale={viVN}
        theme={{
          token: {
            colorPrimary: '#1677ff',
          },
        }}
      >
        <AuthProvider>
          <App />
        </AuthProvider>
      </ConfigProvider>
    </BrowserRouter>
  </React.StrictMode>
);

// Tạo root và render application
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(renderApp());

// Preload các module quan trọng để giảm thời gian tải
const preloadImportantModules = () => {
  // Preload Auth store and services
  import('./stores/authStore');
  import('./services/api');
  
  // Preload các trang chính
  import('./pages/Dashboard');
  import('./pages/ProjectList');
  import('./pages/TaskList');
};

// Thực hiện preload khi trình duyệt rảnh
if ('requestIdleCallback' in window) {
  window.requestIdleCallback(preloadImportantModules);
} else {
  // Fallback cho các trình duyệt không hỗ trợ requestIdleCallback
  setTimeout(preloadImportantModules, 500);
}

// Báo cáo web vitals
reportWebVitals();
