import React, { useState } from 'react'
import { Card, Button, Empty, Drawer, Space, Typography, Tag, Form } from 'antd'
import { PlusOutlined, DeleteOutlined, EditOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons'
import StepForm from './StepForm'

const { Text } = Typography

export default function FlowEditor({ value = [], onChange }) {
    const [editingIndex, setEditingIndex] = useState(-1)
    const [drawerVisible, setDrawerVisible] = useState(false)
    const [form] = Form.useForm()

    const handleAdd = () => {
        setEditingIndex(-1)
        form.resetFields()
        setDrawerVisible(true)
    }

    const handleEdit = (index) => {
        setEditingIndex(index)
        const step = value[index]

        // Transform headers to list
        const headersList = Object.entries(step.headers || {}).map(([name, val]) => ({ name, value: val }))
        // Transform body to string if object
        let bodyString = step.body
        if (typeof step.body === 'object' && step.body !== null) {
            bodyString = JSON.stringify(step.body, null, 2)
        }

        form.setFieldsValue({
            ...step,
            headersList,
            bodyString
        })
        setDrawerVisible(true)
    }

    const handleDelete = (index) => {
        const newValue = [...value]
        newValue.splice(index, 1)
        onChange(newValue)
    }

    const handleMove = (index, direction) => {
        const newValue = [...value]
        const targetIndex = index + direction
        if (targetIndex < 0 || targetIndex >= newValue.length) return

        const temp = newValue[index]
        newValue[index] = newValue[targetIndex]
        newValue[targetIndex] = temp
        onChange(newValue)
    }

    const handleSave = async () => {
        try {
            const values = await form.validateFields()

            // Transform back
            const headers = {}
            if (values.headersList) {
                values.headersList.forEach(h => { headers[h.name] = h.value })
            }

            let body = values.bodyString
            try {
                if (body && (body.startsWith('{') || body.startsWith('['))) {
                    body = JSON.parse(body)
                }
            } catch (e) {
                // Keep as string
            }

            const newStep = {
                ...values,
                headers,
                body,
                headersList: undefined, // cleanup
                bodyString: undefined   // cleanup
            }

            const newValue = [...value]
            if (editingIndex > -1) {
                newValue[editingIndex] = newStep
            } else {
                newValue.push(newStep)
            }

            onChange(newValue)
            setDrawerVisible(false)
        } catch (e) {
            // Validation failed
        }
    }

    return (
        <div style={{ background: '#fafafa', padding: 16, borderRadius: 8 }}>
            <Space direction="vertical" style={{ width: '100%' }}>
                {value.map((step, index) => (
                    <Card
                        key={index}
                        size="small"
                        title={<Space><Tag color="blue">{index + 1}</Tag><Text strong>{step.name}</Text></Space>}
                        extra={
                            <Space>
                                <Tag>{step.method}</Tag>
                                <Button
                                    icon={<ArrowUpOutlined />}
                                    size="small"
                                    disabled={index === 0}
                                    onClick={() => handleMove(index, -1)}
                                />
                                <Button
                                    icon={<ArrowDownOutlined />}
                                    size="small"
                                    disabled={index === value.length - 1}
                                    onClick={() => handleMove(index, 1)}
                                />
                                <Button icon={<EditOutlined />} size="small" onClick={() => handleEdit(index)} />
                                <Button icon={<DeleteOutlined />} size="small" danger onClick={() => handleDelete(index)} />
                            </Space>
                        }
                    >
                        <div style={{ wordBreak: 'break-all', color: '#666' }}>{step.url}</div>
                    </Card>
                ))}

                {value.length === 0 && <Empty description="暂无步骤" image={Empty.PRESENTED_IMAGE_SIMPLE} />}

                <Button type="dashed" block icon={<PlusOutlined />} onClick={handleAdd}>
                    添加步骤
                </Button>
            </Space>

            <Drawer
                title={editingIndex > -1 ? "编辑步骤" : "新建步骤"}
                width={500}
                open={drawerVisible}
                onClose={() => setDrawerVisible(false)}
                extra={
                    <Space>
                        <Button onClick={() => setDrawerVisible(false)}>取消</Button>
                        <Button type="primary" onClick={handleSave}>确定</Button>
                    </Space>
                }
            >
                <StepForm form={form} />
            </Drawer>
        </div>
    )
}
