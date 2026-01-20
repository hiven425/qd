import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Form, Input, Button, Switch, Card, message, Space, Tabs } from 'antd'
import { useSite, useCreateSite, useUpdateSite } from '../../hooks/useSites'
import FlowEditor from './FlowEditor/FlowEditor'

const { TextArea } = Input

export default function SiteEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form] = Form.useForm()
  const { data: site, isLoading } = useSite(id)
  const createSite = useCreateSite()
  const updateSite = useUpdateSite()
  const [flowMode, setFlowMode] = useState('visual')

  const isEdit = !!id

  useEffect(() => {
    if (site) {
      form.setFieldsValue({
        ...site,
        flow: site.flow || [],
        flowJson: JSON.stringify(site.flow || [], null, 2),
        auth: JSON.stringify(site.auth || {}, null, 2),
        schedule: JSON.stringify(site.schedule || {}, null, 2)
      })
    }
  }, [site, form])

  const onFinish = async (values) => {
    try {
      const data = {
        ...values,
        flow: flowMode === 'visual' ? values.flow : JSON.parse(values.flowJson || '[]'),
        auth: JSON.parse(values.auth || '{}'),
        schedule: JSON.parse(values.schedule || '{}')
      }

      if (isEdit) {
        await updateSite.mutateAsync({ id, data })
        message.success('更新成功')
      } else {
        await createSite.mutateAsync(data)
        message.success('创建成功')
      }
      navigate('/sites')
    } catch (error) {
      message.error(isEdit ? '更新失败' : '创建失败')
    }
  }

  if (isEdit && isLoading) {
    return <div>加载中...</div>
  }

  return (
    <Card title={isEdit ? '编辑站点' : '新增站点'}>
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ enabled: true }}
      >
        <Form.Item
          label="站点名称"
          name="name"
          rules={[{ required: true, message: '请输入站点名称' }]}
        >
          <Input placeholder="例如：up.x666.me" />
        </Form.Item>

        <Form.Item label="启用" name="enabled" valuePropName="checked">
          <Switch />
        </Form.Item>

        <Form.Item label="Base URL" name="base_url">
          <Input placeholder="可选，例如：https://up.x666.me" />
        </Form.Item>

        <Form.Item
          label="认证配置 (JSON)"
          name="auth"
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                try {
                  JSON.parse(value)
                  return Promise.resolve()
                } catch {
                  return Promise.reject(new Error('JSON 格式错误'))
                }
              }
            }
          ]}
        >
          <TextArea
            rows={6}
            placeholder={`例如：
{
  "type": "bearer",
  "tokenSource": "manual",
  "token": "your-token-here"
}`}
          />
        </Form.Item>

        <Form.Item label="Flow 配置">
          <Tabs
            activeKey={flowMode}
            onChange={setFlowMode}
            items={[
              {
                key: 'visual',
                label: '可视化编辑',
                children: <Form.Item name="flow" noStyle><FlowEditor /></Form.Item>
              },
              {
                key: 'json',
                label: 'JSON 编辑',
                children: (
                  <Form.Item
                    name="flowJson"
                    rules={[
                      {
                        validator: (_, value) => {
                          if (!value) return Promise.resolve()
                          try {
                            JSON.parse(value)
                            return Promise.resolve()
                          } catch {
                            return Promise.reject(new Error('JSON 格式错误'))
                          }
                        }
                      }
                    ]}
                  >
                    <TextArea rows={12} placeholder='[{"name": "step1", "method": "GET", "url": "..."}]' />
                  </Form.Item>
                )
              }
            ]}
          />
        </Form.Item>

        <Form.Item
          label="调度配置 (JSON)"
          name="schedule"
          rules={[
            {
              validator: (_, value) => {
                if (!value) return Promise.resolve()
                try {
                  JSON.parse(value)
                  return Promise.resolve()
                } catch {
                  return Promise.reject(new Error('JSON 格式错误'))
                }
              }
            }
          ]}
        >
          <TextArea
            rows={6}
            placeholder={`例如：
{
  "type": "dailyAfter",
  "hour": 8,
  "minute": 5,
  "randomDelaySeconds": 3600
}`}
          />
        </Form.Item>

        <Form.Item>
          <Space>
            <Button type="primary" htmlType="submit" loading={createSite.isPending || updateSite.isPending}>
              {isEdit ? '更新' : '创建'}
            </Button>
            <Button onClick={() => navigate('/sites')}>
              取消
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Card>
  )
}
