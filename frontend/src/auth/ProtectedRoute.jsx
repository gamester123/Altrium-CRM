import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from './AuthContext'
import Spinner from '../components/ui/Spinner'

export default function ProtectedRoute({ allow }) {
  const { user, loading } = useAuth()

  if (loading) return <Spinner label="Checking your session" />
  if (!user) return <Navigate to="/login" replace />
  if (allow && !allow.includes(user.role)) return <Navigate to="/access-denied" replace />

  return <Outlet />
}