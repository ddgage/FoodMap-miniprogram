import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Input, Select, Tag, Modal, Form,
  InputNumber, Popconfirm, message, Typography, Row, Col
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined,
  ReloadOutlined, EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';
import { listShops, createShop, updateShop, deleteShop, toggleShopStatus, listCategories, checkShopPosts } from '../api';

export default function ShopManage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [categories, setCategories] = useState([]);

  // Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingShop, setEditingShop] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  // Delete confirmation with association check
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [relatedPosts, setRelatedPosts] = useState([]);
  const [deleteChecking, setDeleteChecking] = useState(false);

  const pageSize = 10;

  const fetchShops = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listShops({ page, pageSize, keyword: searchKeyword, category: filterCategory, status: filterStatus });
      setShops(res.list || []);
      setTotal(res.total || 0);
    } catch { message.error('加载失败'); }
    setLoading(false);
  }, [page, searchKeyword, filterCategory, filterStatus]);

  const fetchCategories = async () => {
    try {
      const cats = await listCategories();
      setCategories(cats || []);
    } catch {}
  };

  useEffect(() => { fetchShops(); }, [fetchShops]);
  useEffect(() => { fetchCategories(); }, []);

  // 搜索
  const handleSearch = () => {
    setPage(1);
    setSearchKeyword(keyword);
  };

  // 新增/编辑弹窗
  const openCreate = () => {
    setEditingShop(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active' });
    setModalOpen(true);
  };

  const openEdit = (shop) => {
    setEditingShop(shop);
    form.setFieldsValue({
      name: shop.name,
      category: shop.category,
      address: shop.address || '',
      latitude: shop.location?.lat || shop.location?.latitude || '',
      longitude: shop.location?.lng || shop.location?.longitude || '',
      phone: shop.phone || '',
      rating: shop.rating || 0,
      avg_price: shop.avg_price || 0,
      meituan_url: shop.meituan_url || '',
      photos: shop.photos ? shop.photos.join('\n') : '',
      status: shop.status
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data = {
        name: values.name,
        category: values.category,
        address: values.address || '',
        phone: values.phone || '',
        rating: values.rating || 0,
        avg_price: values.avg_price || 0,
        latitude: values.latitude ? parseFloat(values.latitude) : undefined,
        longitude: values.longitude ? parseFloat(values.longitude) : undefined,
        meituan_url: values.meituan_url || '',
        photos: values.photos ? values.photos.split('\n').filter(s => s.trim()) : [],
        status: values.status
      };

      if (editingShop) {
        await updateShop(editingShop._id, data);
        message.success('店铺已更新');
      } else {
        await createShop(data);
        message.success('店铺已创建');
      }
      setModalOpen(false);
      setPage(editingShop ? page : 1);
      fetchShops();
    } catch (e) {
      if (e.errorFields) return; // form validation
      message.error(e.message || '操作失败');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    setDeleteChecking(true);
    try {
      const result = await checkShopPosts(id);
      const related = result.posts || [];
      if (related.length > 0) {
        setDeleteTarget(id);
        setRelatedPosts(related);
      } else {
        await deleteShop(id);
        message.success('店铺已删除');
        fetchShops();
      }
    } catch {
      // 检查失败时直接删除（兜底）
      try {
        await deleteShop(id);
        message.success('店铺已删除');
        fetchShops();
      } catch { message.error('删除失败'); }
    }
    setDeleteChecking(false);
  };

  const confirmForceDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteShop(deleteTarget);
      message.success('店铺已删除');
      fetchShops();
    } catch { message.error('删除失败'); }
    setDeleteTarget(null);
    setRelatedPosts([]);
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleShopStatus(id);
      message.success(res.status === 'active' ? '已上架' : '已下架');
      fetchShops();
    } catch { message.error('操作失败'); }
  };

  const columns = [
    { title: '名称', dataIndex: 'name', key: 'name', ellipsis: true, width: 180 },
    {
      title: '分类', dataIndex: 'category', key: 'category', width: 80,
      render: (v) => <Tag color="blue">{v}</Tag>
    },
    { title: '地址', dataIndex: 'address', key: 'address', ellipsis: true },
    { title: '评分', dataIndex: 'rating', key: 'rating', width: 70,
      render: (v) => <span style={{ color: '#fa8c16', fontWeight: 600 }}>{v || '-'}</span>
    },
    { title: '人均', dataIndex: 'avg_price', key: 'avg_price', width: 80,
      render: (v) => v ? `¥${v}` : '-'
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (v) => (
        <Tag color={v === 'active' ? 'green' : 'default'}>
          {v === 'active' ? '上架' : '下架'}
        </Tag>
      )
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
            icon={record.status === 'active' ? <EyeInvisibleOutlined /> : <EyeOutlined />}
            onClick={() => handleToggle(record._id)}
          >
            {record.status === 'active' ? '下架' : '上架'}
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
      <Typography.Title level={4} style={{ marginBottom: 24 }}>店铺管理</Typography.Title>

      {/* 搜索栏 */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={[12, 12]} align="middle">
          <Col flex="auto">
            <Input.Search
              placeholder="搜索店铺名称"
              value={keyword}
              onChange={e => setKeyword(e.target.value)}
              onSearch={handleSearch}
              style={{ maxWidth: 300 }}
              allowClear
            />
          </Col>
          <Col>
            <Select
              placeholder="分类筛选"
              value={filterCategory || undefined}
              onChange={v => { setFilterCategory(v || ''); setPage(1); }}
              allowClear
              style={{ width: 130 }}
              options={categories.filter(c => c.status === 'active').map(c => ({ label: c.name, value: c.name }))}
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
                { label: '上架', value: 'active' },
                { label: '下架', value: 'offline' }
              ]}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={() => { setKeyword(''); setSearchKeyword(''); setFilterCategory(''); setFilterStatus(''); setPage(1); }}>
              重置
            </Button>
          </Col>
          <Col>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新增店铺
            </Button>
          </Col>
        </Row>
      </Card>

      {/* 表格 */}
      <Table
        columns={columns}
        dataSource={shops}
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

      {/* 新增/编辑弹窗 */}
      <Modal
        title={editingShop ? '编辑店铺' : '新增店铺'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={640}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Row gutter={16}>
            <Col span={14}>
              <Form.Item name="name" label="店铺名称" rules={[{ required: true, message: '请输入名称' }]}>
                <Input placeholder="请输入店铺名称" />
              </Form.Item>
            </Col>
            <Col span={10}>
              <Form.Item name="category" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
                <Select
                  placeholder="选择分类"
                  options={categories.filter(c => c.status === 'active').map(c => ({ label: c.name, value: c.name }))}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="address" label="详细地址">
            <Input placeholder="请输入详细地址" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="latitude" label="纬度">
                <InputNumber placeholder="如 30.2741" style={{ width: '100%' }} step={0.0001} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="longitude" label="经度">
                <InputNumber placeholder="如 120.1551" style={{ width: '100%' }} step={0.0001} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="phone" label="联系电话">
                <Input placeholder="店铺电话" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="rating" label="评分">
                <InputNumber min={0} max={5} step={0.1} style={{ width: '100%' }} placeholder="0-5" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="avg_price" label="人均价格">
                <InputNumber min={0} step={1} style={{ width: '100%' }} placeholder="¥" prefix="¥" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="状态">
                <Select
                  options={[
                    { label: '上架', value: 'active' },
                    { label: '下架', value: 'offline' }
                  ]}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="meituan_url" label="美团团购链接">
            <Input placeholder="美团团购URL" />
          </Form.Item>
          <Form.Item name="photos" label="店铺图片（每行一个fileID或URL）">
            <Input.TextArea rows={3} placeholder="图片URL，每行一个" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 删除关联提示弹窗 */}
      <Modal
        title="删除确认 - 存在关联笔记"
        open={!!deleteTarget && relatedPosts.length > 0}
        onCancel={() => { setDeleteTarget(null); setRelatedPosts([]); }}
        onOk={confirmForceDelete}
        okText="强制删除"
        okButtonProps={{ danger: true }}
        cancelText="取消"
        width={560}
      >
        <div style={{ marginBottom: 16 }}>
          <Typography.Text type="danger" strong>
            该店铺被以下 {relatedPosts.length} 篇探店笔记关联：
          </Typography.Text>
          <ul style={{ marginTop: 12, paddingLeft: 20 }}>
            {relatedPosts.map(p => (
              <li key={p._id} style={{ marginBottom: 4 }}>{p.title}</li>
            ))}
          </ul>
        </div>
        <Typography.Text type="secondary">
          强制删除后，关联笔记中的店铺信息将失效。建议先修改关联笔记的店铺后再删除。
        </Typography.Text>
      </Modal>
    </div>
  );
}
