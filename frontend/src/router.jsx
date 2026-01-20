import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Dashboard from './pages/Dashboard'
import SiteEdit from './pages/SiteEdit'

export const router = createBrowserRouter([
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                path: '/',
                element: <Dashboard />,
            },
            {
                path: '/sites/:id',
                element: <SiteEdit />
            },
            {
                path: '/settings',
                element: <div>设置页面（开发中）</div>
            }
        ],
    },
])
