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
import CampaignDashboardPage from './pages/CampaignDashboardPage'

// Bridges the non-React axios interceptors to the router
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
          {/* Authentication */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
          <Route path="/access-denied" element={<AccessDeniedPage />} />

          {/* Authenticated application */}
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>

              {/* Overview */}
              <Route
                path="/"
                element={<Navigate to="/dashboard" replace />}
              />

              <Route
                path="/dashboard"
                element={<DashboardPage />}
              />

              {/* Leads
                  Marketing, Sales Rep, Manager, Leadership and Admin
                  can access Leads.
              */}
              <Route
                path="/leads"
                element={<LeadsListPage />}
              />

              {/* Campaign Dashboard
                  Marketing, Leadership and Admin only.
              */}
              <Route
                element={
                  <ProtectedRoute
                    allow={[
                      ROLES.MARKETING,
                      ROLES.LEADERSHIP,
                      ROLES.ADMIN,
                    ]}
                  />
                }
              >
                <Route
                  path="/campaigns"
                  element={<CampaignDashboardPage />}
                />
              </Route>

              {/* Sales / CRM area
                  Marketing is intentionally excluded.
              */}
              <Route
                element={
                  <ProtectedRoute
                    allow={[
                      ROLES.REP,
                      ROLES.MANAGER,
                      ROLES.LEADERSHIP,
                      ROLES.ADMIN,
                    ]}
                  />
                }
              >
                <Route
                  path="/companies"
                  element={<CompaniesListPage />}
                />

                <Route
                  path="/companies/:id"
                  element={<CompanyDetailPage />}
                />

                <Route
                  path="/pipeline"
                  element={<PipelineBoardPage />}
                />

                <Route
                  path="/deals/:id"
                  element={<DealDetailPage />}
                />

                <Route
                  path="/contacts/:id"
                  element={<ContactDetailPage />}
                />
              </Route>

              {/* User Management
                  Admin only.
              */}
              <Route
                element={
                  <ProtectedRoute allow={[ROLES.ADMIN]} />
                }
              >
                <Route
                  path="/admin/users"
                  element={<UserManagementPage />}
                />
              </Route>

            </Route>
          </Route>

          {/* Anything else */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}