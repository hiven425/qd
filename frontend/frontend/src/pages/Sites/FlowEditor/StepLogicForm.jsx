import { Form, Input, Button, Space } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'

const { TextArea } = Input

export default function StepLogicForm({ field }) {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Form.Item name={[field.name, 'condition']} label="执行条件">
        <Input placeholder="例如：${can_spin} == true" />
      </Form.Item>

      <Form.Item label="成功判定 (Expect)">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Form.Item name={[field.name, 'expect', 'type']} label="类型" noStyle>
            <Input placeholder="json" style={{ width: 120 }} />
          </Form.Item>
          <Form.Item name={[field.name, 'expect', 'path']} label="JSON 路径" noStyle>
            <Input placeholder="success" />
          </Form.Item>
          <Form.Item name={[field.name, 'expect', 'equals']} label="期望值" noStyle>
            <Input placeholder="true" />
          </Form.Item>
        </Space>
      </Form.Item>

      <Form.Item label="变量提取 (Extract)">
        <Form.List name={[field.name, 'extract']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(f => (
                <Space key={f.key} style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item name={[f.name, 'var']} noStyle>
                    <Input placeholder="变量名" style={{ width: 150 }} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'type']} noStyle>
                    <Input placeholder="json" style={{ width: 100 }} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'path']} noStyle>
                    <Input placeholder="JSON 路径" style={{ width: 200 }} />
                  </Form.Item>
                  <DeleteOutlined onClick={() => remove(f.name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                添加提取规则
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>
    </Space>
  )
}
