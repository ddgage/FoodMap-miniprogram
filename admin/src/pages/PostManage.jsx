import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Input, Select, Tag, Modal, Form,
  Popconfirm, message, Typography, Row, Col
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';
import {
  listPosts, createPost, updatePost, deletePost, togglePostStatus,
  listCategories, activeShops
} from '../api';

export default function PostManage() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [categories, setCategories] = useState([]);
  const [shops, setShops] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const pageSize = 10;

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listPosts({ page, pageSize, keyword: searchKeyword, status: filterStatus });
      setPosts(res.list || []);
      setTotal(res.total || 0);
    } catch { message.error('加载失败'); }
    setLoading(false);
  }, [page, searchKeyword, filterStatus]);

  const loadShopOptions = async () => {
    try {
      const s = await activeShops();
      setShops(Array.isArray(s) ? s : []);
    } catch (err) {
      console.warn('加载店铺列表失败:', err);
      setShops([]);
    }
  };

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => {
    listCategories().then(cats => setCategories(cats || [])).catch(() => {});
    loadShopOptions();
  }, []);

  const handleSearch = () => {
    setPage(1);
    setSearchKeyword(keyword);
  };

  const openCreate = () => {
    setEditingPost(null);
    form.resetFields();
    form.setFieldsValue({ status: 'published', tags: '' });
    loadShopOptions();
    setModalOpen(true);
  };

  const openEdit = (post) => {
    setEditingPost(post);
    form.setFieldsValue({
      title: post.title,
      cover_image: post.cover_image || '',
      video_url: post.video_url || '',
      shop_id: post.shop_id || undefined,
      author_name: post.author_name || '',
      content: post.content || '',
      tags: post.tags ? post.tags.join(',') : '',
      status: post.status
    });
    loadShopOptions();
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data = {
        title: values.title,
        cover_image: values.cover_image || '',
        video_url: values.video_url || '',
        shop_id: values.shop_id || '',
        author_name: values.author_name || '',
        content: values.content || '',
        tags: values.tags ? values.tags.split(',').map(s => s.trim()).filter(Boolean) : [],
        status: values.status
      };

      if (editingPost) {
        await updatePost(editingPost._id, data);
        message.success('笔记已更新');
      } else {
        await createPost(data);
        message.success('笔记已发布');
      }
      setModalOpen(false);
      setPage(editingPost ? page : 1);
      fetchPosts();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || '操作失败');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    try {
      await deletePost(id);
      message.success('笔记已删除');
      fetchPosts();
    } catch { message.error('删除失败'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await togglePostStatus(id);
      message.success(res.status === 'published' ? '已上架' : '已下架');
      fetchPosts();
    } catch { message.error('操作失败'); }
  };

  const columns = [
    { title: '标题', dataIndex: 'title', key: 'title', ellipsis: true, width: 200 },
    { title: '作者', dataIndex: 'author_name', key: 'author_name', width: 100 },
    {
      title: '标签', dataIndex: 'tags', key: 'tags', width: 160,
      render: (v) => v && v.length > 0 ? v.map(t => <Tag key={t} color="purple">{t}</Tag>) : '-'
    },
    {
      title: '浏览', dataIndex: 'view_count', key: 'view_count', width: 70,
      render: (v) => <span style={{ color: '#1677ff' }}>{v || 0}</span>
    },
    {
      title: '收藏', dataIndex: 'fav_count', key: 'fav_count', width: 70,
      render: (v) => <span style={{ color: '#f5222d' }}>{v || 0}</span>
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => (
        <Tag color={v === 'published' ? 'green' : 'default'}>
          {v === 'published' ? '上架' : '下架'}
        </Tag>
      )
    },
    {
      title: '发布时间', dataIndex: 'created_at', key: 'created_at', width: 110,
      render: (v) => v ? new Date(v).toLocaleDateString('zh-CN') : '-'
    },
    {
      title: '操作', key: 'action', width: 220,
      render: (_, record) => (
        <Space size="small">
          <Button size="small" type="link" icon={<EditOutlined />} onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Button
            size="small"
            type="link"
            icon={record.status === 'published' ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => handleToggle(record._id)}
          >
            {record.status === 'published' ? '下架' : '上架'}
          </Button>
          <Popconfirm
            title="确定删除？"
            description="删除后不可恢复"
            onConfirm={() => handleDelete(record._id)}
          >
            <Button size="small" type="link" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>探店笔记管理</Typography.Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="搜索笔记标题"
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
                { label: '上架', value: 'published' },
                { label: '下架', value: 'offline' }
              ]}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setSearchKeyword(''); setFilterStatus(''); setPage(1); }}>
              重置
            </Button>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              发布笔记
            </Button>
          </Col>
        </Row>
      </Card>

      <Table
        columns={columns}
        dataSource={posts}
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

      <Modal
        title={editingPost ? '编辑笔记' : '发布笔记'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={700}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="title" label="标题" rules={[{ required: true, message: '请输入标题' }]}>
            <Input placeholder="笔记标题" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="author_name" label="作者名">
                <Input placeholder="探店作者名" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="status" label="状态">
                <Select
                  options={[
                    { label: '上架', value: 'published' },
                    { label: '下架', value: 'offline' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="video_url" label="视频链接">
            <Input placeholder="B站/视频号等外部视频链接" />
          </Form.Item>
          <Form.Item name="cover_image" label="封面图fileID">
            <Input placeholder="上传到云存储的封面图fileID或URL" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="shop_id" label="关联店铺">
                <Select
                  placeholder="选择关联店铺"
                  allowClear
                  options={shops.map(s => ({ label: s.name, value: s._id }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="tags" label="标签（逗号分隔）">
                <Input placeholder="如：火锅,探店,美食" />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="content" label="文字描述">
            <Input.TextArea rows={4} placeholder="笔记的文字描述内容" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
