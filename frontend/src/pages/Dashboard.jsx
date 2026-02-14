import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import {
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Calculator,
  FileText,
  ArrowRight,
  Users,
  Sparkles,
  Calendar
} from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, currentRestaurant, isManager } = useAuth()

  // Mock data - will be replaced by API
  const stats = {
    totalSales: 2450.75,
    totalTips: 387.50,
    pendingReports: 3,
    validatedReports: 12
  }

  const recentActivity = [
    { id: 1, user: 'Marie L.', action: 'Cash Out soumis', amount: 324.50, time: '14:30', color: 'blue' },
    { id: 2, user: 'Jean P.', action: 'Rapport validé', amount: 512.00, time: '13:45', color: 'green' },
    { id: 3, user: 'Sophie M.', action: 'Cash Out soumis', amount: 287.25, time: '12:20', color: 'blue' }
  ]

  const today = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Welcome Header */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '16px',
        background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8, #4338ca)',
        padding: '24px'
      }}>
        {/* Background decoration */}
        <div style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '256px',
          height: '256px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          transform: 'translate(33%, -50%)'
        }} />
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '192px',
          height: '192px',
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '50%',
          transform: 'translate(-25%, 50%)'
        }} />

        <div style={{
          position: 'relative',
          zIndex: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: '24px'
        }} className="md:flex-row md:items-center md:justify-between">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#bfdbfe', fontSize: '14px', marginBottom: '8px' }}>
              <Calendar size={14} />
              <span style={{ textTransform: 'capitalize' }}>{today}</span>
            </div>
            <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
              {t('dashboard.welcome')}, {user?.firstName} !
            </h1>
            <p style={{ color: '#bfdbfe', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={16} />
              {currentRestaurant?.name || 'Votre restaurant'}
            </p>
          </div>

          <Link
            to="/cash-out"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: 'white',
              color: '#1d4ed8',
              fontWeight: 600,
              borderRadius: '12px',
              textDecoration: 'none',
              boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
              transition: 'all 0.2s'
            }}
          >
            <Calculator size={20} />
            {t('dashboard.startCashOut')}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '16px'
      }} className="lg:grid-cols-4">
        <div style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '16px',
          padding: '24px',
          color: '#4ade80'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('dashboard.totalSales')}</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>
                ${stats.totalSales.toFixed(2)}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }}>
              <DollarSign style={{ color: '#4ade80' }} size={22} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', color: '#4ade80', fontSize: '14px' }}>
            <TrendingUp size={14} />
            <span>+12.5% vs hier</span>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '16px',
          padding: '24px',
          color: '#60a5fa'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('dashboard.totalTips')}</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>
                ${stats.totalTips.toFixed(2)}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(59, 130, 246, 0.1)'
            }}>
              <TrendingUp style={{ color: '#60a5fa' }} size={22} />
            </div>
          </div>
          <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa', fontSize: '14px' }}>
            <TrendingUp size={14} />
            <span>+8.3% vs hier</span>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '16px',
          padding: '24px',
          color: '#fbbf24'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('dashboard.pendingReports')}</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>
                {stats.pendingReports}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(245, 158, 11, 0.1)'
            }}>
              <Clock style={{ color: '#fbbf24' }} size={22} />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ height: '8px', backgroundColor: '#334155', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: '#f59e0b',
                  width: `${(stats.pendingReports / (stats.pendingReports + stats.validatedReports)) * 100}%`
                }}
              />
            </div>
          </div>
        </div>

        <div style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
          border: '1px solid rgba(71, 85, 105, 0.5)',
          borderRadius: '16px',
          padding: '24px',
          color: '#34d399'
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <p style={{ color: '#94a3b8', fontSize: '14px' }}>{t('dashboard.validatedReports')}</p>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: 'white', marginTop: '8px' }}>
                {stats.validatedReports}
              </p>
            </div>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }}>
              <CheckCircle style={{ color: '#34d399' }} size={22} />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <div style={{ height: '8px', backgroundColor: '#334155', borderRadius: '9999px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  borderRadius: '9999px',
                  backgroundColor: '#10b981',
                  width: `${(stats.validatedReports / (stats.pendingReports + stats.validatedReports)) * 100}%`
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '24px'
      }} className="lg:grid-cols-3">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '16px',
            padding: '24px',
            height: '100%'
          }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sparkles size={18} style={{ color: '#60a5fa' }} />
              {t('dashboard.quickActions')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link
                to="/cash-out"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'linear-gradient(to right, rgba(59, 130, 246, 0.1), transparent)',
                  borderRadius: '12px',
                  border: '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(59, 130, 246, 0.2)'
                  }}>
                    <Calculator style={{ color: '#60a5fa' }} size={18} />
                  </div>
                  <span style={{ color: 'white', fontWeight: 500 }}>{t('dashboard.startCashOut')}</span>
                </div>
                <ArrowRight style={{ color: '#64748b' }} size={18} />
              </Link>

              <Link
                to="/reports"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px',
                  background: 'linear-gradient(to right, rgba(16, 185, 129, 0.1), transparent)',
                  borderRadius: '12px',
                  border: '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)'
                  }}>
                    <FileText style={{ color: '#34d399' }} size={18} />
                  </div>
                  <span style={{ color: 'white', fontWeight: 500 }}>{t('dashboard.viewReports')}</span>
                </div>
                <ArrowRight style={{ color: '#64748b' }} size={18} />
              </Link>

              {isManager && (
                <Link
                  to="/team"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    background: 'linear-gradient(to right, rgba(139, 92, 246, 0.1), transparent)',
                    borderRadius: '12px',
                    border: '1px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: 'rgba(139, 92, 246, 0.2)'
                    }}>
                      <Users style={{ color: '#a78bfa' }} size={18} />
                    </div>
                    <span style={{ color: 'white', fontWeight: 500 }}>{t('nav.team')}</span>
                  </div>
                  <ArrowRight style={{ color: '#64748b' }} size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
            border: '1px solid rgba(71, 85, 105, 0.5)',
            borderRadius: '16px',
            padding: '24px',
            height: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} style={{ color: '#94a3b8' }} />
                {t('dashboard.recentActivity')}
              </h2>
              <Link to="/reports" style={{ fontSize: '14px', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none' }}>
                Voir tout
                <ArrowRight size={14} />
              </Link>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px',
                    backgroundColor: 'rgba(30, 41, 59, 0.5)',
                    borderRadius: '12px',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: activity.color === 'green' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(59, 130, 246, 0.2)'
                    }}>
                      <span style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        color: activity.color === 'green' ? '#34d399' : '#60a5fa'
                      }}>
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p style={{ color: 'white', fontWeight: 500 }}>{activity.user}</p>
                      <p style={{ fontSize: '14px', color: '#94a3b8' }}>{activity.action}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'white', fontWeight: 600 }}>${activity.amount.toFixed(2)}</p>
                    <p style={{ fontSize: '14px', color: '#64748b' }}>{activity.time}</p>
                  </div>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '32px',
                  textAlign: 'center'
                }}>
                  <Clock size={40} style={{ color: '#475569', marginBottom: '12px' }} />
                  <p style={{ color: '#94a3b8' }}>Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
