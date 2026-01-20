import { Form, Button, Space, Card } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import FlowList from './FlowList'

export default function FlowEditor({ value = [], onChange }) {
  const [form] = Form.useForm()

  const handleValuesChange = (_, allValues) => {
    onChange?.(allValues.steps || [])
  }

  const addStep = () => {
    const steps = form.getFieldValue('steps') || []
    form.setFieldsValue({
      steps: [...steps, {
        name: `step_${steps.length + 1}`,
        method: 'GET',
        url: '',
        headers: {},
        body: null
      }]
    })
  }

  return (
    <Form
      form={form}
      initialValues={{ steps: value }}
      onValuesChange={handleValuesChange}
    >
      <Card
        title="Flow 配置"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={addStep}>
            添加步骤
          </Button>
        }
      >
        <Form.List name="steps">
          {(fields, { remove, move }) => (
            <FlowList fields={fields} remove={remove} move={move} />
          )}
        </Form.List>
      </Card>
    </Form>
  )
}
