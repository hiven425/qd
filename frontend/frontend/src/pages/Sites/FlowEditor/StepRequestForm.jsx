import { Form, Input, Select, Button, Space } from 'antd'
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons'

const { TextArea } = Input

export default function StepRequestForm({ field }) {
  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Form.Item
        name={[field.name, 'name']}
        label="步骤名称"
        rules={[{ required: true, message: '请输入步骤名称' }]}
      >
        <Input placeholder="例如：status" />
      </Form.Item>

      <Space>
        <Form.Item
          name={[field.name, 'method']}
          label="方法"
          rules={[{ required: true }]}
        >
          <Select style={{ width: 120 }}>
            <Select.Option value="GET">GET</Select.Option>
            <Select.Option value="POST">POST</Select.Option>
            <Select.Option value="PUT">PUT</Select.Option>
            <Select.Option value="DELETE">DELETE</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item
          name={[field.name, 'url']}
          label="URL"
          rules={[{ required: true, message: '请输入 URL' }]}
          style={{ flex: 1 }}
        >
          <Input placeholder="https://api.example.com/endpoint" />
        </Form.Item>
      </Space>

      <Form.Item label="Headers">
        <Form.List name={[field.name, 'headers']}>
          {(fields, { add, remove }) => (
            <>
              {fields.map(f => (
                <Space key={f.key} style={{ display: 'flex', marginBottom: 8 }}>
                  <Form.Item name={[f.name, 'key']} noStyle>
                    <Input placeholder="Key" style={{ width: 200 }} />
                  </Form.Item>
                  <Form.Item name={[f.name, 'value']} noStyle>
                    <Input placeholder="Value" style={{ width: 300 }} />
                  </Form.Item>
                  <DeleteOutlined onClick={() => remove(f.name)} />
                </Space>
              ))}
              <Button type="dashed" onClick={() => add()} icon={<PlusOutlined />} block>
                添加 Header
              </Button>
            </>
          )}
        </Form.List>
      </Form.Item>

      <Form.Item name={[field.name, 'body']} label="Body (JSON)">
        <TextArea rows={4} placeholder='{"key": "value"}' />
      </Form.Item>
    </Space>
  )
}
