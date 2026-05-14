import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { UserOutlined, LockOutlined, ShopOutlined } from '@ant-design/icons';
import { login } from '../api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await login(values.username, values.password);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (e) {
      message.error(e.message || '登录失败，请检查账号密码');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
    }}>
      <Card style={{ width: 400, boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <Space direction="vertical" size="large" style={{ width: '100%', textAlign: 'center' }}>
          <div>
            <ShopOutlined style={{ fontSize: 48, color: '#667eea' }} />
            <Typography.Title level={3} style={{ marginTop: 16, marginBottom: 4 }}>
              美食地图管理后台
            </Typography.Title>
            <Typography.Text type="secondary">FoodMap Admin Console</Typography.Text>
          </div>
          <Form onFinish={onFinish} layout="vertical" autoComplete="off">
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入账号' }]}
            >
              <Input
                prefix={<UserOutlined />}
                placeholder="账号"
                size="large"
              />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="密码"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                登录
              </Button>
            </Form.Item>
          </Form>
        </Space>
      </Card>
    </div>
  );
}
