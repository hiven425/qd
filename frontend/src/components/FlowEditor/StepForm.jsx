import React from 'react'
import { Form, Input, Select, InputNumber, Divider, Button, Space, Row, Col } from 'antd'
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons'

const { TextArea } = Input
const { Option } = Select

export default function StepForm({ form }) {
    return (
        <Form form={form} layout="vertical">
            <Row gutter={16}>
                <Col span={12}>
                    <Form.Item name="name" label="步骤名称" rules={[{ required: true }]}>
                        <Input placeholder="例如: login" />
                    </Form.Item>
                </Col>
                <Col span={12}>
                    <Form.Item name="method" label="请求方法" rules={[{ required: true }]}>
                        <Select>
                            <Option value="GET">GET</Option>
                            <Option value="POST">POST</Option>
                            <Option value="PUT">PUT</Option>
                            <Option value="DELETE">DELETE</Option>
                        </Select>
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item name="url" label="URL" rules={[{ required: true }]}>
                <Input placeholder="https://api.example.com/..." />
            </Form.Item>

            <Form.Item name="condition" label="前置条件 (可选)" tooltip="例如: ${can_spin} == true">
                <Input placeholder="支持简单的一元表达式" />
            </Form.Item>

            <Divider orientation="left">Headers</Divider>
            <Form.List name="headersList">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                <Form.Item
                                    {...restField}
                                    name={[name, 'name']}
                                    rules={[{ required: true, message: 'Missing key' }]}
                                >
                                    <Input placeholder="Key" />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'value']}
                                    rules={[{ required: true, message: 'Missing value' }]}
                                >
                                    <Input placeholder="Value" />
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => remove(name)} />
                            </Space>
                        ))}
                        <Form.Item>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                添加 Header
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>

            <Divider orientation="left">Body (JSON or String)</Divider>
            <Form.Item name="bodyString" tooltip="如果是 JSON，请填写标准 JSON 格式">
                <TextArea rows={4} placeholder="{ 'foo': 'bar' }" />
            </Form.Item>

            <Divider orientation="left">Expect (成功判定)</Divider>
            <Row gutter={16}>
                <Col span={8}>
                    <Form.Item name={['expect', 'type']} label="类型" initialValue="json">
                        <Select>
                            <Option value="json">JSON Path</Option>
                            <Option value="status">Status Code</Option>
                        </Select>
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name={['expect', 'path']} label="Path/Code">
                        <Input placeholder="success" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name={['expect', 'equals']} label="Equals">
                        <Input placeholder="true" />
                    </Form.Item>
                </Col>
            </Row>

            <Divider orientation="left">Extract (变量提取)</Divider>
            <Form.List name="extract">
                {(fields, { add, remove }) => (
                    <>
                        {fields.map(({ key, name, ...restField }) => (
                            <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                <Form.Item
                                    {...restField}
                                    name={[name, 'var']}
                                    rules={[{ required: true, message: 'Var name' }]}
                                >
                                    <Input placeholder="变量名" style={{ width: 100 }} />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'path']}
                                    rules={[{ required: true, message: 'Path' }]}
                                >
                                    <Input placeholder="JSON Path" />
                                </Form.Item>
                                <Form.Item
                                    {...restField}
                                    name={[name, 'type']}
                                    initialValue="json"
                                >
                                    <Input disabled value="json" style={{ width: 60 }} />
                                </Form.Item>
                                <MinusCircleOutlined onClick={() => remove(name)} />
                            </Space>
                        ))}
                        <Form.Item>
                            <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                                提取新变量
                            </Button>
                        </Form.Item>
                    </>
                )}
            </Form.List>

        </Form>
    )
}
