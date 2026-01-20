import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Button, Card, Form, Input, message, Tabs, Select, Switch, InputNumber, Modal, Row, Col, Alert } from 'antd'
import { ArrowLeftOutlined, SaveOutlined, ImportOutlined } from '@ant-design/icons'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSite, createSite, updateSite } from '../api/sites'
import FlowEditor from '../components/FlowEditor'
import HarImporter from '../components/HarImporter'

const { Option } = Select

export default function SiteEdit() {
    const { id } = useParams()
    const navigate = useNavigate()
    const isNew = id === 'new'
    const [form] = Form.useForm()
    const queryClient = useQueryClient()
    const [harModalVisible, setHarModalVisible] = useState(false)

    // 获取站点详情
    const { data: site, isLoading } = useQuery({
        queryKey: ['sites', id],
        queryFn: () => getSite(id),
        enabled: !isNew,
    })

    // 初始化表单
    useEffect(() => {
        if (site) {
            form.setFieldsValue(site)
        } else if (isNew) {
            form.setFieldsValue({
                enabled: true,
                auth: { type: 'none' },
                schedule: { type: 'dailyAfter', hour: 8, minute: 5, randomDelaySeconds: 0 },
                flow: []
            })
        }
    }, [site, isNew, form])

    // 保存提交
    const mutation = useMutation({
        mutationFn: (values) => isNew ? createSite(values) : updateSite(id, values),
        onSuccess: () => {
            message.success('保存成功')
            queryClient.invalidateQueries(['sites'])
            navigate('/')
        },
        onError: (err) => message.error('保存失败')
    })

    const onFinish = (values) => {
        mutation.mutate(values)
    }

    const handleImportHar = (newFlow) => {
        // 追加还是替换？目前简单处理为替换或追加提示
        // 咱们追加到末尾
        const currentFlow = form.getFieldValue('flow') || []
        form.setFieldsValue({
            flow: [...currentFlow, ...newFlow]
        })
        setHarModalVisible(false)
        message.success(`已导入 ${newFlow.length} 个步骤`)
    }

    const items = [
        {
            key: 'basic',
            label: '基本信息',
            children: (
                <>
                    <Form.Item name="name" label="站点名称" rules={[{ required: true }]}>
                        <Input placeholder="输入站点名称" />
                    </Form.Item>
                    <Form.Item name="base_url" label="Base URL">
                        <Input placeholder="https://example.com" />
                    </Form.Item>
                    <Form.Item name="tags" label="标签">
                        <Select mode="tags" placeholder="输入标签按回车" />
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={6}>
                            <Form.Item name="enabled" label="启用状态" valuePropName="checked">
                                <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                            </Form.Item>
                        </Col>
                        <Col span={6}>
                            <Form.Item name="paused" label="暂停状态" valuePropName="checked">
                                <Switch checkedChildren="暂停" unCheckedChildren="正常" />
                            </Form.Item>
                        </Col>
                    </Row>
                </>
            ),
        },
        {
            key: 'auth',
            label: '认证配置',
            children: (
                <>
                    <Form.Item name={['auth', 'type']} label="认证类型">
                        <Select>
                            <Option value="none">无</Option>
                            <Option value="bearer">Bearer Token</Option>
                            <Option value="cookie">Cookie</Option>
                        </Select>
                    </Form.Item>

                    <Form.Item noStyle shouldUpdate={(prev, curr) => prev.auth?.type !== curr.auth?.type}>
                        {({ getFieldValue }) => {
                            const type = getFieldValue(['auth', 'type'])
                            if (type === 'bearer') {
                                return (
                                    <>
                                        <Form.Item name={['auth', 'tokenSource']} label="Token 来源">
                                            <Select>
                                                <Option value="manual">手动输入</Option>
                                                <Option value="env">环境变量</Option>
                                            </Select>
                                        </Form.Item>
                                        <Form.Item noStyle shouldUpdate>
                                            {({ getFieldValue }) => {
                                                const source = getFieldValue(['auth', 'tokenSource'])
                                                if (source === 'env') {
                                                    return <Form.Item name={['auth', 'envKey']} label="环境变量名"><Input /></Form.Item>
                                                }
                                                return <Form.Item name={['auth', 'token']} label="Token 值"><Input.TextArea rows={3} /></Form.Item>
                                            }}
                                        </Form.Item>
                                    </>
                                )
                            }
                            if (type === 'cookie') {
                                return <Alert message="Cookie 模式建议直接在 Headers 中设置或使用 Env" type="info" />
                            }
                            return null
                        }}
                    </Form.Item>
                </>
            ),
        },
        {
            key: 'flow',
            label: '任务流程 (Flow)',
            children: (
                <>
                    <div style={{ marginBottom: 16 }}>
                        <Button icon={<ImportOutlined />} onClick={() => setHarModalVisible(true)}>
                            从 HAR 导入
                        </Button>
                    </div>
                    <Form.Item name="flow" tooltip="拖拽暂未实现，请使用上下箭头排序">
                        <FlowEditor />
                    </Form.Item>
                </>
            ),
        },
        {
            key: 'schedule',
            label: '调度规则',
            children: (
                <>
                    <Form.Item name={['schedule', 'type']} label="调度类型">
                        <Select>
                            <Option value="dailyAfter">每日固定时间 (DailyAfter)</Option>
                            <Option value="cron">Cron 表达式</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item noStyle shouldUpdate>
                        {({ getFieldValue }) => {
                            const type = getFieldValue(['schedule', 'type'])
                            if (type === 'cron') {
                                return <Form.Item name={['schedule', 'cron']} label="Cron 表达式"><Input placeholder="0 8 * * *" /></Form.Item>
                            }
                            return (
                                <Row gutter={16}>
                                    <Col span={6}>
                                        <Form.Item name={['schedule', 'hour']} label="小时"><InputNumber min={0} max={23} /></Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item name={['schedule', 'minute']} label="分钟"><InputNumber min={0} max={59} /></Form.Item>
                                    </Col>
                                    <Col span={8}>
                                        <Form.Item name={['schedule', 'randomDelaySeconds']} label="随机延迟 (秒)"><InputNumber min={0} /></Form.Item>
                                    </Col>
                                </Row>
                            )
                        }}
                    </Form.Item>
                </>
            ),
        },
    ]

    return (
        <Card
            title={
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(-1)} />
                    <span>{isNew ? '新增站点' : '编辑站点'}</span>
                </div>
            }
            extra={
                <Button type="primary" icon={<SaveOutlined />} onClick={form.submit} loading={mutation.isPending}>
                    保存
                </Button>
            }
        >
            <Form form={form} layout="vertical" onFinish={onFinish}>
                <Tabs defaultActiveKey="basic" items={items} />
            </Form>

            <Modal
                title="导入 HAR"
                open={harModalVisible}
                onCancel={() => setHarModalVisible(false)}
                footer={null}
                width={800}
                destroyOnClose
            >
                <HarImporter onImport={handleImportHar} />
            </Modal>
        </Card>
    )
}
