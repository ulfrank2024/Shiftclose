import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { invitationAPI, authAPI } from '../services/api'
import {
  Eye, EyeOff, Globe, Loader2, UserPlus, Building2,
  CheckCircle, XCircle, Mail
} from 'lucide-react'

export default function AcceptInvite() {
  const { token } = useParams()
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const { login, isAuthenticated, user } = useAuth()
  const navigate = useNavigate()

  const [invitation, setInvitation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1: loading, 2: create account, 3: login existing
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  // Load invitation info
  useEffect(() => {
    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      const response = await invitationAPI.getInfo(token)
      setInvitation(response.invitation)
      setFormData(prev => ({ ...prev, email: response.invitation.email }))

      // Check if user is already logged in with matching email
      if (isAuthenticated && user?.email === response.invitation.email) {
        setStep(3)
      } else {
        setStep(2)
      }
    } catch (err) {
      setError(err.message || t('errors.invitationInvalid'))
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleCreateAccount = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'))
      return
    }

    if (formData.password.length < 6) {
      setError(t('errors.minLength', { min: 6 }))
      return
    }

    setSubmitting(true)

    try {
      // Create account
      await authAPI.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      })

      // Login
      await login(formData.email, formData.password)

      // Accept invitation
      await invitationAPI.accept(token)

      navigate('/dashboard')
    } catch (err) {
      setError(err.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleAcceptAsLoggedIn = async () => {
    setSubmitting(true)
    try {
      await invitationAPI.accept(token)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || t('common.error'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (error && !invitation) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="inline-flex p-4 bg-red-500/10 rounded-full mb-6">
            <XCircle className="w-12 h-12 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            {t('invitation.invalid')}
          </h1>
          <p className="text-slate-400 mb-8">{error}</p>
          <Link to="/login" className="btn btn-primary">
            {t('auth.login')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-xl">S</span>
          </div>
          <span className="text-white font-semibold text-xl">ShiftClose</span>
        </div>
        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
        >
          <Globe size={18} />
          <span className="text-sm font-medium uppercase">{language}</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* Invitation Info */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 mb-8">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-14 h-14 bg-blue-500/20 rounded-xl flex items-center justify-center">
                <Building2 className="text-blue-400" size={28} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {invitation?.restaurantName}
                </h2>
                <p className="text-slate-400 text-sm">
                  {t('invitation.invitedBy')} {invitation?.invitedByName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full capitalize">
                {invitation?.role === 'manager' ? t('roles.manager') : t('roles.server')}
              </span>
              <span className="text-slate-500">•</span>
              <span className="text-slate-400 flex items-center gap-1">
                <Mail size={14} />
                {invitation?.email}
              </span>
            </div>
          </div>

          {/* Step 2: Create Account */}
          {step === 2 && (
            <>
              <div className="text-center mb-8">
                <div className="inline-flex p-3 bg-green-500/10 rounded-xl mb-4">
                  <UserPlus className="text-green-400" size={32} />
                </div>
                <h1 className="text-2xl font-bold text-white mb-2">
                  {t('invitation.createAccount')}
                </h1>
                <p className="text-slate-400">
                  {t('invitation.createAccountDesc')}
                </p>
              </div>

              <form onSubmit={handleCreateAccount} className="space-y-5">
                {error && (
                  <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('profile.firstName')}
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Jean"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      {t('profile.lastName')}
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Dupont"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    disabled
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      required
                      minLength={6}
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

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn btn-primary py-3 text-base disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      {t('invitation.acceptAndCreate')}
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-slate-400 text-sm">
                {t('auth.hasAccount')}{' '}
                <Link to={`/login?redirect=/invite/${token}`} className="text-blue-400 hover:text-blue-300">
                  {t('auth.login')}
                </Link>
              </p>
            </>
          )}

          {/* Step 3: Already logged in */}
          {step === 3 && (
            <div className="text-center">
              <div className="inline-flex p-3 bg-green-500/10 rounded-xl mb-4">
                <CheckCircle className="text-green-400" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-white mb-2">
                {t('invitation.readyToJoin')}
              </h1>
              <p className="text-slate-400 mb-8">
                {t('invitation.clickToAccept')}
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm mb-6">
                  {error}
                </div>
              )}

              <button
                onClick={handleAcceptAsLoggedIn}
                disabled={submitting}
                className="w-full btn btn-primary py-3 text-base disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="animate-spin" size={20} />
                    {t('common.loading')}
                  </>
                ) : (
                  <>
                    <CheckCircle size={20} />
                    {t('invitation.accept')}
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
