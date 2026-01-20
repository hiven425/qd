import React from 'react'
import { Layout, Menu, theme } from 'antd'
import { DashboardOutlined, SettingOutlined, ThunderboltOutlined } from '@ant-design/icons'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'

const { Header, Content, Sider } = Layout

export default function MainLayout() {
    const {
        token: { colorBgContainer, borderRadiusLG },
    } = theme.useToken()

    const navigate = useNavigate()
    const location = useLocation()

    const menuItems = [
        {
            key: '/',
            icon: <DashboardOutlined />,
            label: '仪表盘',
        },
        {
            key: '/settings',
            icon: <SettingOutlined />,
            label: '系统设置',
        },
    ]

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Sider breakpoint="lg" collapsedWidth="0">
                <div style={{ height: 32, margin: 16, background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center', color: '#fff', lineHeight: '32px', fontWeight: 'bold' }}>
                    CheckinHub
                </div>
                <Menu
                    theme="dark"
                    mode="inline"
                    selectedKeys={[location.pathname]}
                    items={menuItems}
                    onClick={({ key }) => navigate(key)}
                />
            </Sider>
            <Layout>
                <Header style={{ padding: 0, background: colorBgContainer }} />
                <Content style={{ margin: '24px 16px 0' }}>
                    <div
                        style={{
                            padding: 24,
                            minHeight: 360,
                            background: colorBgContainer,
                            borderRadius: borderRadiusLG,
                        }}
                    >
                        <Outlet />
                    </div>
                </Content>
            </Layout>
        </Layout>
    )
}
