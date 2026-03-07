import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { authAPI } from '../services/api'
import {
  Eye, EyeOff, Globe, Loader2, Store, User,
  ChevronRight, ChevronLeft, Camera, X, Zap,
  Mail, Lock, MapPin, AlertCircle, ArrowRight, Check
} from 'lucide-react'

export default function Register() {
  const { t } = useTranslation()
  const { register, refreshUser } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    restaurantName: '',
    address: '',
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword]   = useState(false)
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState('')
  const [focusedField, setFocusedField]   = useState(null)
  const photoRef = useRef(null)
  const [photoFile, setPhotoFile]         = useState(null)
  const [localPhoto, setLocalPhoto]       = useState(null)

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
      if (photoFile) {
        try {
          await authAPI.uploadPhoto(photoFile)
          await refreshUser() // mettre à jour photoURL dans le contexte
        } catch (_) { /* silent */ }
      }
      navigate('/dashboard')
    } catch (err) {
      setError(err.message || t('common.error'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '13px 14px 13px 46px',
    background: 'rgba(15,23,42,0.7)',
    border: `1.5px solid ${focusedField === field ? '#3b82f6' : 'rgba(51,65,85,0.8)'}`,
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none'
  })

  const inputStyleNoIcon = (field) => ({
    width: '100%',
    padding: '13px 14px',
    background: 'rgba(15,23,42,0.7)',
    border: `1.5px solid ${focusedField === field ? '#3b82f6' : 'rgba(51,65,85,0.8)'}`,
    borderRadius: '12px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none'
  })

  const labelStyle = {
    display: 'block',
    color: '#cbd5e1',
    fontSize: '14px',
    fontWeight: 500,
    marginBottom: '8px'
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* ── Décors de fond ── */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-8%',
        width: '700px', height: '700px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', bottom: '-20%', left: '-12%',
        width: '600px', height: '600px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 65%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '30%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '20px 28px', position: 'relative', zIndex: 10
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '44px', height: '44px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            borderRadius: '13px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59,130,246,0.45)'
          }}>
            <Zap size={22} color="white" fill="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.4px' }}>
            ShiftClose
          </span>
        </div>

        <button
          onClick={toggleLanguage}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px',
            background: 'rgba(30,41,59,0.5)',
            border: '1px solid rgba(71,85,105,0.4)',
            borderRadius: '10px', cursor: 'pointer',
            color: '#94a3b8', fontSize: '13px', fontWeight: 500,
            transition: 'all 0.2s'
          }}
        >
          <Globe size={15} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language}</span>
        </button>
      </div>

      {/* ── Contenu principal ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px 16px 48px',
        position: 'relative', zIndex: 10
      }}>
        <div style={{ width: '100%', maxWidth: '460px' }}>

          {/* ── Indicateur d'étapes ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
            {/* Étape 1 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '50%',
              background: step >= 1
                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                : 'rgba(51,65,85,0.6)',
              border: step >= 1 ? 'none' : '1.5px solid rgba(71,85,105,0.5)',
              fontSize: '14px', fontWeight: 700, color: step >= 1 ? 'white' : '#64748b',
              boxShadow: step >= 1 ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
              transition: 'all 0.3s', flexShrink: 0
            }}>
              {step > 1 ? <Check size={16} /> : '1'}
            </div>

            {/* Connecteur */}
            <div style={{
              flex: 1, height: '2px', maxWidth: '60px',
              background: step >= 2
                ? 'linear-gradient(90deg, #3b82f6, #6366f1)'
                : 'rgba(51,65,85,0.6)',
              borderRadius: '2px', transition: 'background 0.3s'
            }} />

            {/* Étape 2 */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              width: '36px', height: '36px', borderRadius: '50%',
              background: step >= 2
                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                : 'rgba(51,65,85,0.6)',
              border: step >= 2 ? 'none' : '1.5px solid rgba(71,85,105,0.5)',
              fontSize: '14px', fontWeight: 700, color: step >= 2 ? 'white' : '#64748b',
              boxShadow: step >= 2 ? '0 4px 12px rgba(99,102,241,0.35)' : 'none',
              transition: 'all 0.3s', flexShrink: 0
            }}>
              2
            </div>
          </div>

          {/* ── Carte ── */}
          <div style={{
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(51,65,85,0.7)',
            borderRadius: '28px',
            padding: '36px 32px 32px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
          }}>

            {/* Icône + titre */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex', width: '64px', height: '64px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
                borderRadius: '20px',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: '18px',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 8px 24px rgba(59,130,246,0.12)'
              }}>
                {step === 1
                  ? <Store size={28} color="#818cf8" />
                  : <User size={28} color="#818cf8" />
                }
              </div>
              <h1 style={{
                color: 'white', fontSize: '26px', fontWeight: 700,
                marginBottom: '6px', letterSpacing: '-0.4px', lineHeight: 1.2
              }}>
                {step === 1 ? t('register.restaurantStep') : t('register.personalStep')}
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px', lineHeight: 1.5 }}>
                {step === 1 ? t('register.restaurantDesc') : t('register.personalDesc')}
              </p>
            </div>

            {/* Erreur */}
            {error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '12px 16px', marginBottom: '20px',
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.25)',
                borderRadius: '12px', color: '#f87171', fontSize: '14px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0 }} />
                {error}
              </div>
            )}

            {/* ── Étape 1 : Infos restaurant ── */}
            {step === 1 && (
              <form onSubmit={handleNextStep} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

                {/* Nom du restaurant */}
                <div>
                  <label style={labelStyle}>{t('settings.restaurantName')} *</label>
                  <div style={{ position: 'relative' }}>
                    <Store size={17} style={{
                      position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'restaurantName' ? '#60a5fa' : '#475569',
                      transition: 'color 0.2s', pointerEvents: 'none'
                    }} />
                    <input
                      type="text"
                      name="restaurantName"
                      value={formData.restaurantName}
                      onChange={handleChange}
                      placeholder="Ex: Le Petit Bistro"
                      required
                      autoFocus
                      style={inputStyle('restaurantName')}
                      onFocus={() => setFocusedField('restaurantName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>

                {/* Adresse */}
                <div>
                  <label style={labelStyle}>{t('settings.address')}</label>
                  <div style={{ position: 'relative' }}>
                    <MapPin size={17} style={{
                      position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'address' ? '#60a5fa' : '#475569',
                      transition: 'color 0.2s', pointerEvents: 'none'
                    }} />
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      placeholder="123 Rue Principale, Montréal"
                      style={inputStyle('address')}
                      onFocus={() => setFocusedField('address')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>

                {/* Bouton suivant */}
                <button
                  type="submit"
                  style={{
                    width: '100%', padding: '14px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    border: 'none', borderRadius: '14px',
                    color: 'white', fontWeight: 600, fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: '0 8px 28px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s', marginTop: '4px'
                  }}
                >
                  {t('common.next')} <ChevronRight size={18} />
                </button>
              </form>
            )}

            {/* ── Étape 2 : Infos personnelles ── */}
            {step === 2 && (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Photo (optionnel) */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div
                    onClick={() => photoRef.current?.click()}
                    style={{
                      position: 'relative',
                      width: '84px', height: '84px',
                      borderRadius: '50%',
                      background: localPhoto ? 'transparent' : 'rgba(15,23,42,0.7)',
                      border: localPhoto ? 'none' : `2px dashed ${focusedField === 'photo' ? '#3b82f6' : 'rgba(71,85,105,0.6)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', overflow: 'hidden', flexShrink: 0,
                      transition: 'border-color 0.2s'
                    }}
                    onMouseEnter={e => { if (!localPhoto) e.currentTarget.style.borderColor = '#3b82f6' }}
                    onMouseLeave={e => { if (!localPhoto) e.currentTarget.style.borderColor = 'rgba(71,85,105,0.6)' }}
                  >
                    {localPhoto ? (
                      <>
                        <img src={localPhoto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', color: '#475569' }}>
                        <Camera size={24} />
                        <span style={{ fontSize: '10px', fontWeight: 500 }}>Photo</span>
                      </div>
                    )}
                  </div>

                  <div style={{ textAlign: 'center' }}>
                    <p style={{ color: '#64748b', fontSize: '12px' }}>
                      Photo de profil <span style={{ color: '#334155' }}>(optionnel)</span>
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

                {/* Prénom + Nom (côte à côte) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>{t('profile.firstName')} *</label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="Jean"
                      required
                      autoFocus
                      style={inputStyleNoIcon('firstName')}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('profile.lastName')} *</label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="Dupont"
                      required
                      style={inputStyleNoIcon('lastName')}
                      onFocus={() => setFocusedField('lastName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label style={labelStyle}>{t('auth.email')} *</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={17} style={{
                      position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'email' ? '#60a5fa' : '#475569',
                      transition: 'color 0.2s', pointerEvents: 'none'
                    }} />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="votre@email.com"
                      required
                      style={inputStyle('email')}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>

                {/* Mot de passe */}
                <div>
                  <label style={labelStyle}>{t('auth.password')} *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={17} style={{
                      position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'password' ? '#60a5fa' : '#475569',
                      transition: 'color 0.2s', pointerEvents: 'none'
                    }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Min. 6 caractères"
                      required
                      minLength={6}
                      style={{ ...inputStyle('password'), paddingRight: '48px' }}
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: '13px', top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: '#475569', padding: '4px',
                        display: 'flex', alignItems: 'center'
                      }}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                {/* Confirmation mot de passe */}
                <div>
                  <label style={labelStyle}>{t('auth.confirmPassword')} *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={17} style={{
                      position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'confirmPassword' ? '#60a5fa' : '#475569',
                      transition: 'color 0.2s', pointerEvents: 'none'
                    }} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirmez votre mot de passe"
                      required
                      style={inputStyle('confirmPassword')}
                      onFocus={() => setFocusedField('confirmPassword')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>

                {/* Boutons Retour + Créer */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    style={{
                      padding: '14px 18px',
                      background: 'rgba(51,65,85,0.5)',
                      border: '1px solid rgba(71,85,105,0.4)',
                      borderRadius: '14px', cursor: 'pointer',
                      color: '#94a3b8', fontWeight: 500,
                      display: 'flex', alignItems: 'center', gap: '6px',
                      transition: 'all 0.2s', flexShrink: 0
                    }}
                  >
                    <ChevronLeft size={18} /> {t('common.back')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    style={{
                      flex: 1, padding: '14px',
                      background: loading
                        ? 'rgba(51,65,85,0.8)'
                        : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                      border: 'none', borderRadius: '14px',
                      color: 'white', fontWeight: 600, fontSize: '15px',
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      boxShadow: loading ? 'none' : '0 8px 28px rgba(99,102,241,0.4)',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.7 : 1
                    }}
                  >
                    {loading
                      ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> {t('common.loading')}</>
                      : <><Store size={18} /> {t('register.createRestaurant')}</>
                    }
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Lien vers connexion */}
          <p style={{ textAlign: 'center', color: '#64748b', fontSize: '14px', marginTop: '24px' }}>
            {t('auth.hasAccount')}{' '}
            <Link to="/login" style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>
              {t('auth.login')}
            </Link>
          </p>

          {/* Copyright */}
          <p style={{ textAlign: 'center', color: '#1e3a5f', fontSize: '12px', marginTop: '16px' }}>
            © {new Date().getFullYear()} ShiftClose · Gestion de Cash Out
          </p>
        </div>
      </div>
    </div>
  )
}
