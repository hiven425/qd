import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Form, Input, Button, Card, message } from 'antd'
import { LockOutlined } from '@ant-design/icons'
import { useAuth } from '../../hooks/useAuth'
import { authService } from '../../services/auth'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const login = useAuth(state => state.login)

  const onFinish = async (values) => {
    setLoading(true)
    try {
      await authService.login(values.token)
      login(values.token)
      message.success('登录成功')
      navigate('/dashboard')
    } catch (error) {
      message.error('认证失败，请检查 Token')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card title="CheckinHub 登录" style={{ width: 400 }}>
        <Form onFinish={onFinish} autoComplete="off">
          <Form.Item name="token" rules={[{ required: true, message: '请输入 Admin Token' }]}>
            <Input.Password prefix={<LockOutlined />} placeholder="Admin Token" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
