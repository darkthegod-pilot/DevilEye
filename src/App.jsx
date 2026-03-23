import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider, useApp } from '@/context/AppContext'
import { Layout } from '@/components/layout/Layout'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { Cases } from '@/components/cases/Cases'
import { CaseDetail } from '@/components/case-detail/CaseDetail'
import { Login } from '@/components/auth/Login'

function ProtectedRoute({ children }) {
  const { isAuthChecked, currentUser } = useApp()
  if (!isAuthChecked) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }
  if (!currentUser) return <Navigate to="login" replace />
  return children
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="login" element={<Login />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="cases" element={<Cases />} />
            <Route path="cases/:caseId" element={<CaseDetail />} />
            <Route path="cases/:caseId/:tab" element={<CaseDetail />} />
            <Route path="*" element={<Navigate to="dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AppProvider>
  )
}
