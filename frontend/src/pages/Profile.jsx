import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import {
  User, Mail, Phone, Lock, Save, Eye, EyeOff,
  Camera, Loader2, CheckCircle, AlertCircle, X, Shield
} from 'lucide-react'

export default function Profile() {
  const { t } = useTranslation()
  const { user, refreshUser } = useAuth()
  const fileInputRef = useRef(null)

  const [formData, setFormData] = useState({
    firstName: user?.firstName || user?.first_name || '',
    lastName: user?.lastName || user?.last_name || '',
    email: user?.email || '',
    phone: user?.phone || ''
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  const [profileLoading, setProfileLoading]   = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [photoLoading, setPhotoLoading]       = useState(false)
  const [profileSuccess, setProfileSuccess]   = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [photoSuccess, setPhotoSuccess]       = useState(false)
  const [error, setError] = useState('')
  const [localPhoto, setLocalPhoto] = useState(null)

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setProfileLoading(true)
    setProfileSuccess(false)
    try {
      await authAPI.updateProfile({
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone
      })
      await refreshUser()
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('errors.passwordMismatch'))
      return
    }
    if (passwordData.newPassword.length < 6) {
      setError(t('errors.minLength', { min: 6 }))
      return
    }
    setPasswordLoading(true)
    setPasswordSuccess(false)
    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })
      setPasswordSuccess(true)
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
    } finally {
      setPasswordLoading(false)
    }
  }

  const handlePhotoClick = () => fileInputRef.current?.click()

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate: image only, max 5 MB
    if (!file.type.startsWith('image/')) {
      setError('Seules les images sont acceptées (JPG, PNG, WebP).')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('La photo ne doit pas dépasser 5 Mo.')
      return
    }

    // Immediate local preview
    setLocalPhoto(URL.createObjectURL(file))
    setPhotoLoading(true)
    setError('')

    try {
      await authAPI.uploadPhoto(file)
      await refreshUser()
      setPhotoSuccess(true)
      setTimeout(() => setPhotoSuccess(false), 3000)
    } catch (err) {
      setError(err.message)
      setLocalPhoto(null)
    } finally {
      setPhotoLoading(false)
      // Reset file input so same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const userInitials = `${(user?.firstName || user?.first_name || '?')[0]}${(user?.lastName || user?.last_name || '?')[0]}`
  const userName     = `${user?.firstName || user?.first_name || ''} ${user?.lastName || user?.last_name || ''}`

  return (
    <div className="animate-fade-in max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

      {/* ── Error ── */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 bg-red-500/10 border border-red-500/40 text-red-400 rounded-xl">
          <AlertCircle size={18} className="flex-shrink-0" />
          <span className="flex-1 text-sm">{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
            <X size={18} />
          </button>
        </div>
      )}

      {/* ── Profile Header ── */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div
              onClick={handlePhotoClick}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer group overflow-hidden"
              title="Changer la photo"
            >
              {(localPhoto || user?.photoURL) ? (
                <img
                  src={localPhoto || user.photoURL}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-3xl font-bold">{userInitials}</span>
              )}
              {/* Overlay: spinner during upload, camera icon on hover */}
              {photoLoading ? (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center rounded-full">
                  <Loader2 className="text-white animate-spin" size={28} />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="text-white" size={22} />
                  <span className="text-white text-xs font-medium">Modifier</span>
                </div>
              )}
            </div>

            {/* Camera badge — toujours visible */}
            {!photoLoading && !photoSuccess && (
              <button
                onClick={handlePhotoClick}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center border-2 border-slate-800 transition-colors shadow-lg"
                title="Changer la photo"
              >
                <Camera size={14} className="text-white" />
              </button>
            )}

            {/* Success badge */}
            {photoSuccess && (
              <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center border-2 border-slate-800">
                <CheckCircle size={14} className="text-white" />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* Info */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{userName}</h1>
            <p className="text-slate-400 mt-1">{user?.email}</p>
            {photoLoading && (
              <p className="text-xs text-slate-500 mt-1">Téléversement en cours...</p>
            )}
            <div className="mt-3 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm rounded-full capitalize font-medium">
                {user?.role || 'server'}
              </span>
              {user?.restaurants?.length > 0 && (
                <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 text-sm rounded-full font-medium">
                  {user.restaurants.length} {user.restaurants.length === 1 ? 'restaurant' : 'restaurants'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Informations personnelles ── */}
      <form onSubmit={handleProfileSubmit} className="card">
        {/* Card header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-xl">
              <User size={20} className="text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('profile.personalInfo')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Modifiez vos informations de profil</p>
            </div>
          </div>
          {profileSuccess && (
            <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
              <CheckCircle size={16} />
              {t('common.saved')}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/60 mb-6" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t('profile.firstName')}
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t('profile.lastName')}
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              <Mail size={14} className="inline mr-1.5" />
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-2">{t('profile.emailCannotChange')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              <Phone size={14} className="inline mr-1.5" />
              {t('profile.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (514) 123-4567"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={profileLoading}
              className="btn btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {profileLoading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
              {t('profile.updateProfile')}
            </button>
          </div>
        </div>
      </form>

      {/* ── Changer le mot de passe ── */}
      <form onSubmit={handlePasswordSubmit} className="card">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-xl">
              <Lock size={20} className="text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('profile.changePassword')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Mettez à jour votre mot de passe</p>
            </div>
          </div>
          {passwordSuccess && (
            <span className="flex items-center gap-1.5 text-green-400 text-sm font-medium">
              <CheckCircle size={16} />
              {t('profile.passwordChanged')}
            </span>
          )}
        </div>

        <div className="border-t border-slate-700/60 mb-6" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {[
            { key: 'current', label: t('profile.currentPassword'), field: 'currentPassword' },
            { key: 'new',     label: t('profile.newPassword'),     field: 'newPassword',    minLength: 6 },
            { key: 'confirm', label: t('auth.confirmPassword'),    field: 'confirmPassword' }
          ].map(({ key, label, field, minLength }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-slate-300 mb-3">{label}</label>
              <div className="relative">
                <input
                  type={showPasswords[key] ? 'text' : 'password'}
                  value={passwordData[field]}
                  onChange={(e) => setPasswordData({ ...passwordData, [field]: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  required
                  minLength={minLength}
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords({ ...showPasswords, [key]: !showPasswords[key] })}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  {showPasswords[key] ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
          ))}

          <div className="pt-2">
            <button
              type="submit"
              disabled={passwordLoading}
              className="btn btn-primary w-full sm:w-auto disabled:opacity-50"
            >
              {passwordLoading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
              {t('profile.changePassword')}
            </button>
          </div>
        </div>
      </form>

      {/* ── Zone danger ── */}
      <div className="card" style={{ borderColor: 'rgba(239,68,68,0.25)' }}>
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-red-500/10 rounded-xl">
            <Shield size={20} className="text-red-400" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-red-400">{t('profile.dangerZone')}</h3>
            <p className="text-xs text-slate-400 mt-0.5">Actions irréversibles sur votre compte</p>
          </div>
        </div>

        <div className="border-t border-red-500/15 mb-6" />

        <p className="text-slate-400 text-sm mb-5 leading-relaxed">{t('profile.deleteAccountWarning')}</p>
        <button className="btn bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20">
          {t('profile.deleteAccount')}
        </button>
      </div>

    </div>
  )
}
