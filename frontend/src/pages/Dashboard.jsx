import React from 'react'
import { Table, Button, Tag, Space, Card, message, Modal, Tooltip } from 'antd'
import { PlayCircleOutlined, EditOutlined, DeleteOutlined, PlusOutlined, PauseCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { getSites, runSite, deleteSite, pauseSite, resumeSite } from '../api/sites'
import dayjs from 'dayjs'

export default function Dashboard() {
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    // 查询站点列表
    const { data: sites, isLoading } = useQuery({
        queryKey: ['sites'],
        queryFn: getSites,
    })

    // 立即运行
    const runMutation = useMutation({
        mutationFn: runSite,
        onSuccess: (data) => {
            message.success('已触发运行')
            console.log('Run result:', data)
            queryClient.invalidateQueries({ queryKey: ['sites'] })
        },
        onError: (err) => {
            message.error('运行失败')
        }
    })

    // 删除站点
    const deleteMutation = useMutation({
        mutationFn: deleteSite,
        onSuccess: () => {
            message.success('删除成功')
            queryClient.invalidateQueries({ queryKey: ['sites'] })
        },
    })

    // 暂停/恢复
    const togglePauseMutation = useMutation({
        mutationFn: ({ id, paused }) => paused ? resumeSite(id) : pauseSite(id),
        onSuccess: () => {
            message.success('状态已更新')
            queryClient.invalidateQueries({ queryKey: ['sites'] })
        }
    })

    const columns = [
        {
            title: '站点名称',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Space>
                    <span style={{ fontWeight: 'bold' }}>{text}</span>
                    {record.tags?.map(tag => <Tag key={tag} color="blue">{tag}</Tag>)}
                </Space>
            )
        },
        {
            title: '状态',
            key: 'status',
            render: (_, record) => {
                if (!record.enabled) return <Tag color="default">已禁用</Tag>
                if (record.paused) return <Tag color="warning">已暂停</Tag>
                return <Tag color="success">启用中</Tag>
            }
        },
        {
            title: '上次运行',
            key: 'last_run',
            render: (_, record) => (
                <div style={{ fontSize: 13 }}>
                    <div>{record.last_run_at ? dayjs(record.last_run_at).format('MM-DD HH:mm:ss') : '-'}</div>
                    {record.last_run_status && (
                        <Tag
                            color={record.last_run_status === 'SUCCESS' ? 'green' : record.last_run_status === 'FAILED' ? 'red' : 'blue'}
                            style={{ marginTop: 4 }}
                        >
                            {record.last_run_status}
                        </Tag>
                    )}
                </div>
            )
        },
        {
            title: '下次调度',
            key: 'next_run',
            render: (_, record) => record.next_run_at ? dayjs(record.next_run_at).format('MM-DD HH:mm:ss') : '-'
        },
        {
            title: '操作',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Tooltip title="立即运行">
                        <Button
                            type="text"
                            icon={<PlayCircleOutlined />}
                            onClick={() => runMutation.mutate(record.id)}
                            loading={runMutation.isPending && runMutation.variables === record.id}
                        />
                    </Tooltip>
                    <Tooltip title="编辑">
                        <Button type="text" icon={<EditOutlined />} onClick={() => navigate(`/sites/${record.id}`)} />
                    </Tooltip>
                    <Tooltip title={record.paused ? "恢复" : "暂停"}>
                        <Button
                            type="text"
                            icon={record.paused ? <PlayCircleOutlined style={{ color: 'green' }} /> : <PauseCircleOutlined style={{ color: 'orange' }} />}
                            onClick={() => togglePauseMutation.mutate({ id: record.id, paused: record.paused })}
                        />
                    </Tooltip>
                    <Tooltip title="删除">
                        <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => {
                                Modal.confirm({
                                    title: '确认删除?',
                                    content: `确定要删除站点 "${record.name}" 吗？`,
                                    onOk: () => deleteMutation.mutate(record.id)
                                })
                            }}
                        />
                    </Tooltip>
                </Space>
            ),
        },
    ]

    return (
        <Card
            title="站点列表"
            extra={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/sites/new')}>
                    新增站点
                </Button>
            }
        >
            <Table
                columns={columns}
                dataSource={sites}
                rowKey="id"
                loading={isLoading}
                pagination={{ pageSize: 10 }}
            />
        </Card>
    )
}
