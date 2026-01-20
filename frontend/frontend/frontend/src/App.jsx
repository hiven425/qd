import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClientProvider } from '@tanstack/react-query'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { queryClient } from './lib/queryClient'
import AuthGuard from './components/Guard/AuthGuard'
import AppLayout from './components/Layout/AppLayout'
import Login from './pages/Auth/Login'
import SiteList from './pages/Sites/SiteList'
import SiteEdit from './pages/Sites/SiteEdit'
import RunList from './pages/Runs/RunList'

function Dashboard() {
  return <div>Dashboard - 开发中</div>
}

function HarImport() {
  return <div>HAR 导入 - 开发中</div>
}

export default function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<AuthGuard><AppLayout /></AuthGuard>}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="sites" element={<SiteList />} />
              <Route path="sites/new" element={<SiteEdit />} />
              <Route path="sites/:id" element={<SiteEdit />} />
              <Route path="runs" element={<RunList />} />
              <Route path="har" element={<HarImport />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </QueryClientProvider>
    </ConfigProvider>
  )
}
