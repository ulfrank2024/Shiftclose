import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { authAPI, deletionAPI } from '../services/api'
import {
  User, Mail, Phone, Lock, Save, Eye, EyeOff,
  Camera, Loader2, CheckCircle, AlertCircle, X, Shield,
  Clock, Trash2
} from 'lucide-react'

export default function Profile() {
  const { t } = useTranslation()
  const { user, currentRestaurant, refreshUser } = useAuth()
  const fileInputRef = useRef(null)
  const isManager = user?.role === 'manager' || currentRestaurant?.role === 'manager'

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
  const [photoHovered, setPhotoHovered]       = useState(false)
  const [profileSuccess, setProfileSuccess]   = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [photoSuccess, setPhotoSuccess]       = useState(false)
  const [error, setError] = useState('')
  const [localPhoto, setLocalPhoto] = useState(null)

  // Deletion request state
  const [deletionRequest, setDeletionRequest]       = useState(null)  // null | { id, status, requestedAt }
  const [showDeleteConfirm, setShowDeleteConfirm]   = useState(false)
  const [deleteLoading, setDeleteLoading]           = useState(false)
  const [deleteError, setDeleteError]               = useState('')

  // Charger la demande en attente au montage
  useEffect(() => {
    if (currentRestaurant?.id && !isManager) {
      deletionAPI.getMyRequest(currentRestaurant.id)
        .then(res => setDeletionRequest(res.request || null))
        .catch(() => {})
    }
  }, [currentRestaurant?.id, isManager])

  const handleRequestDeletion = async () => {
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deletionAPI.request(currentRestaurant.id)
      const res = await deletionAPI.getMyRequest(currentRestaurant.id)
      setDeletionRequest(res.request || null)
      setShowDeleteConfirm(false)
    } catch (err) {
      setDeleteError(err.message)
    } finally {
      setDeleteLoading(false)
    }
  }

  const handleCancelDeletion = async () => {
    if (!deletionRequest?.id) return
    try {
      await deletionAPI.cancel(deletionRequest.id)
      setDeletionRequest(null)
    } catch (err) {
      setDeleteError(err.message)
    }
  }

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
      <div style={{
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 16,
        padding: '28px 24px'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          {/* Photo */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <div
              onClick={handlePhotoClick}
              onMouseEnter={() => setPhotoHovered(true)}
              onMouseLeave={() => setPhotoHovered(false)}
              title="Changer la photo"
              style={{
                width: 96, height: 96,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                overflow: 'hidden',
                position: 'relative',
                flexShrink: 0
              }}
            >
              {(localPhoto || user?.photoURL) ? (
                <img
                  src={localPhoto || user.photoURL}
                  alt={userName}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  onError={(e) => { e.currentTarget.style.display = 'none' }}
                />
              ) : (
                <span style={{ color: '#fff', fontSize: 28, fontWeight: 700 }}>{userInitials}</span>
              )}

              {/* Overlay upload / hover */}
              {photoLoading ? (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.6)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  borderRadius: '50%'
                }}>
                  <Loader2 size={28} style={{ color: '#fff', animation: 'spin 1s linear infinite' }} />
                </div>
              ) : (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(0,0,0,0.5)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center', gap: 4,
                  opacity: photoHovered ? 1 : 0,
                  transition: 'opacity 0.2s',
                  borderRadius: '50%'
                }}>
                  <Camera size={22} style={{ color: '#fff' }} />
                  <span style={{ color: '#fff', fontSize: 11, fontWeight: 500 }}>Modifier</span>
                </div>
              )}
            </div>

            {/* Badge caméra */}
            {!photoLoading && !photoSuccess && (
              <button
                onClick={handlePhotoClick}
                title="Changer la photo"
                style={{
                  position: 'absolute', bottom: -4, right: -4,
                  width: 32, height: 32, borderRadius: '50%',
                  background: '#3b82f6', border: '2px solid #0f172a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                }}
              >
                <Camera size={14} style={{ color: '#fff' }} />
              </button>
            )}

            {/* Badge succès */}
            {photoSuccess && (
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 32, height: 32, borderRadius: '50%',
                background: '#10b981', border: '2px solid #0f172a',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <CheckCircle size={14} style={{ color: '#fff' }} />
              </div>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handlePhotoChange}
              style={{ display: 'none' }}
            />
          </div>

          {/* Info */}
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f8fafc', margin: 0 }}>{userName}</h1>
            <p style={{ color: '#94a3b8', marginTop: 4, fontSize: 14 }}>{user?.email}</p>
            {photoLoading && (
              <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Téléversement en cours...</p>
            )}
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center' }}>
              <span style={{
                padding: '4px 12px', background: 'rgba(59,130,246,0.15)',
                color: '#60a5fa', fontSize: 13, borderRadius: 9999, fontWeight: 500
              }}>
                {user?.role || 'server'}
              </span>
              {user?.restaurants?.length > 0 && (
                <span style={{
                  padding: '4px 12px', background: 'rgba(139,92,246,0.15)',
                  color: '#a78bfa', fontSize: 13, borderRadius: 9999, fontWeight: 500
                }}>
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
      <div style={{
        background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
        border: '1px solid rgba(239,68,68,0.25)',
        borderRadius: '20px', padding: '28px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
          <div style={{ padding: '10px', backgroundColor: 'rgba(239,68,68,0.1)', borderRadius: '12px' }}>
            <Shield size={20} color="#f87171" />
          </div>
          <div>
            <h3 style={{ color: '#f87171', fontWeight: 600, fontSize: '15px', margin: 0 }}>
              {t('profile.dangerZone')}
            </h3>
            <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>
              Actions irréversibles sur votre compte
            </p>
          </div>
        </div>

        <div style={{ borderTop: '1px solid rgba(239,68,68,0.12)', marginBottom: '20px' }} />

        {/* Erreur */}
        {deleteError && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            padding: '10px 14px', borderRadius: '10px', marginBottom: '16px',
            backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
            color: '#fca5a5', fontSize: '13px'
          }}>
            <AlertCircle size={15} />
            {deleteError}
          </div>
        )}

        {/* Managers : suppression directe avec confirmation forte */}
        {isManager ? (
          <div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
              En tant que manager, vous pouvez supprimer votre compte directement. Cette action est irréversible et retirera votre accès au restaurant.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.4)',
                  backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
                {t('profile.deleteAccount')}
              </button>
            ) : (
              <div style={{
                padding: '16px', borderRadius: '12px',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)'
              }}>
                <p style={{ color: '#fca5a5', fontSize: '14px', fontWeight: 500, margin: '0 0 14px' }}>
                  Êtes-vous certain ? Cette action est irréversible.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '9px',
                      border: '1px solid #334155', backgroundColor: 'transparent',
                      color: '#94a3b8', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleRequestDeletion}
                    disabled={deleteLoading}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '10px', borderRadius: '9px', border: 'none',
                      backgroundColor: '#ef4444', color: 'white',
                      fontSize: '14px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
                    Oui, supprimer
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : deletionRequest?.status === 'pending' ? (
          /* Demande en attente */
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              backgroundColor: 'rgba(245,158,11,0.1)',
              border: '1px solid rgba(245,158,11,0.3)',
              marginBottom: '14px'
            }}>
              <Clock size={20} color="#fbbf24" style={{ flexShrink: 0 }} />
              <div>
                <p style={{ color: '#fbbf24', fontWeight: 500, fontSize: '14px', margin: '0 0 2px' }}>
                  Demande de suppression en attente
                </p>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>
                  Votre manager doit valider cette demande avant que votre compte soit supprimé.
                </p>
              </div>
            </div>
            <button
              onClick={handleCancelDeletion}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '9px 16px', borderRadius: '9px',
                border: '1px solid #334155', backgroundColor: 'transparent',
                color: '#94a3b8', fontSize: '13px', cursor: 'pointer'
              }}
            >
              <X size={14} />
              Annuler la demande
            </button>
          </div>
        ) : deletionRequest?.status === 'rejected' ? (
          /* Demande refusée */
          <div>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: '12px',
              padding: '14px 16px', borderRadius: '12px',
              backgroundColor: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              marginBottom: '14px'
            }}>
              <X size={20} color="#f87171" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <p style={{ color: '#f87171', fontWeight: 500, fontSize: '14px', margin: '0 0 4px' }}>
                  Demande refusée par votre manager
                </p>
                {deletionRequest.note && (
                  <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>
                    Note : {deletionRequest.note}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.4)',
                backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171',
                fontSize: '14px', fontWeight: 500, cursor: 'pointer'
              }}
            >
              <Trash2 size={16} />
              Soumettre à nouveau
            </button>
          </div>
        ) : (
          /* Pas de demande — formulaire initial */
          <div>
            <p style={{ color: '#94a3b8', fontSize: '14px', marginBottom: '16px', lineHeight: 1.6 }}>
              {t('profile.deleteAccountWarning')} Votre demande sera envoyée à votre manager pour validation.
            </p>
            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '8px',
                  padding: '10px 18px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.4)',
                  backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171',
                  fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                }}
              >
                <Trash2 size={16} />
                {t('profile.deleteAccount')}
              </button>
            ) : (
              <div style={{
                padding: '16px', borderRadius: '12px',
                backgroundColor: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.3)'
              }}>
                <p style={{ color: '#fca5a5', fontSize: '14px', fontWeight: 500, margin: '0 0 6px' }}>
                  Confirmer la demande de suppression ?
                </p>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '0 0 14px', lineHeight: 1.5 }}>
                  Votre manager sera notifié et devra approuver avant que votre compte soit supprimé.
                </p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => { setShowDeleteConfirm(false); setDeleteError('') }}
                    style={{
                      flex: 1, padding: '10px', borderRadius: '9px',
                      border: '1px solid #334155', backgroundColor: 'transparent',
                      color: '#94a3b8', fontSize: '14px', fontWeight: 500, cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleRequestDeletion}
                    disabled={deleteLoading}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '10px', borderRadius: '9px', border: 'none',
                      backgroundColor: '#ef4444', color: 'white',
                      fontSize: '14px', fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer',
                      opacity: deleteLoading ? 0.7 : 1
                    }}
                  >
                    {deleteLoading ? <Loader2 size={16} className="animate-spin" /> : <Shield size={16} />}
                    Envoyer la demande
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
