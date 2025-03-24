import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';

// Layout
import MainLayout from './components/layout/MainLayout';

// Auth
import ProtectedRoute from './components/auth/ProtectedRoute';

import './App.css';

// Lazy load các components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const ProjectList = lazy(() => import('./pages/ProjectList'));
const ProjectDetail = lazy(() => import('./pages/ProjectDetail'));
const TaskList = lazy(() => import('./pages/TaskList'));
const TagList = lazy(() => import('./pages/TagList'));
const NotificationList = lazy(() => import('./pages/NotificationList'));
const PageNotFound = lazy(() => import('./pages/PageNotFound'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ChangePassword = lazy(() => import('./pages/ChangePassword'));
const Unauthorized = lazy(() => import('./pages/Unauthorized'));

// Fallback component khi đang tải
const LoadingFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <Spin size="large" tip="Đang tải..." />
  </div>
);

function App() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/unauthorized" element={<Unauthorized />} />
        
        {/* Protected route - Change Password */}
        <Route 
          path="/change-password" 
          element={
            <ProtectedRoute>
              <ChangePassword />
            </ProtectedRoute>
          } 
        />
        
        {/* Protected routes - Main layout */}
        <Route path="/" element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="projects" element={<ProjectList />} />
          <Route path="projects/:id" element={<ProjectDetail />} />
          <Route path="tasks" element={<TaskList />} />
          <Route path="tasks/:id" element={<TaskList />} />
          <Route path="tags" element={<TagList />} />
          <Route path="notifications" element={<NotificationList />} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

export default App;
