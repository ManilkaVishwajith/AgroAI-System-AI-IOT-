import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'

export default function ProtectedRoute({ children }) {
  const { token, isAdmin } = useAuth()
  const location = useLocation()

  if (!token || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}