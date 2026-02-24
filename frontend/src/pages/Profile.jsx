import { useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import {
  User, Mail, Phone, Lock, Save, Eye, EyeOff,
  Camera, Loader2, CheckCircle, AlertCircle, X
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

  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [error, setError] = useState('')

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

  const handlePhotoClick = () => {
    fileInputRef.current?.click()
  }

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    // TODO: Upload to Supabase Storage
    console.log('Photo selected:', file.name)
  }

  const userInitials = `${(user?.firstName || user?.first_name || '?')[0]}${(user?.lastName || user?.last_name || '?')[0]}`
  const userName = `${user?.firstName || user?.first_name || ''} ${user?.lastName || user?.last_name || ''}`

  return (
    <div className="space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* Error Message */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={18} />
          {error}
          <button onClick={() => setError('')} className="ml-auto">
            <X size={18} />
          </button>
        </div>
      )}

      {/* Profile Header with Photo */}
      <div className="card">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Profile Photo */}
          <div className="relative">
            <div
              onClick={handlePhotoClick}
              className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer group overflow-hidden"
            >
              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={userName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-white text-3xl font-bold">
                  {userInitials}
                </span>
              )}

              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="text-white" size={24} />
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-bold text-white">{userName}</h1>
            <p className="text-slate-400">{user?.email}</p>
            <div className="mt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-sm rounded-full capitalize">
                {user?.role || 'server'}
              </span>
              {user?.restaurants?.length > 0 && (
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-sm rounded-full">
                  {user.restaurants.length} {user.restaurants.length === 1 ? 'restaurant' : 'restaurants'}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Personal Info */}
      <form onSubmit={handleProfileSubmit} className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <User size={20} className="text-blue-400" />
            <h2 className="text-lg font-semibold text-white">{t('profile.personalInfo')}</h2>
          </div>
          {profileSuccess && (
            <span className="flex items-center gap-1 text-green-400 text-sm">
              <CheckCircle size={16} />
              {t('common.saved')}
            </span>
          )}
        </div>

        <div className="space-y-5">
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
              <Mail size={14} className="inline mr-1" />
              {t('auth.email')}
            </label>
            <input
              type="email"
              value={formData.email}
              disabled
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-400 cursor-not-allowed"
            />
            <p className="text-xs text-slate-500 mt-1">{t('profile.emailCannotChange')}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              <Phone size={14} className="inline mr-1" />
              {t('profile.phone')}
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (514) 123-4567"
              className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={profileLoading}
            className="btn btn-primary w-full sm:w-auto disabled:opacity-50"
          >
            {profileLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Save size={18} />
            )}
            {t('profile.updateProfile')}
          </button>
        </div>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordSubmit} className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Lock size={20} className="text-amber-400" />
            <h2 className="text-lg font-semibold text-white">{t('profile.changePassword')}</h2>
          </div>
          {passwordSuccess && (
            <span className="flex items-center gap-1 text-green-400 text-sm">
              <CheckCircle size={16} />
              {t('profile.passwordChanged')}
            </span>
          )}
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t('profile.currentPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t('profile.newPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? 'text' : 'password'}
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              {t('auth.confirmPassword')}
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white pr-12 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={passwordLoading}
            className="btn btn-primary w-full sm:w-auto disabled:opacity-50"
          >
            {passwordLoading ? (
              <Loader2 className="animate-spin" size={18} />
            ) : (
              <Lock size={18} />
            )}
            {t('profile.changePassword')}
          </button>
        </div>
      </form>

      {/* Danger Zone */}
      <div className="card border-red-500/30">
        <h3 className="text-lg font-semibold text-red-400 mb-4">{t('profile.dangerZone')}</h3>
        <p className="text-slate-400 text-sm mb-4">{t('profile.deleteAccountWarning')}</p>
        <button className="btn bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20">
          {t('profile.deleteAccount')}
        </button>
      </div>
    </div>
  )
}
