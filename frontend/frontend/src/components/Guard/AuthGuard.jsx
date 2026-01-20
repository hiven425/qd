import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

export default function AuthGuard({ children }) {
  const isAuthenticated = useAuth(state => state.isAuthenticated)

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}
