import { createBrowserRouter } from 'react-router-dom'
import MainLayout from './layout/MainLayout'
import Dashboard from './pages/Dashboard'
import SiteEdit from './pages/SiteEdit'
import Settings from './pages/Settings'

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
                element: <Settings />
            }
        ],
    },
])
