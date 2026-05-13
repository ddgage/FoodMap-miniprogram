import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import AdminLayout from './components/AdminLayout';
import Dashboard from './pages/Dashboard';
import ShopManage from './pages/ShopManage';
import PostManage from './pages/PostManage';
import CategoryManage from './pages/CategoryManage';
import UserManage from './pages/UserManage';
import Login from './pages/Login';
import { isLoggedIn } from './api';

function PrivateRoute({ children }) {
  return isLoggedIn() ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <PrivateRoute>
            <AdminLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/shops" element={<ShopManage />} />
                <Route path="/posts" element={<PostManage />} />
                <Route path="/categories" element={<CategoryManage />} />
                <Route path="/users" element={<UserManage />} />
              </Routes>
            </AdminLayout>
          </PrivateRoute>
        }
      />
    </Routes>
  );
}
