import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import PWAUpdatePrompt from './components/PWAUpdatePrompt'
import InstallPrompt from './components/InstallPrompt'
import ScrollToTop from './components/ScrollToTop'
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
          <p className="text-slate-400 text-sm">Connexion en cours…</p>
          <p className="text-slate-600 text-xs mt-2">Le serveur démarre, veuillez patienter</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Si un token existe encore → le backend n'a pas répondu (cold start Render)
    // On ne redirige PAS vers login : on affiche un écran "réessayer"
    const hasToken = !!localStorage.getItem('token')
    if (hasToken) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-5">
              <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, marginBottom: '10px' }}>
              Serveur indisponible
            </h2>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
              Le serveur met du temps à démarrer. Cela arrive après une période d'inactivité.
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '12px 24px', borderRadius: '12px', border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontWeight: 600, fontSize: '15px'
              }}
            >
              Réessayer
            </button>
          </div>
        </div>
      )
    }
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
      {/* Scroll en haut à chaque changement de page */}
      <ScrollToTop />
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
