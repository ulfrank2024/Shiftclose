import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { authAPI } from '../services/api'
import { Eye, EyeOff, Globe, Loader2, Store, User, ChevronRight, ChevronLeft, Camera, X } from 'lucide-react'

export default function Register() {
  const { t } = useTranslation()
  const { register } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  const [step, setStep] = useState(1) // 1: Restaurant info, 2: Personal info
  const [formData, setFormData] = useState({
    // Restaurant info
    restaurantName: '',
    address: '',
    // Personal info
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const photoRef = useRef(null)
  const [photoFile, setPhotoFile] = useState(null)
  const [localPhoto, setLocalPhoto] = useState(null)

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePhotoSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Seules les images sont acceptées.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('La photo ne doit pas dépasser 5 Mo.'); return }
    setPhotoFile(file)
    setLocalPhoto(URL.createObjectURL(file))
    setError('')
  }

  const removePhoto = (e) => {
    e.stopPropagation()
    setPhotoFile(null)
    setLocalPhoto(null)
    if (photoRef.current) photoRef.current.value = ''
  }

  const handleNextStep = (e) => {
    e.preventDefault()
    if (!formData.restaurantName.trim()) {
      setError(t('errors.required'))
      return
    }
    setError('')
    setStep(2)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    // Validate
    if (formData.password !== formData.confirmPassword) {
      setError(t('errors.passwordMismatch'))
      return
    }

    if (formData.password.length < 6) {
      setError(t('errors.minLength', { min: 6 }))
      return
    }

    setLoading(true)

    try {
      await register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        restaurantName: formData.restaurantName,
        restaurantAddress: formData.address
      })
      // Upload photo after registration (token is now stored)
      if (photoFile) {
        try { await authAPI.uploadPhoto(photoFile) } catch (_) { /* silent */ }
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
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
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 1 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              1
            </div>
            <div className={`w-12 h-1 rounded ${step >= 2 ? 'bg-blue-500' : 'bg-slate-700'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
              step >= 2 ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
            }`}>
              2
            </div>
          </div>

          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-blue-500/10 rounded-xl mb-4">
              {step === 1 ? (
                <Store className="text-blue-400" size={32} />
              ) : (
                <User className="text-blue-400" size={32} />
              )}
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">
              {step === 1 ? t('register.restaurantStep') : t('register.personalStep')}
            </h1>
            <p className="text-slate-400">
              {step === 1 ? t('register.restaurantDesc') : t('register.personalDesc')}
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg text-sm animate-fade-in mb-6">
              {error}
            </div>
          )}

          {/* Step 1: Restaurant Info */}
          {step === 1 && (
            <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('settings.restaurantName')} *
                </label>
                <input
                  type="text"
                  name="restaurantName"
                  value={formData.restaurantName}
                  onChange={handleChange}
                  placeholder="Ex: Le Petit Bistro"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('settings.address')}
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="123 Rue Principale, Montréal"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                className="w-full btn btn-primary py-3 text-base"
              >
                {t('common.next')}
                <ChevronRight size={20} />
              </button>
            </form>
          )}

          {/* Step 2: Personal Info */}
          {step === 2 && (
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

              {/* ── Photo (optional) ── */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                <div
                  onClick={() => photoRef.current?.click()}
                  style={{
                    position: 'relative',
                    width: '88px', height: '88px',
                    borderRadius: '50%',
                    background: localPhoto ? 'transparent' : 'linear-gradient(135deg,#1e3a5f,#1e293b)',
                    border: localPhoto ? 'none' : '2px dashed #475569',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={e => { if (!localPhoto) e.currentTarget.style.borderColor = '#3b82f6' }}
                  onMouseLeave={e => { if (!localPhoto) e.currentTarget.style.borderColor = '#475569' }}
                >
                  {localPhoto ? (
                    <>
                      <img src={localPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      {/* Hover overlay */}
                      <div style={{
                        position: 'absolute', inset: 0,
                        backgroundColor: 'rgba(0,0,0,0.45)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        opacity: 0, transition: 'opacity 0.2s', borderRadius: '50%'
                      }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                      >
                        <Camera color="white" size={22} />
                      </div>
                    </>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#64748b' }}>
                      <Camera size={26} />
                      <span style={{ fontSize: '11px', fontWeight: 500 }}>Photo</span>
                    </div>
                  )}
                </div>

                <div style={{ textAlign: 'center' }}>
                  <p style={{ color: '#94a3b8', fontSize: '13px' }}>
                    Photo de profil <span style={{ color: '#64748b' }}>(optionnel)</span>
                  </p>
                  {localPhoto && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      style={{ marginTop: '4px', color: '#ef4444', fontSize: '12px', background: 'none', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                    >
                      <X size={12} /> Supprimer
                    </button>
                  )}
                </div>
                <input
                  ref={photoRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoSelect}
                  style={{ display: 'none' }}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('profile.firstName')} *
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    placeholder="Jean"
                    className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    {t('profile.lastName')} *
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
                  {t('auth.email')} *
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="votre@email.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  {t('auth.password')} *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min. 6 caractères"
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
                  {t('auth.confirmPassword')} *
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirmez votre mot de passe"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn bg-slate-700 hover:bg-slate-600 text-white py-3"
                >
                  <ChevronLeft size={20} />
                  {t('common.back')}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 btn btn-primary py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <Loader2 className="animate-spin" size={20} />
                      {t('common.loading')}
                    </>
                  ) : (
                    <>
                      <Store size={20} />
                      {t('register.createRestaurant')}
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          <p className="mt-8 text-center text-slate-400">
            {t('auth.hasAccount')}{' '}
            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
              {t('auth.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
