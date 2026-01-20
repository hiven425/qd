import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Card, Button, Collapse, Space } from 'antd'
import { DeleteOutlined, HolderOutlined } from '@ant-design/icons'
import StepRequestForm from './StepRequestForm'
import StepLogicForm from './StepLogicForm'

export default function FlowStepItem({ field, index, onRemove }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.key })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    marginBottom: 16
  }

  const items = [
    {
      key: 'request',
      label: '请求配置',
      children: <StepRequestForm field={field} />
    },
    {
      key: 'logic',
      label: '逻辑配置',
      children: <StepLogicForm field={field} />
    }
  ]

  return (
    <div ref={setNodeRef} style={style}>
      <Card
        size="small"
        title={
          <Space>
            <HolderOutlined {...attributes} {...listeners} style={{ cursor: 'move' }} />
            <span>步骤 {index + 1}</span>
          </Space>
        }
        extra={
          <Button danger size="small" icon={<DeleteOutlined />} onClick={onRemove}>
            删除
          </Button>
        }
      >
        <Collapse items={items} defaultActiveKey={['request']} />
      </Card>
    </div>
  )
}
