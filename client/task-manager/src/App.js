import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import viVN from 'antd/lib/locale/vi_VN';

// Layout
import MainLayout from './components/layout/MainLayout';

// Pages
import Dashboard from './pages/Dashboard';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import TaskList from './pages/TaskList';
import TagList from './pages/TagList';
import NotificationList from './pages/NotificationList';
import PageNotFound from './pages/PageNotFound';

import './App.css';

function App() {
  return (
    <ConfigProvider locale={viVN}>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/:id" element={<TaskList />} />
          <Route path="tags" element={<TagList />} />
          <Route path="notifications" element={<NotificationList />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </ConfigProvider>
  );
}

export default App;
