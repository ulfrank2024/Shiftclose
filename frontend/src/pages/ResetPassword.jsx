import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { Globe, Loader2, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import api from '../services/api'

export default function ResetPassword() {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()
  const { token } = useParams()
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'))
      return
    }

    if (password.length < 6) {
      setError(t('auth.passwordTooShort'))
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || t('auth.resetPasswordError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0f172a', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            backgroundColor: '#3b82f6',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <span style={{ color: 'white', fontWeight: 'bold', fontSize: '20px' }}>S</span>
          </div>
          <span style={{ color: 'white', fontWeight: 600, fontSize: '20px' }}>ShiftClose</span>
        </div>
        <button
          onClick={toggleLanguage}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '8px 12px',
            color: '#cbd5e1',
            backgroundColor: 'transparent',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          <Globe size={18} />
          <span style={{ fontSize: '14px', fontWeight: 500, textTransform: 'uppercase' }}>{language}</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px 16px 32px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {success ? (
            /* Success State */
            <div style={{
              background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
              border: '1px solid rgba(71, 85, 105, 0.5)',
              borderRadius: '16px',
              padding: '32px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px'
              }}>
                <CheckCircle size={32} style={{ color: '#34d399' }} />
              </div>
              <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '12px' }}>
                {t('auth.passwordReset')}
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
                {t('auth.redirectingToLogin')}
              </p>
              <div style={{
                width: '24px',
                height: '24px',
                border: '3px solid #3b82f6',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }} />
            </div>
          ) : (
            /* Form State */
            <>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  backgroundColor: 'rgba(59, 130, 246, 0.2)',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px'
                }}>
                  <Lock size={32} style={{ color: '#60a5fa' }} />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                  {t('auth.newPassword')}
                </h1>
                <p style={{ color: '#94a3b8' }}>
                  {t('auth.enterNewPassword')}
                </p>
              </div>

              <form onSubmit={handleSubmit}>
                {error && (
                  <div style={{
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.5)',
                    color: '#f87171',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    marginBottom: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
                    {t('auth.newPassword')}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      style={{
                        width: '100%',
                        padding: '12px 48px 12px 16px',
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '12px',
                        color: 'white',
                        fontSize: '16px'
                      }}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer'
                      }}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
                    {t('auth.confirmPassword')}
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      backgroundColor: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '12px',
                      color: 'white',
                      fontSize: '16px'
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    width: '100%',
                    padding: '14px',
                    background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '16px',
                    border: 'none',
                    borderRadius: '12px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    opacity: loading ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} />
                      {t('common.loading')}
                    </>
                  ) : (
                    t('auth.resetPassword')
                  )}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '24px' }}>
                <Link
                  to="/login"
                  style={{
                    color: '#60a5fa',
                    textDecoration: 'none',
                    fontSize: '14px'
                  }}
                >
                  {t('auth.backToLogin')}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
