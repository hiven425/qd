import { Layout, Menu } from 'antd'
import { Link, useLocation } from 'react-router-dom'
import { DashboardOutlined, AppstoreOutlined, HistoryOutlined, ImportOutlined } from '@ant-design/icons'

const { Sider } = Layout

export default function Sidebar() {
  const location = useLocation()

  const items = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">控制面板</Link> },
    { key: '/sites', icon: <AppstoreOutlined />, label: <Link to="/sites">站点管理</Link> },
    { key: '/runs', icon: <HistoryOutlined />, label: <Link to="/runs">执行历史</Link> },
    { key: '/har', icon: <ImportOutlined />, label: <Link to="/har">HAR 导入</Link> }
  ]

  return (
    <Sider width={200}>
      <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
        CheckinHub
      </div>
      <Menu theme="dark" mode="inline" selectedKeys={[location.pathname]} items={items} />
    </Sider>
  )
}
