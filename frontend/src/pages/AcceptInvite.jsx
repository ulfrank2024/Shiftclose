import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { invitationAPI, authAPI } from '../services/api'
import {
  Eye, EyeOff, Globe, Loader2, UserPlus, Building2,
  CheckCircle, XCircle, Mail, Zap, Lock, User, ArrowRight
} from 'lucide-react'

export default function AcceptInvite() {
  const { token }  = useParams()
  const { t }      = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const { login, isAuthenticated, user } = useAuth()
  const navigate   = useNavigate()

  const [invitation, setInvitation]   = useState(null)
  const [loading, setLoading]         = useState(true)
  const [error, setError]             = useState('')
  const [step, setStep]               = useState(1)
  const [submitting, setSubmitting]   = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', password: '', confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => { loadInvitation() }, [token])

  const loadInvitation = async () => {
    try {
      const response = await invitationAPI.getInfo(token)
      setInvitation(response.invitation)
      setFormData(prev => ({ ...prev, email: response.invitation.email }))
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
      await authAPI.registerEmployee({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      })
      await login(formData.email, formData.password)
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

  const inputStyle = (field, hasIcon = true) => ({
    width: '100%',
    padding: hasIcon ? '13px 14px 13px 44px' : '13px 14px',
    background: 'rgba(15,23,42,0.7)',
    border: `1.5px solid ${focusedField === field ? '#3b82f6' : 'rgba(51,65,85,0.8)'}`,
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none'
  })

  const labelStyle = {
    display: 'block', color: '#cbd5e1',
    fontSize: '13px', fontWeight: 600, marginBottom: '8px'
  }

  // ── Loading ──
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', border: '3px solid rgba(59,130,246,0.2)', borderTopColor: '#3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  // ── Invitation invalide ──
  if (error && !invitation) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <XCircle size={44} style={{ color: '#f87171' }} />
          </div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>{t('invitation.invalid')}</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>{error}</p>
          <Link to="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
            borderRadius: '12px', color: 'white', textDecoration: 'none',
            fontSize: '14px', fontWeight: 600,
            boxShadow: '0 6px 20px rgba(99,102,241,0.4)'
          }}>
            {t('auth.login')} <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    )
  }

  // ── Page principale ──
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)',
      display: 'flex', flexDirection: 'column',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Décors */}
      <div style={{ position: 'absolute', top: '-15%', right: '-8%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: '-20%', left: '-12%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,130,246,0.45)' }}>
            <Zap size={22} color="white" fill="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.4px' }}>ShiftClose</span>
        </div>
        <button onClick={toggleLanguage} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(30,41,59,0.5)', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '10px', cursor: 'pointer', color: '#94a3b8', fontSize: '13px', fontWeight: 500 }}>
          <Globe size={15} />
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{language}</span>
        </button>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px 48px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Carte invitation */}
          <div style={{
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: '20px', padding: '20px 24px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px', height: '52px', flexShrink: 0, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(99,102,241,0.1))',
                border: '1px solid rgba(59,130,246,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Building2 size={24} style={{ color: '#60a5fa' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#64748b', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  Invitation à rejoindre
                </p>
                <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {invitation?.restaurantName}
                </h2>
              </div>
              <span style={{
                padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 600, flexShrink: 0,
                background: invitation?.role === 'manager' ? 'rgba(139,92,246,0.15)' : 'rgba(59,130,246,0.15)',
                color: invitation?.role === 'manager' ? '#a78bfa' : '#60a5fa',
                border: `1px solid ${invitation?.role === 'manager' ? 'rgba(139,92,246,0.25)' : 'rgba(59,130,246,0.25)'}`,
                textTransform: 'capitalize'
              }}>
                {invitation?.role === 'manager' ? t('roles.manager') : t('roles.server')}
              </span>
            </div>

            <div style={{ margin: '16px 0', height: '1px', background: 'rgba(51,65,85,0.5)' }} />

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <User size={13} style={{ color: '#64748b' }} />
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  Par <span style={{ color: '#94a3b8', fontWeight: 500 }}>{invitation?.invitedByName}</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Mail size={13} style={{ color: '#64748b' }} />
                <span style={{ color: '#60a5fa', fontSize: '13px', fontWeight: 500 }}>{invitation?.email}</span>
              </div>
            </div>
          </div>

          {/* ── Étape 2 : Créer compte ── */}
          {step === 2 && (
            <div style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(51,65,85,0.7)',
              borderRadius: '24px', padding: '32px 28px 28px',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
            }}>
              {/* Icône + titre */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{
                  display: 'inline-flex', width: '60px', height: '60px',
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
                  borderRadius: '18px', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px', border: '1px solid rgba(99,102,241,0.25)'
                }}>
                  <UserPlus size={26} style={{ color: '#818cf8' }} />
                </div>
                <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '6px' }}>
                  {t('invitation.createAccount')}
                </h1>
                <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                  {t('invitation.createAccountDesc')}
                </p>
              </div>

              <form onSubmit={handleCreateAccount} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {error && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', color: '#f87171', fontSize: '14px' }}>
                    <span style={{ flexShrink: 0 }}>⚠</span> {error}
                  </div>
                )}

                {/* Prénom + Nom */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={labelStyle}>{t('profile.firstName')} *</label>
                    <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="Jean" required autoFocus
                      style={inputStyle('firstName', false)} onFocus={() => setFocusedField('firstName')} onBlur={() => setFocusedField(null)} />
                  </div>
                  <div>
                    <label style={labelStyle}>{t('profile.lastName')} *</label>
                    <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Dupont" required
                      style={inputStyle('lastName', false)} onFocus={() => setFocusedField('lastName')} onBlur={() => setFocusedField(null)} />
                  </div>
                </div>

                {/* Email (désactivé) */}
                <div>
                  <label style={labelStyle}>{t('auth.email')}</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: '#334155', pointerEvents: 'none' }} />
                    <input type="email" name="email" value={formData.email} disabled
                      style={{ ...inputStyle('email'), background: 'rgba(15,23,42,0.4)', color: '#475569', cursor: 'not-allowed', borderColor: 'rgba(51,65,85,0.4)' }} />
                  </div>
                  <p style={{ color: '#334155', fontSize: '11px', marginTop: '5px' }}>Adresse utilisée pour cette invitation</p>
                </div>

                {/* Mot de passe */}
                <div>
                  <label style={labelStyle}>{t('auth.password')} *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'password' ? '#60a5fa' : '#475569', pointerEvents: 'none', transition: 'color 0.2s' }} />
                    <input type={showPassword ? 'text' : 'password'} name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" required minLength={6}
                      style={{ ...inputStyle('password'), paddingRight: '48px' }} onFocus={() => setFocusedField('password')} onBlur={() => setFocusedField(null)} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', display: 'flex', alignItems: 'center' }}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Confirmer */}
                <div>
                  <label style={labelStyle}>{t('auth.confirmPassword')} *</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'confirmPassword' ? '#60a5fa' : '#475569', pointerEvents: 'none', transition: 'color 0.2s' }} />
                    <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" required
                      style={inputStyle('confirmPassword')} onFocus={() => setFocusedField('confirmPassword')} onBlur={() => setFocusedField(null)} />
                  </div>
                </div>

                <button type="submit" disabled={submitting}
                  style={{
                    width: '100%', padding: '14px',
                    background: submitting ? 'rgba(51,65,85,0.8)' : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                    border: 'none', borderRadius: '14px', color: 'white', fontWeight: 600, fontSize: '15px',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                    boxShadow: submitting ? 'none' : '0 8px 24px rgba(99,102,241,0.4)',
                    transition: 'all 0.2s', marginTop: '4px', opacity: submitting ? 0.7 : 1
                  }}
                >
                  {submitting
                    ? <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> {t('common.loading')}</>
                    : <><CheckCircle size={18} /> {t('invitation.acceptAndCreate')}</>
                  }
                </button>
              </form>

              <p style={{ marginTop: '20px', textAlign: 'center', color: '#475569', fontSize: '13px' }}>
                {t('auth.hasAccount')}{' '}
                <Link to={`/login?redirect=/invite/${token}`} style={{ color: '#60a5fa', fontWeight: 600, textDecoration: 'none' }}>
                  {t('auth.login')}
                </Link>
              </p>
            </div>
          )}

          {/* ── Étape 3 : Déjà connecté ── */}
          {step === 3 && (
            <div style={{
              background: 'rgba(15,23,42,0.85)',
              border: '1px solid rgba(51,65,85,0.7)',
              borderRadius: '24px', padding: '40px 28px',
              backdropFilter: 'blur(24px)',
              boxShadow: '0 24px 48px rgba(0,0,0,0.5)',
              textAlign: 'center'
            }}>
              <div style={{
                display: 'inline-flex', width: '70px', height: '70px',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
                borderRadius: '22px', alignItems: 'center', justifyContent: 'center',
                marginBottom: '20px', border: '1px solid rgba(16,185,129,0.3)'
              }}>
                <CheckCircle size={34} style={{ color: '#10b981' }} />
              </div>
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.3px' }}>
                {t('invitation.readyToJoin')}
              </h1>
              <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>
                {t('invitation.clickToAccept')}
              </p>

              {error && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', color: '#f87171', fontSize: '14px', marginBottom: '20px' }}>
                  {error}
                </div>
              )}

              <button onClick={handleAcceptAsLoggedIn} disabled={submitting}
                style={{
                  width: '100%', padding: '14px',
                  background: submitting ? 'rgba(51,65,85,0.8)' : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  border: 'none', borderRadius: '14px', color: 'white', fontWeight: 600, fontSize: '15px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: submitting ? 'none' : '0 8px 24px rgba(99,102,241,0.4)',
                  transition: 'all 0.2s', opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting
                  ? <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> {t('common.loading')}</>
                  : <><CheckCircle size={18} /> {t('invitation.accept')}</>
                }
              </button>
            </div>
          )}

          <p style={{ textAlign: 'center', color: '#1e3a5f', fontSize: '12px' }}>
            © {new Date().getFullYear()} ShiftClose · Gestion de Cash Out
          </p>
        </div>
      </div>
    </div>
  )
}
