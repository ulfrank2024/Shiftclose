import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { setupAPI } from '../services/api'
import {
  Building2, User, Lock, Eye, EyeOff,
  Check, Loader, AlertCircle, ChevronRight, ChevronLeft, Zap, Mail, ShieldCheck
} from 'lucide-react'

const STEPS = [
  { id: 1, label: 'Votre profil',   icon: User },
  { id: 2, label: 'Sécurité',       icon: ShieldCheck },
  { id: 3, label: 'Confirmation',   icon: Check },
]

export default function SetupRestaurant() {
  const { token } = useParams()
  const navigate  = useNavigate()
  const { login } = useAuth()

  const [info, setInfo]             = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [infoError, setInfoError]   = useState('')

  const [step, setStep]             = useState(1)
  const [form, setForm]             = useState({ firstName: '', lastName: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError]           = useState('')
  const [success, setSuccess]       = useState(false)
  const [focusedField, setFocusedField] = useState(null)

  useEffect(() => {
    setupAPI.getInfo(token)
      .then(res => setInfo(res.invitation))
      .catch(err => setInfoError(err.message))
      .finally(() => setLoadingInfo(false))
  }, [token])

  const handleChange = e => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
    setError('')
  }

  // Validation par étape
  const validateStep = () => {
    if (step === 1) {
      if (!form.firstName.trim() || !form.lastName.trim()) {
        setError('Prénom et nom sont requis')
        return false
      }
    }
    if (step === 2) {
      if (!form.password) {
        setError('Le mot de passe est requis')
        return false
      }
      if (form.password.length < 6) {
        setError('Le mot de passe doit contenir au moins 6 caractères')
        return false
      }
      if (form.password !== form.confirm) {
        setError('Les mots de passe ne correspondent pas')
        return false
      }
    }
    return true
  }

  const handleNext = () => {
    if (!validateStep()) return
    setError('')
    setStep(s => s + 1)
  }

  const handleBack = () => {
    setError('')
    setStep(s => s - 1)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError('')
    try {
      const res = await setupAPI.complete(token, {
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password
      })
      localStorage.setItem('token', res.token)
      localStorage.setItem('currentRestaurant', JSON.stringify(res.user.restaurants[0]))
      setSuccess(true)
      setTimeout(() => navigate('/dashboard'), 2200)
    } catch (err) {
      setError(err.message || 'Erreur lors de la configuration')
    } finally {
      setSubmitting(false)
    }
  }

  // ─── Styles ────────────────────────────────────────────────
  const inputStyle = (field, hasIcon = true) => ({
    width: '100%',
    padding: hasIcon ? '13px 14px 13px 44px' : '13px 14px',
    background: 'rgba(15,23,42,0.7)',
    border: `1.5px solid ${focusedField === field ? '#f59e0b' : 'rgba(51,65,85,0.8)'}`,
    borderRadius: '12px',
    color: 'white',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none'
  })

  const pageBackground = (
    <div style={{ position: 'relative', zIndex: 0 }}>
      <div style={{ position: 'fixed', top: '-15%', right: '-8%', width: '700px', height: '700px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(245,158,11,0.1) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', bottom: '-20%', left: '-12%', width: '600px', height: '600px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />
    </div>
  )

  // ─── Loading ───────────────────────────────────────────────
  if (loadingInfo) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: '52px', height: '52px', border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
        <p style={{ color: '#64748b', fontSize: '14px' }}>Vérification de l'invitation...</p>
      </div>
    </div>
  )

  // ─── Invalide / expiré ─────────────────────────────────────
  if (infoError) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.2)' }}>
          <AlertCircle size={40} style={{ color: '#f87171' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Invitation invalide</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>{infoError}</p>
        <a href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 24px', background: 'rgba(51,65,85,0.6)', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '12px', color: 'white', textDecoration: 'none', fontSize: '14px' }}>
          Retour à la connexion
        </a>
      </div>
    </div>
  )

  // ─── Succès ────────────────────────────────────────────────
  if (success) return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', padding: '24px', background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))', borderRadius: '50%', marginBottom: '24px', border: '1px solid rgba(16,185,129,0.3)', boxShadow: '0 0 40px rgba(16,185,129,0.15)' }}>
          <Check size={48} style={{ color: '#10b981' }} />
        </div>
        <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, marginBottom: '10px' }}>Restaurant configuré !</h1>
        <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '6px' }}>
          Bienvenue sur ShiftClose, <strong style={{ color: 'white' }}>{form.firstName}</strong> !
        </p>
        <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>Redirection vers votre tableau de bord...</p>
        <div style={{ width: '36px', height: '36px', border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
      </div>
    </div>
  )

  // ─── Formulaire multi-étapes ───────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
      {pageBackground}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 28px', position: 'relative', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '44px', height: '44px', background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)', borderRadius: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,130,246,0.45)' }}>
            <Zap size={22} color="white" fill="white" />
          </div>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '22px', letterSpacing: '-0.4px' }}>ShiftClose</span>
        </div>
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px 48px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Carte invitation ── */}
          <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '20px 24px', backdropFilter: 'blur(24px)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ width: '52px', height: '52px', flexShrink: 0, borderRadius: '14px', background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1))', border: '1px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Building2 size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  Configurez votre restaurant
                </p>
                <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {info?.restaurantName}
                </h2>
              </div>
            </div>
            <div style={{ margin: '16px 0', height: '1px', background: 'rgba(51,65,85,0.5)' }} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <User size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  Invitation de <span style={{ color: '#cbd5e1', fontWeight: 500 }}>{info?.invitedByName}</span>
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={13} style={{ color: '#64748b', flexShrink: 0 }} />
                <span style={{ color: '#64748b', fontSize: '13px' }}>
                  Email : <span style={{ color: '#fbbf24', fontWeight: 500 }}>{info?.email}</span>
                </span>
              </div>
            </div>
          </div>

          {/* ── Indicateur d'étapes ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0' }}>
            {STEPS.map((s, i) => {
              const done    = step > s.id
              const active  = step === s.id
              const pending = step < s.id
              return (
                <div key={s.id} style={{ display: 'flex', alignItems: 'center' }}>
                  {/* Cercle */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 700, fontSize: '13px',
                      background: done
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : active
                          ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                          : 'rgba(51,65,85,0.5)',
                      border: pending ? '1.5px solid rgba(71,85,105,0.5)' : 'none',
                      color: pending ? '#64748b' : 'white',
                      boxShadow: active ? '0 3px 10px rgba(245,158,11,0.4)' : done ? '0 3px 8px rgba(16,185,129,0.3)' : 'none',
                      transition: 'all 0.3s'
                    }}>
                      {done ? <Check size={16} /> : s.id}
                    </div>
                    <span style={{
                      fontSize: '11px', fontWeight: active ? 600 : 400,
                      color: active ? '#fbbf24' : done ? '#34d399' : '#475569',
                      whiteSpace: 'nowrap', transition: 'color 0.3s'
                    }}>{s.label}</span>
                  </div>
                  {/* Ligne de connexion */}
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width: '60px', height: '2px', margin: '0 4px',
                      marginBottom: '18px',
                      background: step > s.id
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : 'rgba(51,65,85,0.5)',
                      transition: 'background 0.3s'
                    }} />
                  )}
                </div>
              )
            })}
          </div>

          {/* ── Carte formulaire ── */}
          <div style={{ background: 'rgba(15,23,42,0.85)', border: '1px solid rgba(51,65,85,0.7)', borderRadius: '24px', padding: '32px 28px 28px', backdropFilter: 'blur(24px)', boxShadow: '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)' }}>

            {/* Erreur globale */}
            {error && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: '12px', color: '#f87171', fontSize: '14px', marginBottom: '20px' }}>
                <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
              </div>
            )}

            {/* ══ Étape 1 : Profil ══ */}
            {step === 1 && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '6px' }}>
                    Votre profil
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                    Entrez votre prénom et votre nom pour créer votre compte Manager.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Prénom */}
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Prénom *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'firstName' ? '#fbbf24' : '#475569', pointerEvents: 'none', transition: 'color 0.2s' }} />
                      <input
                        type="text" name="firstName" value={form.firstName} onChange={handleChange}
                        placeholder="Jean" required autoFocus
                        style={inputStyle('firstName')}
                        onFocus={() => setFocusedField('firstName')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={e => e.key === 'Enter' && handleNext()}
                      />
                    </div>
                  </div>
                  {/* Nom */}
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Nom *</label>
                    <div style={{ position: 'relative' }}>
                      <User size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'lastName' ? '#fbbf24' : '#475569', pointerEvents: 'none', transition: 'color 0.2s' }} />
                      <input
                        type="text" name="lastName" value={form.lastName} onChange={handleChange}
                        placeholder="Dupont" required
                        style={inputStyle('lastName')}
                        onFocus={() => setFocusedField('lastName')}
                        onBlur={() => setFocusedField(null)}
                        onKeyDown={e => e.key === 'Enter' && handleNext()}
                      />
                    </div>
                  </div>
                </div>

                {/* Bouton Suivant */}
                <button onClick={handleNext} style={{ width: '100%', padding: '14px', marginTop: '24px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(245,158,11,0.4)' }}>
                  Suivant <ChevronRight size={18} />
                </button>
              </>
            )}

            {/* ══ Étape 2 : Sécurité ══ */}
            {step === 2 && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '6px' }}>
                    Sécurité
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                    Choisissez un mot de passe sécurisé pour votre compte.
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {/* Mot de passe */}
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Mot de passe *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: focusedField === 'password' ? '#fbbf24' : '#475569', pointerEvents: 'none', transition: 'color 0.2s' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password" value={form.password} onChange={handleChange}
                        placeholder="Minimum 6 caractères" required autoFocus
                        style={{ ...inputStyle('password'), paddingRight: '48px' }}
                        onFocus={() => setFocusedField('password')}
                        onBlur={() => setFocusedField(null)}
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#475569', padding: '4px', display: 'flex', alignItems: 'center' }}>
                        {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                      </button>
                    </div>
                    {/* Barre de force */}
                    {form.password && (
                      <div style={{ marginTop: '8px', display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ flex: 1, height: '3px', borderRadius: '2px', background: form.password.length >= i * 3
                            ? i === 1 ? '#ef4444' : i === 2 ? '#f59e0b' : '#10b981'
                            : 'rgba(51,65,85,0.6)', transition: 'background 0.2s' }} />
                        ))}
                        <span style={{ fontSize: '11px', color: form.password.length < 3 ? '#ef4444' : form.password.length < 6 ? '#f59e0b' : '#10b981', marginLeft: '4px', whiteSpace: 'nowrap' }}>
                          {form.password.length < 3 ? 'Faible' : form.password.length < 6 ? 'Moyen' : 'Fort'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Confirmer */}
                  <div>
                    <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>Confirmer le mot de passe *</label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} style={{ position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)', color: form.confirm && form.confirm !== form.password ? '#f87171' : focusedField === 'confirm' ? '#fbbf24' : '#475569', pointerEvents: 'none', transition: 'color 0.2s' }} />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="confirm" value={form.confirm} onChange={handleChange}
                        placeholder="Répétez le mot de passe" required
                        style={{
                          ...inputStyle('confirm'),
                          borderColor: form.confirm && form.confirm !== form.password ? 'rgba(239,68,68,0.6)' : focusedField === 'confirm' ? '#f59e0b' : 'rgba(51,65,85,0.8)',
                          boxShadow: form.confirm && form.confirm !== form.password ? '0 0 0 3px rgba(239,68,68,0.08)' : focusedField === 'confirm' ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none'
                        }}
                        onFocus={() => setFocusedField('confirm')}
                        onBlur={() => setFocusedField(null)}
                      />
                    </div>
                    {form.confirm && form.confirm !== form.password && (
                      <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>Les mots de passe ne correspondent pas</p>
                    )}
                    {form.confirm && form.confirm === form.password && (
                      <p style={{ color: '#10b981', fontSize: '12px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Check size={12} /> Les mots de passe correspondent
                      </p>
                    )}
                  </div>
                </div>

                {/* Boutons Retour / Suivant */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                  <button onClick={handleBack} style={{ flex: 1, padding: '14px', background: 'rgba(51,65,85,0.5)', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '14px', color: '#94a3b8', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <ChevronLeft size={18} /> Retour
                  </button>
                  <button onClick={handleNext} style={{ flex: 2, padding: '14px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 600, fontSize: '15px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: '0 8px 24px rgba(245,158,11,0.4)' }}>
                    Suivant <ChevronRight size={18} />
                  </button>
                </div>
              </>
            )}

            {/* ══ Étape 3 : Confirmation ══ */}
            {step === 3 && (
              <>
                <div style={{ marginBottom: '24px' }}>
                  <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '6px' }}>
                    Récapitulatif
                  </h1>
                  <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                    Vérifiez vos informations avant de créer votre compte.
                  </p>
                </div>

                {/* Récap */}
                <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(51,65,85,0.5)', borderRadius: '16px', overflow: 'hidden', marginBottom: '24px' }}>
                  {/* Restaurant */}
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(51,65,85,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Restaurant</span>
                    <span style={{ color: '#fbbf24', fontWeight: 600, fontSize: '14px' }}>{info?.restaurantName}</span>
                  </div>
                  {/* Nom */}
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(51,65,85,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Nom complet</span>
                    <span style={{ color: 'white', fontWeight: 500, fontSize: '14px' }}>{form.firstName} {form.lastName}</span>
                  </div>
                  {/* Email */}
                  <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(51,65,85,0.4)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Email</span>
                    <span style={{ color: 'white', fontSize: '14px' }}>{info?.email}</span>
                  </div>
                  {/* Rôle */}
                  <div style={{ padding: '14px 18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#64748b', fontSize: '13px' }}>Rôle</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 10px', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: '20px', color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>
                      Manager
                    </span>
                  </div>
                </div>

                {/* Boutons Retour / Créer */}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button onClick={handleBack} disabled={submitting} style={{ flex: 1, padding: '14px', background: 'rgba(51,65,85,0.5)', border: '1px solid rgba(71,85,105,0.4)', borderRadius: '14px', color: '#94a3b8', fontWeight: 600, fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', opacity: submitting ? 0.5 : 1 }}>
                    <ChevronLeft size={18} /> Retour
                  </button>
                  <button onClick={handleSubmit} disabled={submitting} style={{ flex: 2, padding: '14px', background: submitting ? 'rgba(51,65,85,0.8)' : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', border: 'none', borderRadius: '14px', color: 'white', fontWeight: 600, fontSize: '15px', cursor: submitting ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', boxShadow: submitting ? 'none' : '0 8px 24px rgba(245,158,11,0.4)', opacity: submitting ? 0.7 : 1 }}>
                    {submitting
                      ? <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Création...</>
                      : <><Check size={18} /> Créer mon compte</>
                    }
                  </button>
                </div>
              </>
            )}

          </div>

          <p style={{ textAlign: 'center', color: '#1e3a5f', fontSize: '12px' }}>
            © {new Date().getFullYear()} ShiftClose · Gestion de Cash Out
          </p>
        </div>
      </div>
    </div>
  )
}
