import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider, useAuth } from './auth/AuthContext'
import { setErrorHandlers } from './api/client'
import ProtectedRoute from './auth/ProtectedRoute'
import { ROLES } from './auth/roles'
import AppShell from './components/layout/AppShell'
import LoginPage from './pages/LoginPage'
import AdminLoginPage from './pages/AdminLoginPage'
import DashboardPage from './pages/DashboardPage'
import UserManagementPage from './pages/UserManagementPage'
import AccessDeniedPage from './pages/AccessDeniedPage'
import NotFoundPage from './pages/NotFoundPage'
import CompaniesListPage from './pages/companies/CompaniesListPage'
import CompanyDetailPage from './pages/companies/CompanyDetailPage'
import PipelineBoardPage from './pages/pipeline/PipelineBoardPage'
import DealDetailPage from './pages/deals/DealDetailPage'
import ContactDetailPage from './pages/contacts/ContactDetailPage'
import LeadsListPage from './pages/leads/LeadsListPage'

// bridges the non-React axios interceptors to the router
function ApiErrorBridge() {
  const navigate = useNavigate()
  const { logout } = useAuth()

  useEffect(() => {
    setErrorHandlers({
      unauthorized: () => {
        logout()
        navigate('/login', { replace: true })
      },
      forbidden: () => {
        if (
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/admin/login'
        ) {
          navigate('/access-denied', { replace: true })
        }
      },
    })
  }, [navigate, logout])

  return null
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ApiErrorBridge />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/companies" element={<CompaniesListPage />} />
              <Route path="/pipeline" element={<PipelineBoardPage />} />
              <Route path="/companies/:id" element={<CompanyDetailPage />} />
              <Route path="/deals/:id" element={<DealDetailPage />} />
              <Route path="/contacts/:id" element={<ContactDetailPage />} />    
              <Route path="/leads" element={<LeadsListPage />} />
              
              <Route element={<ProtectedRoute allow={[ROLES.ADMIN]} />}>
                <Route path="/admin/users" element={<UserManagementPage />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}