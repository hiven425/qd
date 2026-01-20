import { Table, Tag, Button, Select } from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { useState } from 'react'
import { useSites } from '../../hooks/useSites'
import { useRuns } from '../../hooks/useRuns'
import RunDetailDrawer from './components/RunDetailDrawer'
import dayjs from 'dayjs'

export default function RunList() {
  const [selectedSiteId, setSelectedSiteId] = useState(null)
  const [selectedRunId, setSelectedRunId] = useState(null)
  const { data: sites } = useSites()
  const { data: runs, isLoading } = useRuns(selectedSiteId)

  const columns = [
    {
      title: '站点',
      dataIndex: 'site_id',
      key: 'site_id',
      render: (siteId) => sites?.find(s => s.id === siteId)?.name || siteId
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const colorMap = { SUCCESS: 'green', FAILED: 'red', SKIPPED: 'orange', RUNNING: 'blue' }
        return <Tag color={colorMap[status] || 'default'}>{status}</Tag>
      }
    },
    {
      title: '开始时间',
      dataIndex: 'started_at',
      key: 'started_at',
      render: (text) => dayjs(text).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: '结束时间',
      dataIndex: 'finished_at',
      key: 'finished_at',
      render: (text) => text ? dayjs(text).format('YYYY-MM-DD HH:mm:ss') : '-'
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button
          size="small"
          icon={<EyeOutlined />}
          onClick={() => setSelectedRunId(record.id)}
        >
          查看详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <h2>执行历史</h2>
        <Select
          style={{ width: 300 }}
          placeholder="选择站点"
          onChange={setSelectedSiteId}
          options={sites?.map(s => ({ label: s.name, value: s.id }))}
        />
      </div>
      <Table
        columns={columns}
        dataSource={runs}
        rowKey="id"
        loading={isLoading}
      />
      <RunDetailDrawer
        runId={selectedRunId}
        open={!!selectedRunId}
        onClose={() => setSelectedRunId(null)}
      />
    </div>
  )
}
