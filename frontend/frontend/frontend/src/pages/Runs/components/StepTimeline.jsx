import { Steps } from 'antd'
import { CheckCircleOutlined, CloseCircleOutlined, MinusCircleOutlined } from '@ant-design/icons'

export default function StepTimeline({ steps = [] }) {
  const items = steps.map((step, index) => {
    const statusMap = {
      SUCCESS: { status: 'finish', icon: <CheckCircleOutlined /> },
      FAILED: { status: 'error', icon: <CloseCircleOutlined /> },
      SKIPPED: { status: 'wait', icon: <MinusCircleOutlined /> }
    }
    const config = statusMap[step.status] || { status: 'process' }

    return {
      title: step.name || `步骤 ${index + 1}`,
      description: `${step.status_code || ''} ${step.elapsed_ms ? `(${step.elapsed_ms}ms)` : ''}`,
      ...config
    }
  })

  return <Steps direction="vertical" items={items} />
}
