import React, { useState } from 'react'
import { Card, Tabs, Form, Input, Button, message, Statistic, Row, Col, Table, Tag, Space, Alert, Descriptions, Badge } from 'antd'
import { SaveOutlined, ReloadOutlined, SendOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../store/authStore'
import { getSystemStatus, getScheduledJobs, getRecentRuns, testWebhook } from '../api/system'
import dayjs from 'dayjs'

export default function Settings() {
    const { token, setToken } = useAuthStore()
    const [tokenForm] = Form.useForm()

    // 系统状态
    const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery({
        queryKey: ['system-status'],
        queryFn: getSystemStatus,
    })

    // 调度任务
    const { data: jobs, isLoading: jobsLoading, refetch: refetchJobs } = useQuery({
        queryKey: ['scheduled-jobs'],
        queryFn: getScheduledJobs,
    })

    // 最近执行
    const { data: runs, isLoading: runsLoading } = useQuery({
        queryKey: ['recent-runs'],
        queryFn: () => getRecentRuns(10),
    })

    // Webhook 测试
    const webhookMutation = useMutation({
        mutationFn: testWebhook,
        onSuccess: (data) => {
            if (data.success) {
                message.success('Webhook 测试成功')
            } else {
                message.error(data.message)
            }
        }
    })

    const handleSaveToken = (values) => {
        setToken(values.token)
        message.success('Token 已保存')
    }

    const jobColumns = [
        {
            title: '站点',
            dataIndex: 'siteName',
            key: 'siteName',
        },
        {
            title: '下次执行',
            dataIndex: 'nextRunTime',
            key: 'nextRunTime',
            render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'
        }
    ]

    const runColumns = [
        {
            title: '站点',
            dataIndex: 'siteName',
            key: 'siteName',
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            render: (status) => {
                const colorMap = {
                    'SUCCESS': 'green',
                    'FAILED': 'red',
                    'RUNNING': 'blue',
                    'AUTH_FAILED': 'orange'
                }
                return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
            }
        },
        {
            title: '执行时间',
            dataIndex: 'startedAt',
            key: 'startedAt',
            render: (text) => text ? dayjs(text).format('MM-DD HH:mm:ss') : '-'
        },
        {
            title: '摘要',
            dataIndex: 'summary',
            key: 'summary',
            ellipsis: true,
        }
    ]

    const items = [
        {
            key: 'token',
            label: 'Token 配置',
            children: (
                <Card>
                    <Alert
                        message="Token 用于 API 认证"
                        description="请确保与后端 ADMIN_TOKEN 环境变量一致"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                    <Form
                        form={tokenForm}
                        layout="vertical"
                        onFinish={handleSaveToken}
                        initialValues={{ token }}
                    >
                        <Form.Item name="token" label="Admin Token" rules={[{ required: true }]}>
                            <Input.Password placeholder="输入 Admin Token" />
                        </Form.Item>
                        <Form.Item>
                            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                                保存
                            </Button>
                        </Form.Item>
                    </Form>
                </Card>
            )
        },
        {
            key: 'status',
            label: '系统状态',
            children: (
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Card
                        title="概览"
                        extra={<Button icon={<ReloadOutlined />} onClick={() => refetchStatus()}>刷新</Button>}
                        loading={statusLoading}
                    >
                        {status && (
                            <Row gutter={16}>
                                <Col span={6}>
                                    <Statistic
                                        title="调度器状态"
                                        value={status.scheduler?.running ? '运行中' : '已停止'}
                                        valueStyle={{ color: status.scheduler?.running ? '#3f8600' : '#cf1322' }}
                                    />
                                </Col>
                                <Col span={6}>
                                    <Statistic title="调度任务数" value={status.scheduler?.jobCount || 0} />
                                </Col>
                                <Col span={6}>
                                    <Statistic title="站点总数" value={status.sites?.total || 0} />
                                </Col>
                                <Col span={6}>
                                    <Statistic
                                        title="启用 / 暂停"
                                        value={`${status.sites?.enabled || 0} / ${status.sites?.paused || 0}`}
                                    />
                                </Col>
                            </Row>
                        )}
                    </Card>

                    <Card
                        title="待执行任务"
                        extra={<Button icon={<ReloadOutlined />} onClick={() => refetchJobs()}>刷新</Button>}
                    >
                        <Table
                            dataSource={jobs?.jobs || []}
                            columns={jobColumns}
                            rowKey="id"
                            pagination={false}
                            loading={jobsLoading}
                            size="small"
                        />
                    </Card>

                    <Card title="最近执行记录">
                        <Table
                            dataSource={runs?.runs || []}
                            columns={runColumns}
                            rowKey="id"
                            pagination={false}
                            loading={runsLoading}
                            size="small"
                        />
                    </Card>
                </Space>
            )
        },
        {
            key: 'webhook',
            label: '通知配置',
            children: (
                <Card>
                    <Descriptions bordered column={1}>
                        <Descriptions.Item label="Webhook 状态">
                            {status?.config?.webhookConfigured ? (
                                <Badge status="success" text="已配置" />
                            ) : (
                                <Badge status="default" text="未配置" />
                            )}
                        </Descriptions.Item>
                        <Descriptions.Item label="配置方式">
                            通过后端环境变量 <code>WEBHOOK_URL</code> 配置
                        </Descriptions.Item>
                    </Descriptions>
                    <div style={{ marginTop: 16 }}>
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={() => webhookMutation.mutate()}
                            loading={webhookMutation.isPending}
                            disabled={!status?.config?.webhookConfigured}
                        >
                            测试 Webhook
                        </Button>
                    </div>
                </Card>
            )
        }
    ]

    return (
        <div>
            <h2 style={{ marginBottom: 24 }}>系统设置</h2>
            <Tabs items={items} />
        </div>
    )
}
