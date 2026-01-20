import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Table, Button, Space, Tag, Popconfirm, message } from 'antd'
import { PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useSites, useDeleteSite, useRunSite, usePauseSite, useResumeSite } from '../../hooks/useSites'
import dayjs from 'dayjs'

export default function SiteList() {
  const { data: sites, isLoading } = useSites()
  const deleteSite = useDeleteSite()
  const runSite = useRunSite()
  const pauseSite = usePauseSite()
  const resumeSite = useResumeSite()

  const handleDelete = async (id) => {
    try {
      await deleteSite.mutateAsync(id)
      message.success('删除成功')
    } catch (error) {
      message.error('删除失败')
    }
  }

  const handleRun = async (id) => {
    try {
      await runSite.mutateAsync(id)
      message.success('执行已启动')
    } catch (error) {
      message.error('执行失败')
    }
  }

  const handlePause = async (id) => {
    try {
      await pauseSite.mutateAsync(id)
      message.success('已暂停')
    } catch (error) {
      message.error('暂停失败')
    }
  }

  const handleResume = async (id) => {
    try {
      await resumeSite.mutateAsync(id)
      message.success('已恢复')
    } catch (error) {
      message.error('恢复失败')
    }
  }

  const columns = [
    {
      title: '站点名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => (
        <Space>
          <Tag color={record.enabled ? 'green' : 'default'}>
            {record.enabled ? '启用' : '禁用'}
          </Tag>
          {record.paused && <Tag color="orange">已暂停</Tag>}
        </Space>
      )
    },
    {
      title: '上次执行',
      dataIndex: 'last_run_at',
      key: 'last_run_at',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '执行结果',
      dataIndex: 'last_run_status',
      key: 'last_run_status',
      render: (status) => {
        if (!status) return '-'
        const colorMap = { SUCCESS: 'green', FAILED: 'red', SKIPPED: 'orange' }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            size="small"
            icon={<PlayCircleOutlined />}
            onClick={() => handleRun(record.id)}
            disabled={!record.enabled || record.paused}
          >
            执行
          </Button>
          {record.paused ? (
            <Button size="small" onClick={() => handleResume(record.id)}>
              恢复
            </Button>
          ) : (
            <Button size="small" onClick={() => handlePause(record.id)}>
              暂停
            </Button>
          )}
          <Link to={`/sites/${record.id}`}>
            <Button size="small" icon={<EditOutlined />}>
              编辑
            </Button>
          </Link>
          <Popconfirm
            title="确定删除此站点？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>站点管理</h2>
        <Link to="/sites/new">
          <Button type="primary" icon={<PlusOutlined />}>
            新增站点
          </Button>
        </Link>
      </div>
      <Table
        columns={columns}
        dataSource={sites}
        rowKey="id"
        loading={isLoading}
      />
    </div>
  )
}
