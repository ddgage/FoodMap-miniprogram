import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Table, Spin, Typography, message } from 'antd';
import {
  ShopOutlined,
  FileTextOutlined,
  UserOutlined,
  EyeOutlined,
  TrophyOutlined
} from '@ant-design/icons';
import { getStats, getTrend, getHotFavs } from '../api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [trend, setTrend] = useState([]);
  const [hotFavs, setHotFavs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [s, t, h] = await Promise.all([
        getStats(),
        getTrend(),
        getHotFavs()
      ]);
      setStats(s);
      setTrend(t);
      setHotFavs(h);
    } catch (e) {
      message.error('加载数据失败');
    }
    setLoading(false);
  }

  // 简易柱状图数据
  const maxCount = Math.max(...trend.map(t => t.count), 1);

  const hotColumns = [
    { title: '排名', key: 'rank', width: 60,
      render: (_, __, i) => (
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24, height: 24,
          borderRadius: '50%',
          background: i < 3 ? ['#FF4D4F', '#FF7A45', '#FFA940'][i] : '#f0f0f0',
          color: i < 3 ? '#fff' : '#666',
          fontWeight: 600,
          fontSize: 12
        }}>
          {i + 1}
        </span>
      )
    },
    { title: '笔记标题', dataIndex: 'title', key: 'title', ellipsis: true },
    { title: '收藏数', dataIndex: 'fav_count', key: 'fav_count', width: 100,
      render: (v) => <span style={{ fontWeight: 600, color: '#FF4D4F' }}>{v}</span>
    }
  ];

  if (loading) {
    return <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>;
  }

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>数据概览</Typography.Title>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="店铺总数"
              value={stats?.shopCount || 0}
              prefix={<ShopOutlined style={{ color: '#1677ff' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="探店笔记数"
              value={stats?.postCount || 0}
              prefix={<FileTextOutlined style={{ color: '#52c41a' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="用户总数"
              value={stats?.userCount || 0}
              prefix={<UserOutlined style={{ color: '#722ed1' }} />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="总浏览量"
              value={stats?.todayViews || 0}
              prefix={<EyeOutlined style={{ color: '#fa8c16' }} />}
            />
          </Card>
        </Col>
      </Row>

      {/* 近7日访问趋势 */}
      <Card title="近7日访问趋势" style={{ marginTop: 16 }}>
        {trend.length > 0 ? (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 200, padding: '20px 0' }}>
            {trend.map((item, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1677ff', marginBottom: 4 }}>
                  {item.count}
                </span>
                <div style={{
                  width: 40,
                  height: Math.max((item.count / maxCount) * 140, 4),
                  background: 'linear-gradient(180deg, #1677ff 0%, #69b1ff 100%)',
                  borderRadius: '4px 4px 0 0',
                  transition: 'all 0.3s'
                }} />
                <span style={{ fontSize: 12, color: '#999', marginTop: 8 }}>{item.date}</span>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>暂无数据</div>
        )}
      </Card>

      {/* 热门收藏排行 */}
      <Card
        title={<span><TrophyOutlined style={{ color: '#faad14', marginRight: 8 }} />热门收藏排行</span>}
        style={{ marginTop: 16 }}
      >
        <Table
          columns={hotColumns}
          dataSource={hotFavs}
          rowKey="_id"
          pagination={false}
          size="middle"
        />
      </Card>
    </div>
  );
}
