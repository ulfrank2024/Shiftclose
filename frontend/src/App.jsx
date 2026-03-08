import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import InstallPrompt from './components/InstallPrompt'
import Login from './pages/Login'
import Register from './pages/Register'
import AcceptInvite from './pages/AcceptInvite'
import SetupRestaurant from './pages/SetupRestaurant'
import Dashboard from './pages/Dashboard'
import CashOut from './pages/CashOut'
import Reports from './pages/Reports'
import Team from './pages/Team'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import Admin from './pages/Admin'
import AdminLogin from './pages/AdminLogin'
import SuperAdminSetup from './pages/SuperAdminSetup'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import MyTips from './pages/MyTips'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400">Chargement...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated) {
    // Redirect superadmin to admin panel
    if (user?.role === 'superadmin') {
      return <Navigate to="/admin" replace />
    }
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function AdminPublicRoute({ children }) {
  const { isAuthenticated, loading, user } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (isAuthenticated && user?.role === 'superadmin') {
    return <Navigate to="/admin" replace />
  }

  return children
}

function ManagerRoute({ children }) {
  const { isManager, loading } = useAuth()

  if (loading) return null  // ProtectedRoute gère déjà le spinner

  if (!isManager) {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

function CashOutRoute({ children }) {
  const { currentRestaurant, loading } = useAuth()

  if (loading) return null  // ProtectedRoute gère déjà le spinner

  const canDoCashout = currentRestaurant?.canDoCashout !== false
  if (!canDoCashout) {
    return <Navigate to="/my-tips" replace />
  }

  return children
}

function SuperAdminRoute({ children }) {
  const { user, loading } = useAuth()

  if (loading) return null  // ProtectedRoute gère déjà le spinner

  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      {/* Bannière mise à jour PWA (s'affiche quand nouvelle version dispo) */}
      <PWAUpdatePrompt />
      {/* Bouton installation PWA (Android, Desktop, iOS) */}
      <InstallPrompt />
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password/:token"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Admin Login - Separate entry point for Super Admin */}
        <Route
          path="/admin/login"
          element={
            <AdminPublicRoute>
              <AdminLogin />
            </AdminPublicRoute>
          }
        />

        {/* Super Admin first-time setup */}
        <Route path="/admin/setup" element={<SuperAdminSetup />} />

        {/* Invitation Routes */}
        <Route path="/invite/:token" element={<AcceptInvite />} />
        <Route path="/setup-restaurant/:token" element={<SetupRestaurant />} />

        {/* Protected Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/cash-out" element={<CashOutRoute><CashOut /></CashOutRoute>} />
          <Route path="/my-tips" element={<MyTips />} />
          <Route path="/reports" element={<Reports />} />
          <Route
            path="/team"
            element={
              <ManagerRoute>
                <Team />
              </ManagerRoute>
            }
          />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/admin"
            element={
              <SuperAdminRoute>
                <Admin />
              </SuperAdminRoute>
            }
          />
        </Route>

        {/* Redirect root to dashboard or login */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 - Redirect to dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
