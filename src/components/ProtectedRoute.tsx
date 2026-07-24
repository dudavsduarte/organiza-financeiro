import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading-screen"><div className="loader"/>Carregando seu painel...</div>
  if (!user) return <Navigate to="/entrar" replace />
  if (user.access_status !== 'active') return <Navigate to="/acesso" replace />
  return <Outlet />
}
