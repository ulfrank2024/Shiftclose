import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { setupAPI } from '../services/api'
import {
  Building2, User, Lock, Eye, EyeOff,
  Check, Loader, AlertCircle, ChevronRight, Zap, Mail, Users
} from 'lucide-react'

export default function SetupRestaurant() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { login } = useAuth()

  const [info, setInfo]               = useState(null)
  const [loadingInfo, setLoadingInfo] = useState(true)
  const [infoError, setInfoError]     = useState('')
  const [form, setForm]               = useState({ firstName: '', lastName: '', password: '', confirm: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting]   = useState(false)
  const [error, setError]             = useState('')
  const [success, setSuccess]         = useState(false)
  const [focusedField, setFocusedField] = useState(null)

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

  // ── Loading ──
  if (loadingInfo) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', border: '3px solid rgba(245,158,11,0.2)', borderTopColor: '#f59e0b', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>Vérification de l'invitation...</p>
        </div>
      </div>
    )
  }

  // ── Invalide / expiré ──
  if (infoError) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', padding: '20px', background: 'rgba(239,68,68,0.1)', borderRadius: '50%', marginBottom: '20px', border: '1px solid rgba(239,68,68,0.2)' }}>
            <AlertCircle size={40} style={{ color: '#f87171' }} />
          </div>
          <h1 style={{ color: 'white', fontSize: '24px', fontWeight: 700, marginBottom: '12px' }}>Invitation invalide</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px', lineHeight: 1.6 }}>{infoError}</p>
          <a href="/login" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '12px 24px',
            background: 'rgba(51,65,85,0.6)',
            border: '1px solid rgba(71,85,105,0.4)',
            borderRadius: '12px', color: 'white', textDecoration: 'none', fontSize: '14px'
          }}>
            Retour à la connexion
          </a>
        </div>
      </div>
    )
  }

  // ── Succès ──
  if (success) {
    return (
      <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div style={{ maxWidth: '400px', width: '100%', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', padding: '24px',
            background: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(5,150,105,0.1))',
            borderRadius: '50%', marginBottom: '24px',
            border: '1px solid rgba(16,185,129,0.3)',
            boxShadow: '0 0 40px rgba(16,185,129,0.15)'
          }}>
            <Check size={48} style={{ color: '#10b981' }} />
          </div>
          <h1 style={{ color: 'white', fontSize: '26px', fontWeight: 700, marginBottom: '10px', letterSpacing: '-0.3px' }}>
            Restaurant configuré !
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '15px', marginBottom: '6px' }}>
            Bienvenue sur ShiftClose, <strong style={{ color: 'white' }}>{form.firstName}</strong> !
          </p>
          <p style={{ color: '#64748b', fontSize: '14px', marginBottom: '28px' }}>
            Redirection vers votre tableau de bord...
          </p>
          <div style={{ width: '36px', height: '36px', border: '3px solid rgba(16,185,129,0.2)', borderTopColor: '#10b981', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto' }} />
        </div>
      </div>
    )
  }

  // ── Formulaire principal ──
  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a1628 0%, #0f172a 50%, #0c1220 100%)',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {pageBackground}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px 28px', position: 'relative', zIndex: 10 }}>
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
      </div>

      {/* Contenu */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 16px 48px', position: 'relative', zIndex: 10 }}>
        <div style={{ width: '100%', maxWidth: '460px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* ── Carte invitation ── */}
          <div style={{
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(245,158,11,0.2)',
            borderRadius: '20px',
            padding: '20px 24px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(245,158,11,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '52px', height: '52px', flexShrink: 0, borderRadius: '14px',
                background: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.1))',
                border: '1px solid rgba(245,158,11,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <Building2 size={24} style={{ color: '#f59e0b' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#94a3b8', fontSize: '12px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '3px' }}>
                  Configurez votre restaurant
                </p>
                <h2 style={{ color: 'white', fontSize: '18px', fontWeight: 700, letterSpacing: '-0.3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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

          {/* ── Carte formulaire ── */}
          <div style={{
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(51,65,85,0.7)',
            borderRadius: '24px',
            padding: '32px 28px 28px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 24px 48px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.04)'
          }}>
            {/* Titre formulaire */}
            <div style={{ marginBottom: '24px' }}>
              <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, letterSpacing: '-0.4px', marginBottom: '6px' }}>
                Créer votre compte Manager
              </h1>
              <p style={{ color: '#64748b', fontSize: '13px', lineHeight: 1.5 }}>
                Votre restaurant sera automatiquement créé après l'inscription.
              </p>
            </div>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Erreur */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '12px', color: '#f87171', fontSize: '14px'
                }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} /> {error}
                </div>
              )}

              {/* Prénom + Nom */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Prénom *
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={15} style={{
                      position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                      color: focusedField === 'firstName' ? '#fbbf24' : '#475569',
                      pointerEvents: 'none', transition: 'color 0.2s'
                    }} />
                    <input
                      type="text"
                      name="firstName"
                      value={form.firstName}
                      onChange={handleChange}
                      placeholder="Jean"
                      required
                      autoFocus
                      style={inputStyle('firstName')}
                      onFocus={() => setFocusedField('firstName')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                    Nom *
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName}
                    onChange={handleChange}
                    placeholder="Dupont"
                    required
                    style={inputStyle('lastName', false)}
                    onFocus={() => setFocusedField('lastName')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Mot de passe *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                    color: focusedField === 'password' ? '#fbbf24' : '#475569',
                    pointerEvents: 'none', transition: 'color 0.2s'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Minimum 6 caractères"
                    required
                    style={{ ...inputStyle('password'), paddingRight: '48px' }}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: '#475569', padding: '4px', display: 'flex', alignItems: 'center'
                    }}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Confirmer mot de passe */}
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '13px', fontWeight: 600, marginBottom: '8px' }}>
                  Confirmer le mot de passe *
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} style={{
                    position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                    color: form.confirm && form.confirm !== form.password
                      ? '#f87171'
                      : focusedField === 'confirm' ? '#fbbf24' : '#475569',
                    pointerEvents: 'none', transition: 'color 0.2s'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirm"
                    value={form.confirm}
                    onChange={handleChange}
                    placeholder="Répétez le mot de passe"
                    required
                    style={{
                      ...inputStyle('confirm'),
                      borderColor: form.confirm && form.confirm !== form.password
                        ? 'rgba(239,68,68,0.6)'
                        : focusedField === 'confirm' ? '#f59e0b' : 'rgba(51,65,85,0.8)',
                      boxShadow: form.confirm && form.confirm !== form.password
                        ? '0 0 0 3px rgba(239,68,68,0.08)'
                        : focusedField === 'confirm' ? '0 0 0 3px rgba(245,158,11,0.12)' : 'none'
                    }}
                    onFocus={() => setFocusedField('confirm')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                {form.confirm && form.confirm !== form.password && (
                  <p style={{ color: '#f87171', fontSize: '12px', marginTop: '6px' }}>
                    Les mots de passe ne correspondent pas
                  </p>
                )}
              </div>

              {/* Bouton soumettre */}
              <button
                type="submit"
                disabled={submitting}
                style={{
                  width: '100%', padding: '14px',
                  background: submitting
                    ? 'rgba(51,65,85,0.8)'
                    : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  border: 'none', borderRadius: '14px',
                  color: 'white', fontWeight: 600, fontSize: '15px',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: submitting ? 'none' : '0 8px 24px rgba(245,158,11,0.4)',
                  transition: 'all 0.2s', marginTop: '4px',
                  opacity: submitting ? 0.7 : 1
                }}
              >
                {submitting
                  ? <><div style={{ width: '18px', height: '18px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /> Configuration en cours...</>
                  : <><Check size={18} /> Créer mon compte et mon restaurant</>
                }
              </button>
            </form>
          </div>

          {/* ── Indicateur d'étapes ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '4px 0' }}>
            {/* Étape 1 - active */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: 'white',
                boxShadow: '0 3px 10px rgba(245,158,11,0.4)'
              }}>1</div>
              <span style={{ color: '#fbbf24', fontSize: '12px', fontWeight: 600 }}>Votre profil</span>
            </div>

            <ChevronRight size={14} style={{ color: '#334155', flexShrink: 0 }} />

            {/* Étape 2 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(51,65,85,0.5)',
                border: '1.5px solid rgba(71,85,105,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: '#64748b'
              }}>2</div>
              <span style={{ color: '#475569', fontSize: '12px' }}>Votre restaurant</span>
            </div>

            <ChevronRight size={14} style={{ color: '#334155', flexShrink: 0 }} />

            {/* Étape 3 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <div style={{
                width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                background: 'rgba(51,65,85,0.5)',
                border: '1.5px solid rgba(71,85,105,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '12px', fontWeight: 700, color: '#64748b'
              }}>3</div>
              <span style={{ color: '#475569', fontSize: '12px' }}>Votre équipe</span>
            </div>
          </div>

          <p style={{ textAlign: 'center', color: '#1e3a5f', fontSize: '12px' }}>
            © {new Date().getFullYear()} ShiftClose · Gestion de Cash Out
          </p>
        </div>
      </div>
    </div>
  )
}
