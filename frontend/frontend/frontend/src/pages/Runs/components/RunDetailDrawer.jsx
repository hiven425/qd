import { Drawer, Descriptions, Tag, Tabs } from 'antd'
import { useRun } from '../../../hooks/useRuns'
import StepTimeline from './StepTimeline'
import dayjs from 'dayjs'

export default function RunDetailDrawer({ runId, open, onClose }) {
  const { data: run, isLoading } = useRun(runId)

  if (!run) return null

  const items = [
    {
      key: 'timeline',
      label: '执行时间轴',
      children: <StepTimeline steps={run.steps || []} />
    },
    {
      key: 'details',
      label: '详细信息',
      children: (
        <div>
          {run.steps?.map((step, index) => (
            <div key={index} style={{ marginBottom: 24, padding: 16, border: '1px solid #f0f0f0', borderRadius: 4 }}>
              <h4>{step.name || `步骤 ${index + 1}`}</h4>
              <Descriptions column={1} size="small">
                <Descriptions.Item label="状态">
                  <Tag color={step.status === 'SUCCESS' ? 'green' : 'red'}>{step.status}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态码">{step.status_code || '-'}</Descriptions.Item>
                <Descriptions.Item label="耗时">{step.elapsed_ms ? `${step.elapsed_ms}ms` : '-'}</Descriptions.Item>
                {step.error && <Descriptions.Item label="错误">{step.error}</Descriptions.Item>}
                {step.response && (
                  <Descriptions.Item label="响应">
                    <pre style={{ maxHeight: 200, overflow: 'auto', background: '#f5f5f5', padding: 8 }}>
                      {step.response}
                    </pre>
                  </Descriptions.Item>
                )}
              </Descriptions>
            </div>
          ))}
        </div>
      )
    }
  ]

  return (
    <Drawer
      title="执行详情"
      width={720}
      open={open}
      onClose={onClose}
      loading={isLoading}
    >
      <Descriptions column={1} bordered>
        <Descriptions.Item label="状态">
          <Tag color={run.status === 'SUCCESS' ? 'green' : 'red'}>{run.status}</Tag>
        </Descriptions.Item>
        <Descriptions.Item label="开始时间">
          {dayjs(run.started_at).format('YYYY-MM-DD HH:mm:ss')}
        </Descriptions.Item>
        <Descriptions.Item label="结束时间">
          {run.finished_at ? dayjs(run.finished_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
        </Descriptions.Item>
        <Descriptions.Item label="摘要">{run.summary}</Descriptions.Item>
        {run.auth_failed && (
          <Descriptions.Item label="认证失败">
            <Tag color="orange">是</Tag>
          </Descriptions.Item>
        )}
      </Descriptions>

      <div style={{ marginTop: 24 }}>
        <Tabs items={items} />
      </div>
    </Drawer>
  )
}
