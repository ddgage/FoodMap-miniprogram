import React, { useState, useEffect, useCallback } from 'react';
import {
  Card, Table, Button, Space, Tag, Modal, Form, Input,
  InputNumber, Select, Popconfirm, message, Typography, Row, Col
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined,
  ReloadOutlined, EyeOutlined, EyeInvisibleOutlined
} from '@ant-design/icons';
import {
  listCategories, createCategory, updateCategory, deleteCategory, toggleCategoryStatus
} from '../api';

export default function CategoryManage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const res = await listCategories();
      setCategories(res || []);
    } catch { message.error('加载失败'); }
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditingCat(null);
    form.resetFields();
    form.setFieldsValue({ status: 'active', sort_order: 0 });
    setModalOpen(true);
  };

  const openEdit = (cat) => {
    setEditingCat(cat);
    form.setFieldsValue({
      name: cat.name,
      icon: cat.icon || '',
      sort_order: cat.sort_order || 0,
      status: cat.status
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSubmitting(true);

      const data = {
        name: values.name,
        icon: values.icon || '',
        sort_order: values.sort_order || 0,
        status: values.status
      };

      if (editingCat) {
        await updateCategory(editingCat._id, data);
        message.success('分类已更新');
      } else {
        await createCategory(data);
        message.success('分类已创建');
      }
      setModalOpen(false);
      fetchCategories();
    } catch (e) {
      if (e.errorFields) return;
      message.error(e.message || '操作失败');
    }
    setSubmitting(false);
  };

  const handleDelete = async (id) => {
    try {
      await deleteCategory(id);
      message.success('分类已删除');
      fetchCategories();
    } catch { message.error('删除失败'); }
  };

  const handleToggle = async (id) => {
    try {
      const res = await toggleCategoryStatus(id);
      message.success(res.status === 'active' ? '已上架' : '已下架');
      fetchCategories();
    } catch { message.error('操作失败'); }
  };

  const columns = [
    { title: '排序', dataIndex: 'sort_order', key: 'sort_order', width: 70 },
    { title: '分类名称', dataIndex: 'name', key: 'name', width: 120 },
    { title: '图标', dataIndex: 'icon', key: 'icon', width: 100,
      render: (v) => v || '-'
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
      <Typography.Title level={4} style={{ marginBottom: 24 }}>分类管理</Typography.Title>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchCategories}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增分类
          </Button>
        </Space>
      </Card>

      <Table
        columns={columns}
        dataSource={categories}
        rowKey="_id"
        loading={loading}
        pagination={false}
        size="middle"
      />

      <Modal
        title={editingCat ? '编辑分类' : '新增分类'}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={submitting}
        width={500}
        destroyOnClose
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="name" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="如：火锅、日料、咖啡" />
          </Form.Item>
          <Form.Item name="icon" label="图标（emoji或图标名称）">
            <Input placeholder="如：🍲 或 HotPotOutlined" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sort_order" label="排序（数字越小越靠前）">
                <InputNumber min={0} step={1} style={{ width: '100%' }} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
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
        </Form>
      </Modal>
    </div>
  );
}
