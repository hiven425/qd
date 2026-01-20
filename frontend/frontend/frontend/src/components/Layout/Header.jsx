import { Layout, Button } from 'antd'
import { LogoutOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const { Header: AntHeader } = Layout

export default function Header() {
  const navigate = useNavigate()
  const logout = useAuth(state => state.logout)

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <AntHeader style={{ background: '#fff', padding: '0 24px', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Button icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Button>
    </AntHeader>
  )
}
