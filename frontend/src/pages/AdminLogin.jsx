import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, Loader2, Shield } from 'lucide-react'

export default function AdminLogin() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const userData = await login(email, password)

      // Verify this is a superadmin
      if (userData.role !== 'superadmin') {
        setError('Accès réservé aux administrateurs')
        // Logout if not superadmin
        localStorage.removeItem('token')
        setLoading(false)
        return
      }

      navigate('/admin')
    } catch (err) {
      setError(err.message || t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-center items-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center">
            <Shield className="text-white" size={28} />
          </div>
          <div>
            <span className="text-white font-bold text-2xl block">ShiftClose</span>
            <span className="text-amber-400 text-sm">Administration</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <div className="bg-slate-800/50 backdrop-blur border border-slate-700 rounded-2xl p-8">
            <div className="text-center mb-8">
              <div className="inline-flex p-4 bg-amber-500/10 rounded-full mb-4">
                <Shield className="text-amber-400" size={40} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                Panneau Administrateur
              </h1>
              <p className="text-slate-400">
                Accès réservé au Super Admin
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm animate-fade-in">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Email administrateur
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@shiftclose.com"
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Mot de passe
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 pr-12 focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    Connexion...
                  </>
                ) : (
                  <>
                    <Shield size={20} />
                    Accéder au panneau
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-6 text-center text-slate-500 text-sm">
            Vous êtes un restaurant ?{' '}
            <a href="/login" className="text-blue-400 hover:text-blue-300">
              Connectez-vous ici
            </a>
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-4 text-slate-500 text-sm">
        ShiftClose © 2026 - Panneau d'administration sécurisé
      </div>
    </div>
  )
}
