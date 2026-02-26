import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import { Eye, EyeOff, Globe, Loader2, Mail, Lock, ArrowRight, AlertCircle, Zap } from 'lucide-react'

export default function Login() {
  const { t } = useTranslation()
  const { login } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const navigate = useNavigate()

  const [email, setEmail]             = useState('')
  const [password, setPassword]       = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [focusedField, setFocusedField] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const userData = await login(email, password)
      navigate(userData.role === 'superadmin' ? '/admin' : '/dashboard')
    } catch (err) {
      setError(err.message || t('auth.loginError'))
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = (field) => ({
    width: '100%',
    padding: '14px 14px 14px 46px',
    background: 'rgba(15,23,42,0.7)',
    border: `1.5px solid ${focusedField === field ? '#3b82f6' : 'rgba(51,65,85,0.8)'}`,
    borderRadius: '14px',
    color: 'white',
    fontSize: '15px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxShadow: focusedField === field ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none'
  })

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
        {/* Logo */}
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

        {/* Language switcher */}
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
        padding: '16px 16px 48px',
        position: 'relative', zIndex: 10
      }}>
        <div style={{ width: '100%', maxWidth: '420px' }}>

          {/* ── Carte ── */}
          <div style={{
            background: 'rgba(15,23,42,0.85)',
            border: '1px solid rgba(51,65,85,0.7)',
            borderRadius: '28px',
            padding: '40px 36px 36px',
            backdropFilter: 'blur(24px)',
            boxShadow: '0 32px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(59,130,246,0.06), inset 0 1px 0 rgba(255,255,255,0.04)'
          }}>

            {/* Icône + titre */}
            <div style={{ textAlign: 'center', marginBottom: '36px' }}>
              <div style={{
                display: 'inline-flex', width: '68px', height: '68px',
                background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(99,102,241,0.15))',
                borderRadius: '22px',
                alignItems: 'center', justifyContent: 'center',
                marginBottom: '22px',
                border: '1px solid rgba(99,102,241,0.25)',
                boxShadow: '0 8px 24px rgba(59,130,246,0.12)'
              }}>
                <Zap size={30} color="#818cf8" fill="#818cf8" />
              </div>
              <h1 style={{
                color: 'white', fontSize: '28px', fontWeight: 700,
                marginBottom: '8px', letterSpacing: '-0.5px', lineHeight: 1.2
              }}>
                {t('auth.welcomeBack')}
              </h1>
              <p style={{ color: '#64748b', fontSize: '15px', lineHeight: 1.5 }}>
                {t('auth.enterCredentials')}
              </p>
            </div>

            {/* Formulaire */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

              {/* Erreur */}
              {error && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px',
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.25)',
                  borderRadius: '12px', color: '#f87171', fontSize: '14px'
                }}>
                  <AlertCircle size={16} style={{ flexShrink: 0 }} />
                  {error}
                </div>
              )}

              {/* Email */}
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  {t('auth.email')}
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={17} style={{
                    position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                    color: focusedField === 'email' ? '#60a5fa' : '#475569',
                    transition: 'color 0.2s', pointerEvents: 'none'
                  }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
                    required
                    autoFocus
                    style={inputStyle('email')}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
              </div>

              {/* Mot de passe */}
              <div>
                <label style={{ display: 'block', color: '#cbd5e1', fontSize: '14px', fontWeight: 500, marginBottom: '8px' }}>
                  {t('auth.password')}
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={17} style={{
                    position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)',
                    color: focusedField === 'password' ? '#60a5fa' : '#475569',
                    transition: 'color 0.2s', pointerEvents: 'none'
                  }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
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

              {/* Mot de passe oublié */}
              <div style={{ textAlign: 'right', marginTop: '-4px' }}>
                <Link
                  to="/forgot-password"
                  style={{ color: '#60a5fa', fontSize: '14px', textDecoration: 'none', fontWeight: 500 }}
                >
                  {t('auth.forgotPassword')}
                </Link>
              </div>

              {/* Bouton connexion */}
              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%', padding: '15px',
                  background: loading
                    ? 'rgba(51,65,85,0.8)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
                  border: 'none', borderRadius: '14px',
                  color: 'white', fontWeight: 600, fontSize: '16px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                  boxShadow: loading ? 'none' : '0 8px 28px rgba(99,102,241,0.4)',
                  transition: 'all 0.2s', marginTop: '4px',
                  opacity: loading ? 0.7 : 1
                }}
              >
                {loading
                  ? <><Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} /> {t('common.loading')}</>
                  : <>{t('auth.login')} <ArrowRight size={18} /></>
                }
              </button>
            </form>

          </div>

          {/* Petit texte bas de page */}
          <p style={{ textAlign: 'center', color: '#1e3a5f', fontSize: '12px', marginTop: '24px' }}>
            © {new Date().getFullYear()} ShiftClose · Gestion de Cash Out
          </p>
        </div>
      </div>
    </div>
  )
}
