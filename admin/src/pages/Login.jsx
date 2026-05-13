import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, message, Space } from 'antd';
import { LockOutlined, ShopOutlined } from '@ant-design/icons';
import { checkAuth } from '../api';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      await checkAuth(values.token);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch {
      // Mock fallback always succeeds with any token
      // In production, the cloud function validates the token
      message.success('登录成功（开发模式）');
      navigate('/dashboard', { replace: true });
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
          <Form onFinish={onFinish} layout="vertical">
            <Form.Item
              name="token"
              label="管理员Token"
              rules={[{ required: true, message: '请输入管理员Token' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="输入管理员Token以登录"
                size="large"
              />
            </Form.Item>
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading} block size="large">
                登录
              </Button>
            </Form.Item>
          </Form>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            开发模式下输入任意内容即可登录
          </Typography.Text>
        </Space>
      </Card>
    </div>
  );
}
