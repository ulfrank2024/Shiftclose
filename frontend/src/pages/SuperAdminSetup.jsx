import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { Shield, Eye, EyeOff, Loader, Check, AlertCircle, Lock } from 'lucide-react'

/**
 * Page de création initiale du compte Super Admin.
 * Accessible via /admin/setup
 * Protégée par une SETUP_KEY définie dans le .env du backend.
 */
export default function SuperAdminSetup() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirm: '',
    setupKey: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères')
      return
    }

    setLoading(true)
    try {
      const res = await authAPI.setupSuperAdmin({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        setupKey: form.setupKey
      })

      // Auto-login
      localStorage.setItem('token', res.token)
      setSuccess(true)
      setTimeout(() => navigate('/admin'), 1500)
    } catch (err) {
      setError(err.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-flex p-5 bg-green-500/10 rounded-full mb-4">
            <Check className="text-green-400" size={48} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Super Admin créé !</h1>
          <p className="text-slate-400">Redirection vers le panneau admin...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">

      {/* Header */}
      <div className="flex justify-center items-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center">
            <Shield className="text-white" size={20} />
          </div>
          <div>
            <span className="text-white font-bold text-xl block">ShiftClose</span>
            <span className="text-amber-400 text-xs">Configuration initiale</span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Info banner */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <Lock size={18} className="text-amber-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-amber-300 font-semibold text-sm">Configuration unique</p>
                <p className="text-slate-400 text-xs mt-0.5">
                  Cette page ne peut être utilisée qu'une seule fois. Après la création du Super Admin, elle devient inaccessible.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-7">
            <div className="text-center mb-6">
              <div className="inline-flex p-4 bg-amber-500/10 rounded-full mb-3">
                <Shield className="text-amber-400" size={36} />
              </div>
              <h1 className="text-xl font-bold text-white">Créer le Super Admin</h1>
              <p className="text-slate-400 text-sm mt-1">Compte administrateur principal de ShiftClose</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={14} className="shrink-0" /> {error}
                </div>
              )}

              {/* Name */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Prénom</label>
                  <input
                    type="text" name="firstName" value={form.firstName}
                    onChange={handleChange} placeholder="Ulrich" required
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Nom</label>
                  <input
                    type="text" name="lastName" value={form.lastName}
                    onChange={handleChange} placeholder="Lontsi" required
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} placeholder="admin@shiftclose.com" required
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Mot de passe (min. 8 caractères)</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password" value={form.password}
                    onChange={handleChange} placeholder="••••••••" required
                    className="w-full px-3 pr-10 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirmer le mot de passe</label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirm" value={form.confirm}
                  onChange={handleChange} placeholder="••••••••" required
                  className={`w-full px-3 py-2.5 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none text-sm ${
                    form.confirm && form.confirm !== form.password
                      ? 'border-red-500' : 'border-slate-600 focus:border-amber-500'
                  }`}
                />
              </div>

              {/* Setup Key */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Clé de configuration <span className="text-slate-500">(variable SETUP_KEY du .env)</span>
                </label>
                <div className="relative">
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input
                    type="password" name="setupKey" value={form.setupKey}
                    onChange={handleChange} placeholder="Clé secrète" required
                    className="w-full pl-8 pr-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                  />
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
              >
                {loading
                  ? <><Loader size={18} className="animate-spin" /> Création en cours...</>
                  : <><Shield size={18} /> Créer le Super Admin</>
                }
              </button>
            </form>
          </div>

          <p className="mt-4 text-center text-slate-500 text-xs">
            Déjà un compte ?{' '}
            <a href="/admin/login" className="text-amber-400 hover:text-amber-300">Se connecter</a>
          </p>
        </div>
      </div>
    </div>
  )
}
