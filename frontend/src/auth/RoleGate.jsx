import { useAuth } from './AuthContext'

export default function RoleGate({ allow, children, fallback = null }) {
  const { user } = useAuth()
  if (!user || !allow.includes(user.role)) return fallback
  return children
}