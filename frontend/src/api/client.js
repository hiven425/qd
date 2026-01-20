import axios from 'axios'
import { useAuthStore } from '../store/authStore'
import { message } from 'antd'

const client = axios.create({
    baseURL: '/api',
    timeout: 10000,
})

client.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

client.interceptors.response.use(
    (response) => response.data,
    (error) => {
        const msg = error.response?.data?.detail || error.message
        message.error(`请求失败: ${msg}`)
        return Promise.reject(error)
    }
)

export default client
