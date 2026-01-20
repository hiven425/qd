import React, { useState } from 'react'
import { Upload, Table, Button, message, Space, Card, Tag } from 'antd'
import { InboxOutlined, ImportOutlined } from '@ant-design/icons'
import { parseHar, generateFlow } from '../api/har'

const { Dragger } = Upload

export default function HarImporter({ onImport, onCancel }) {
    const [entries, setEntries] = useState([])
    const [selectedRowKeys, setSelectedRowKeys] = useState([])
    const [loading, setLoading] = useState(false)
    const [processing, setProcessing] = useState(false)

    const handleUpload = async (options) => {
        const { file, onSuccess, onError } = options
        setLoading(true)
        try {
            const res = await parseHar(file)
            // res.entries is the list
            setEntries(res.entries.map((e, idx) => ({ ...e, key: idx })))
            setSelectedRowKeys([]) // Reset selection
            message.success('HAR 解析成功')
            onSuccess('ok')
        } catch (err) {
            message.error('解析失败')
            onError(err)
        } finally {
            setLoading(false)
        }
    }

    const handleGenerate = async () => {
        if (selectedRowKeys.length === 0) {
            return message.warning('请至少选择一个请求')
        }

        setProcessing(true)
        try {
            const selectedAPIEntries = entries.filter(e => selectedRowKeys.includes(e.key))
            const res = await generateFlow(selectedAPIEntries)
            message.success('Flow 生成成功')
            onImport(res.flow)
        } catch (err) {
            message.error('生成失败')
        } finally {
            setProcessing(false)
        }
    }

    const columns = [
        {
            title: 'Method',
            dataIndex: 'method',
            width: 100,
            render: (text) => {
                const color = text === 'GET' ? 'blue' : text === 'POST' ? 'green' : 'orange'
                return <Tag color={color}>{text}</Tag>
            }
        },
        {
            title: 'URL',
            dataIndex: 'url',
            ellipsis: true,
        },
        {
            title: 'Status',
            dataIndex: 'status',
            width: 80,
        }
    ]

    return (
        <div style={{ padding: 12 }}>
            {entries.length === 0 ? (
                <Dragger
                    customRequest={handleUpload}
                    showUploadList={false}
                    accept=".har,.json"
                    style={{ padding: 40 }}
                >
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined />
                    </p>
                    <p className="ant-upload-text">点击或拖拽 HAR 文件到此区域上传</p>
                    <p className="ant-upload-hint">
                        支持标准 HAR 格式导出文件
                    </p>
                </Dragger>
            ) : (
                <>
                    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
                        <Space>
                            <span>已加载 {entries.length} 个请求</span>
                            <Button onClick={() => setEntries([])}>重置</Button>
                        </Space>
                        <Button
                            type="primary"
                            icon={<ImportOutlined />}
                            onClick={handleGenerate}
                            loading={processing}
                            disabled={selectedRowKeys.length === 0}
                        >
                            生成 Flow ({selectedRowKeys.length})
                        </Button>
                    </div>
                    <Table
                        dataSource={entries}
                        columns={columns}
                        rowSelection={{
                            selectedRowKeys,
                            onChange: setSelectedRowKeys,
                        }}
                        pagination={{ pageSize: 10 }}
                        size="small"
                        scroll={{ y: 400 }}
                    />
                </>
            )}
        </div>
    )
}
