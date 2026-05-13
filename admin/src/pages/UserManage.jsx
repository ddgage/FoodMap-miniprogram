import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Input, Select, Tag, Popconfirm,
  message, Typography, Row, Col
} from 'antd';
import {
  ReloadOutlined, StopOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { listUsers, toggleUserStatus } from '../api';

export default function UserManage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const pageSize = 10;

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listUsers({ page, pageSize, keyword: searchKeyword, status: filterStatus });
      setUsers(res.list || []);
      setTotal(res.total || 0);
    } catch { message.error('加载失败'); }
    setLoading(false);
  }, [page, searchKeyword, filterStatus]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleSearch = () => {
    setPage(1);
    setSearchKeyword(keyword);
  };

  const handleToggle = async (id, currentStatus) => {
    const isBanned = currentStatus === 'banned';
    try {
      const res = await toggleUserStatus(id);
      if (res.status === 'banned') {
        message.success('用户已封禁，该用户将无法登录小程序');
      } else {
        message.success('用户已解封');
      }
      fetchUsers();
    } catch { message.error('操作失败'); }
  };

  const columns = [
    {
      title: '昵称', dataIndex: 'nickname', key: 'nickname', width: 160, ellipsis: true
    },
    {
      title: 'OpenID', dataIndex: 'openid', key: 'openid', width: 200, ellipsis: true,
      render: (v) => <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</span>
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => (
        <Tag color={v === 'active' ? 'green' : 'red'}>
          {v === 'active' ? '正常' : '封禁'}
        </Tag>
      )
    },
    {
      title: '注册时间', dataIndex: 'created_at', key: 'created_at', width: 110,
      render: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '最后登录', dataIndex: 'last_login_at', key: 'last_login_at', width: 110,
      render: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '操作', key: 'action', width: 120,
      render: (_, record) => (
        <Popconfirm
          title={record.status === 'active'
            ? '封禁后该用户将无法登录小程序，确认封禁？'
            : '确认解除封禁？'}
          onConfirm={() => handleToggle(record._id, record.status)}
        >
          <Button
            size="small"
            type="primary"
            danger={record.status === 'active'}
            icon={record.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />}
          >
            {record.status === 'active' ? '封禁' : '解封'}
          </Button>
        </Popconfirm>
      )
    }
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>用户管理</Typography.Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="搜索昵称或OpenID"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 300 }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="状态筛选"
              value={filterStatus || undefined}
              onChange={v => { setFilterStatus(v || ''); setPage(1); }}
              allowClear
              style={{ width: 110 }}
              options={[
                { label: '正常', value: 'active' },
                { label: '封禁', value: 'banned' }
              ]}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setSearchKeyword(''); setFilterStatus(''); setPage(1); }}>
              重置
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={users}
        rowKey="_id"
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showTotal: t => `共 ${t} 条`,
          onChange: p => setPage(p)
        }}
        size="middle"
      />
    </div>
  );
}
