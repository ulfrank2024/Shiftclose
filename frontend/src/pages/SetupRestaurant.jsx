import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { setupAPI } from '../services/api'
import {
  Building2, User, Lock, Eye, EyeOff,
  Check, Loader, AlertCircle, ChevronRight
} from 'lucide-react'

export default function SetupRestaurant() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [info, setInfo] = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [infoError, setInfoError] = useState('')

  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const fetchInfo = async () => {
      try {
        const res = await setupAPI.getInfo(token)
        setInfo(res.invitation)
      } catch (err) {
        setInfoError(err.message)
      } finally {
        setLoadingInfo(false)
      }
    }
    fetchInfo()
  }, [token])

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.firstName || !form.lastName || !form.password) {
      setError('Tous les champs sont requis')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères')
      return
    }
    if (form.password !== form.confirm) {
      setError('Les mots de passe ne correspondent pas')
      return
    }

    setSubmitting(true)
    try {
      const res = await setupAPI.complete(token, {
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password
      })

      // Auto-login: store token and load profile
      localStorage.setItem('token', res.token)
      localStorage.setItem('currentRestaurant', JSON.stringify(res.user.restaurants[0]))

      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2000)
    } catch (err) {
      setError(err.message || 'Erreur lors de la configuration')
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading ──
  if (loadingInfo) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader className="text-amber-500 animate-spin" size={36} />
      </div>
    )
  }

  // ── Invalid / expired ──
  if (infoError) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex p-4 bg-red-500/10 rounded-full mb-4">
            <AlertCircle className="text-red-400" size={40} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Invitation invalide</h1>
          <p className="text-slate-400 mb-6">{infoError}</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors"
          >
            Retour à la connexion
          </a>
        </div>
      </div>
    )
  }

  // ── Success ──
  if (success) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="inline-flex p-5 bg-green-500/10 rounded-full mb-4">
            <Check className="text-green-400" size={48} />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Restaurant configuré !</h1>
          <p className="text-slate-400 mb-2">
            Bienvenue sur ShiftClose, <strong className="text-white">{form.firstName}</strong> !
          </p>
          <p className="text-slate-400">Redirection vers votre tableau de bord...</p>
          <div className="mt-4 w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto" />
        </div>
      </div>
    )
  }

  // ── Form ──
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">

      {/* Header */}
      <div className="flex justify-center items-center p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
            <Building2 className="text-white" size={20} />
          </div>
          <span className="text-white font-bold text-xl">ShiftClose</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">

          {/* Invitation card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/30 rounded-2xl p-5 mb-6 text-center">
            <div className="inline-flex p-3 bg-amber-500/10 rounded-full mb-3">
              <Building2 className="text-amber-400" size={28} />
            </div>
            <h2 className="text-white font-bold text-lg mb-1">
              Configurez votre restaurant
            </h2>
            <p className="text-amber-300 font-semibold text-base mb-1">
              {info?.restaurantName}
            </p>
            <p className="text-slate-400 text-sm">
              Invitation de <span className="text-slate-300">{info?.invitedByName}</span>
            </p>
            <div className="mt-3 px-3 py-1.5 bg-slate-800/60 rounded-lg inline-block">
              <span className="text-slate-400 text-sm">Email : </span>
              <span className="text-white text-sm font-medium">{info?.email}</span>
            </div>
          </div>

          {/* Form card */}
          <div className="bg-slate-800/60 backdrop-blur border border-slate-700 rounded-2xl p-7">
            <h1 className="text-xl font-bold text-white mb-1">Créer votre compte Manager</h1>
            <p className="text-slate-400 text-sm mb-6">
              Votre restaurant sera automatiquement créé après l'inscription.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">

              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              {/* Name row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Prénom</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Jean"
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Dupont"
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 caractères"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-900 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm */}
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1.5">Confirmer le mot de passe</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Répétez le mot de passe"
                    className={`w-full pl-9 pr-3 py-2.5 bg-slate-900 border rounded-lg text-white placeholder-slate-500 focus:outline-none text-sm ${
                      form.confirm && form.confirm !== form.password
                        ? 'border-red-500'
                        : 'border-slate-600 focus:border-amber-500'
                    }`}
                    required
                  />
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p className="text-red-400 text-xs mt-1">Les mots de passe ne correspondent pas</p>
                )}
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
              >
                {submitting
                  ? <><Loader size={18} className="animate-spin" /> Configuration en cours...</>
                  : <><Check size={18} /> Créer mon compte et mon restaurant</>
                }
              </button>
            </form>
          </div>

          {/* Steps */}
          <div className="mt-5 flex items-center justify-center gap-2 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-amber-500/20 border border-amber-500/50 flex items-center justify-center text-amber-400 font-bold">1</div>
              <span>Votre profil</span>
            </div>
            <ChevronRight size={14} />
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-500 font-bold">2</div>
              <span>Votre restaurant</span>
            </div>
            <ChevronRight size={14} />
            <div className="flex items-center gap-1">
              <div className="w-5 h-5 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center text-slate-500 font-bold">3</div>
              <span>Votre équipe</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
