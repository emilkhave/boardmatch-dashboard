import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/auth'
import { DataProvider } from './lib/store'
import { Login } from './pages/Login'
import { AdminLayout } from './components/AdminLayout'
import { AdminOverview } from './pages/admin/AdminOverview'
import { AdminCompanies } from './pages/admin/AdminCompanies'
import { AdminCompanyDetail } from './pages/admin/AdminCompanyDetail'
import { AdminCandidates } from './pages/admin/AdminCandidates'
import { AdminMatches } from './pages/admin/AdminMatches'
import { CompanyLayout } from './components/CompanyLayout'
import { CompanyDashboard } from './pages/CompanyDashboard'
import { CompanySettings } from './pages/CompanySettings'
import type { Role } from './types'

function RequireRole({ role, children }: { role: Role; children: React.ReactNode }) {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  if (session.role !== role) {
    return <Navigate to={session.role === 'admin' ? '/admin' : '/company'} replace />
  }
  return <>{children}</>
}

function LandingRedirect() {
  const { session } = useAuth()
  if (!session) return <Navigate to="/login" replace />
  return <Navigate to={session.role === 'admin' ? '/admin' : '/company'} replace />
}

export default function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingRedirect />} />
          <Route path="/login" element={<Login />} />

          {/* Admin */}
          <Route
            path="/admin"
            element={
              <RequireRole role="admin">
                <AdminLayout />
              </RequireRole>
            }
          >
            <Route index element={<AdminOverview />} />
            <Route path="companies" element={<AdminCompanies />} />
            <Route path="companies/:id" element={<AdminCompanyDetail />} />
            <Route path="candidates" element={<AdminCandidates />} />
            <Route path="matches" element={<AdminMatches />} />
          </Route>

          {/* Company */}
          <Route
            path="/company"
            element={
              <RequireRole role="company">
                <CompanyLayout />
              </RequireRole>
            }
          >
            <Route index element={<CompanyDashboard />} />
            <Route path="settings" element={<CompanySettings />} />
          </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </DataProvider>
    </AuthProvider>
  )
}
