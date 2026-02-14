import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { Globe, Loader2, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import api from '../services/api'

export default function ForgotPassword() {
  const { t } = useTranslation()
  const { language, toggleLanguage } = useLanguage()

  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.post('/auth/forgot-password', { email })
      setSuccess(true)
    } catch (err) {
      setError(err.response?.data?.message || t('auth.forgotPasswordError'))
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
          {/* Back to Login */}
          <Link
            to="/login"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: '#94a3b8',
              textDecoration: 'none',
              marginBottom: '24px',
              fontSize: '14px'
            }}
          >
            <ArrowLeft size={18} />
            {t('auth.backToLogin')}
          </Link>

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
                {t('auth.emailSent')}
              </h2>
              <p style={{ color: '#94a3b8', marginBottom: '24px', lineHeight: 1.6 }}>
                {t('auth.checkYourEmail')}
              </p>
              <p style={{ color: '#64748b', fontSize: '14px' }}>
                {email}
              </p>
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
                  <Mail size={32} style={{ color: '#60a5fa' }} />
                </div>
                <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
                  {t('auth.forgotPassword')}
                </h1>
                <p style={{ color: '#94a3b8' }}>
                  {t('auth.forgotPasswordDesc')}
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
                    marginBottom: '24px'
                  }}>
                    {error}
                  </div>
                )}

                <div style={{ marginBottom: '24px' }}>
                  <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: '#cbd5e1', marginBottom: '8px' }}>
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="votre@email.com"
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
                    t('auth.sendResetLink')
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
