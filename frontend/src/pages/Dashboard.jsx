import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { Link } from 'react-router-dom'
import { reportAPI } from '../services/api'
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
  Calendar,
  RefreshCw
} from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, currentRestaurant, isManager } = useAuth()
  const canDoCashout = currentRestaurant?.canDoCashout !== false

  const [stats, setStats] = useState({
    totalSales: 0,
    totalTips: 0,
    pendingReports: 0,
    validatedReports: 0,
    totalReports: 0
  })
  const [myTipsToday, setMyTipsToday] = useState(0)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!currentRestaurant?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]

        if (canDoCashout) {
          // Serveur / Manager avec cash out : stats du restaurant + activité récente
          const [statsRes, reportsRes] = await Promise.allSettled([
            reportAPI.getStats(currentRestaurant.id),
            reportAPI.getAll(currentRestaurant.id)
          ])
          if (statsRes.status === 'fulfilled' && statsRes.value.success) {
            setStats(statsRes.value.stats)
          }
          if (reportsRes.status === 'fulfilled' && reportsRes.value.success) {
            const activity = reportsRes.value.reports.slice(0, 5).map(r => ({
              id: r.id,
              user: r.employeeName,
              action: r.status === 'validated' ? 'Rapport validé' : 'Cash Out soumis',
              amount: r.totalSales,
              time: new Date(r.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
              color: r.status === 'validated' ? 'green' : 'blue'
            }))
            setRecentActivity(activity)
          }
        } else {
          // Employé sans cash out (commis, bar, host…) : tips reçus
          const tipsRes = await reportAPI.getMyTips(currentRestaurant.id)
          const todayGroup = (tipsRes.history || []).find(g => g.date === today)
          setMyTipsToday(todayGroup ? todayGroup.total : 0)

          // Activité récente = ses tips reçus
          const activity = (tipsRes.history || []).slice(0, 5).flatMap(g =>
            (g.items || []).map(item => ({
              id: item.id,
              user: item.fromEmployeeName,
              action: `Pourboire reçu (${item.role || 'tip'})`,
              amount: item.amount,
              time: new Date(item.createdAt || g.date).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
              color: 'green'
            }))
          ).slice(0, 5)
          setRecentActivity(activity)
          setStats(prev => ({ ...prev, totalTips: tipsRes.totalReceived || 0 }))
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [currentRestaurant?.id, canDoCashout])

  const today = new Date().toLocaleDateString('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

      {/* ── Welcome Header ── */}
      <div style={{
        position: 'relative',
        overflow: 'hidden',
        borderRadius: '20px',
        background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8, #4338ca)',
        padding: '24px 20px'
      }} className="sm-welcome-pad">
        {/* Background decoration */}
        <div style={{
          position: 'absolute', top: 0, right: 0,
          width: '260px', height: '260px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '50%', transform: 'translate(33%, -50%)'
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0,
          width: '200px', height: '200px',
          backgroundColor: 'rgba(255,255,255,0.05)',
          borderRadius: '50%', transform: 'translate(-25%, 50%)'
        }} />

        <div style={{
          position: 'relative', zIndex: 10,
          display: 'flex', flexDirection: 'column', gap: '24px'
        }} className="md:flex-row md:items-center md:justify-between">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            {/* Avatar utilisateur */}
            <div style={{
              width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0,
              background: user?.photoURL ? 'transparent' : 'rgba(255,255,255,0.25)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user?.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>
                  {(user?.firstName?.[0] || '?')}{(user?.lastName?.[0] || '')}
                </span>
              )}
            </div>

            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                color: '#bfdbfe', fontSize: '14px', marginBottom: '12px'
              }}>
                <Calendar size={14} />
                <span style={{ textTransform: 'capitalize' }}>{today}</span>
              </div>
              <h1 style={{
                fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '8px', lineHeight: '1.2'
              }} className="welcome-title">
                {t('dashboard.welcome')}, {user?.firstName} !
              </h1>
              <p style={{ color: '#bfdbfe', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <Sparkles size={16} />
                {currentRestaurant?.name || 'Votre restaurant'}
              </p>
            </div>
          </div>

          {canDoCashout ? (
            <Link
              to="/cash-out"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '14px 28px',
                backgroundColor: 'white', color: '#1d4ed8',
                fontWeight: 600, borderRadius: '14px',
                textDecoration: 'none',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                transition: 'all 0.2s', fontSize: '15px'
              }}
            >
              <Calculator size={20} />
              {t('dashboard.startCashOut')}
            </Link>
          ) : (
            <Link
              to="/my-tips"
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                padding: '14px 28px',
                backgroundColor: 'white', color: '#1d4ed8',
                fontWeight: 600, borderRadius: '14px',
                textDecoration: 'none',
                boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                transition: 'all 0.2s', fontSize: '15px'
              }}
            >
              <DollarSign size={20} />
              Voir mes pourboires
            </Link>
          )}
        </div>
      </div>

      {/* ── Stats Grid ── */}
      <div className="stats-grid">

        {/* Total Sales — masqué pour employés sans cashout */}
        {canDoCashout && (
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
            border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: '18px'
          }}>
            <div className="stat-card-inner">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                  <p className="stat-label">{t('dashboard.totalSales')}</p>
                  <p className="stat-value">{loading ? '—' : `$${stats.totalSales.toFixed(2)}`}</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                  <DollarSign style={{ color: '#4ade80' }} size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4ade80', fontSize: '12px' }}>
                <TrendingUp size={13} />
                <span>{t('dashboard.today')}</span>
              </div>
            </div>
          </div>
        )}

        {/* Pourboires — reçus aujourd'hui pour employés sans cashout, total pour les autres */}
        <div style={{
          background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
          border: '1px solid rgba(71,85,105,0.5)',
          borderRadius: '18px'
        }}>
          <div className="stat-card-inner">
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
              <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                <p className="stat-label">
                  {canDoCashout ? t('dashboard.totalTips') : 'Pourboires reçus (aujourd\'hui)'}
                </p>
                <p className="stat-value">
                  {loading ? '—' : canDoCashout
                    ? `$${stats.totalTips.toFixed(2)}`
                    : `$${myTipsToday.toFixed(2)}`
                  }
                </p>
              </div>
              <div className="stat-icon" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
                <TrendingUp style={{ color: '#60a5fa' }} size={20} />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#60a5fa', fontSize: '12px' }}>
              <TrendingUp size={13} />
              <span>{t('dashboard.today')}</span>
            </div>
          </div>
        </div>

        {/* Pending Reports — seulement si cashout activé */}
        {canDoCashout && (
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
            border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: '18px'
          }}>
            <div className="stat-card-inner">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                  <p className="stat-label">{t('dashboard.pendingReports')}</p>
                  <p className="stat-value">{loading ? '—' : stats.pendingReports}</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
                  <Clock style={{ color: '#fbbf24' }} size={20} />
                </div>
              </div>
              <div style={{ height: '6px', backgroundColor: '#334155', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '9999px', backgroundColor: '#f59e0b',
                  width: `${stats.totalReports ? (stats.pendingReports / stats.totalReports) * 100 : 0}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>
        )}

        {/* Total reçu (tous les shifts) — pour employés sans cashout */}
        {!canDoCashout && (
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
            border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: '18px'
          }}>
            <div className="stat-card-inner">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                  <p className="stat-label">Total reçu (tous les shifts)</p>
                  <p className="stat-value">{loading ? '—' : `$${(stats.totalTips || 0).toFixed(2)}`}</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                  <CheckCircle style={{ color: '#34d399' }} size={20} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399', fontSize: '12px' }}>
                <TrendingUp size={13} />
                <span>Tous les shifts</span>
              </div>
            </div>
          </div>
        )}

        {/* Validated Reports — seulement si cashout activé */}
        {canDoCashout && (
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
            border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: '18px'
          }}>
            <div className="stat-card-inner">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                  <p className="stat-label">{t('dashboard.validatedReports')}</p>
                  <p className="stat-value">{loading ? '—' : stats.validatedReports}</p>
                </div>
                <div className="stat-icon" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                  <CheckCircle style={{ color: '#34d399' }} size={20} />
                </div>
              </div>
              <div style={{ height: '6px', backgroundColor: '#334155', borderRadius: '9999px', overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: '9999px', backgroundColor: '#10b981',
                  width: `${stats.totalReports ? (stats.validatedReports / stats.totalReports) * 100 : 0}%`,
                  transition: 'width 0.5s ease'
                }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Quick Actions + Recent Activity ── */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr', gap: '28px'
      }} className="lg:grid-cols-3">

        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div style={{
            background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
            border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: '18px',
            padding: '28px 24px',
            height: '100%'
          }}>
            <h2 style={{
              fontSize: '17px', fontWeight: 600, color: 'white',
              marginBottom: '24px',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <Sparkles size={18} style={{ color: '#60a5fa' }} />
              {t('dashboard.quickActions')}
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {canDoCashout ? (
                <Link to="/cash-out" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: 'linear-gradient(to right, rgba(59,130,246,0.1), transparent)',
                  borderRadius: '14px', border: '1px solid rgba(59,130,246,0.15)',
                  textDecoration: 'none', transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'rgba(59,130,246,0.2)'
                    }}>
                      <Calculator style={{ color: '#60a5fa' }} size={20} />
                    </div>
                    <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>{t('dashboard.startCashOut')}</span>
                  </div>
                  <ArrowRight style={{ color: '#64748b' }} size={18} />
                </Link>
              ) : (
                <Link to="/my-tips" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: 'linear-gradient(to right, rgba(16,185,129,0.1), transparent)',
                  borderRadius: '14px', border: '1px solid rgba(16,185,129,0.15)',
                  textDecoration: 'none', transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'rgba(16,185,129,0.2)'
                    }}>
                      <DollarSign style={{ color: '#34d399' }} size={20} />
                    </div>
                    <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>Mes pourboires reçus</span>
                  </div>
                  <ArrowRight style={{ color: '#64748b' }} size={18} />
                </Link>
              )}

              <Link to="/reports" style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px',
                background: 'linear-gradient(to right, rgba(16,185,129,0.1), transparent)',
                borderRadius: '14px', border: '1px solid rgba(16,185,129,0.15)',
                textDecoration: 'none', transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '42px', height: '42px', borderRadius: '12px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    backgroundColor: 'rgba(16,185,129,0.2)'
                  }}>
                    <FileText style={{ color: '#34d399' }} size={20} />
                  </div>
                  <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>{t('dashboard.viewReports')}</span>
                </div>
                <ArrowRight style={{ color: '#64748b' }} size={18} />
              </Link>

              {isManager && (
                <Link to="/team" style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px',
                  background: 'linear-gradient(to right, rgba(139,92,246,0.1), transparent)',
                  borderRadius: '14px', border: '1px solid rgba(139,92,246,0.15)',
                  textDecoration: 'none', transition: 'all 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '42px', height: '42px', borderRadius: '12px',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: 'rgba(139,92,246,0.2)'
                    }}>
                      <Users style={{ color: '#a78bfa' }} size={20} />
                    </div>
                    <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>{t('nav.team')}</span>
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
            border: '1px solid rgba(71,85,105,0.5)',
            borderRadius: '18px',
            padding: '28px 24px',
            height: '100%'
          }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              marginBottom: '24px'
            }}>
              <h2 style={{
                fontSize: '17px', fontWeight: 600, color: 'white',
                display: 'flex', alignItems: 'center', gap: '10px'
              }}>
                <Clock size={18} style={{ color: '#94a3b8' }} />
                {t('dashboard.recentActivity')}
              </h2>
              <Link to="/reports" style={{
                fontSize: '14px', color: '#60a5fa',
                display: 'flex', alignItems: 'center', gap: '4px', textDecoration: 'none'
              }}>
                Voir tout <ArrowRight size={14} />
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {loading && (
                <div style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: '40px', gap: '10px', color: '#94a3b8'
                }}>
                  <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />
                  Chargement...
                </div>
              )}

              {!loading && recentActivity.map((activity) => (
                <div key={activity.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '18px 20px',
                  backgroundColor: 'rgba(30,41,59,0.6)',
                  borderRadius: '14px',
                  border: '1px solid rgba(51,65,85,0.4)',
                  transition: 'background-color 0.2s'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{
                      width: '46px', height: '46px', borderRadius: '13px', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      backgroundColor: activity.color === 'green' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)'
                    }}>
                      <span style={{
                        fontSize: '15px', fontWeight: 'bold',
                        color: activity.color === 'green' ? '#34d399' : '#60a5fa'
                      }}>
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p style={{ color: 'white', fontWeight: 500, marginBottom: '3px' }}>{activity.user}</p>
                      <p style={{ fontSize: '13px', color: '#94a3b8' }}>{activity.action}</p>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ color: 'white', fontWeight: 600, marginBottom: '3px' }}>${activity.amount.toFixed(2)}</p>
                    <p style={{ fontSize: '13px', color: '#64748b' }}>{activity.time}</p>
                  </div>
                </div>
              ))}

              {!loading && recentActivity.length === 0 && (
                <div style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  justifyContent: 'center', padding: '48px 32px', textAlign: 'center'
                }}>
                  <Clock size={44} style={{ color: '#475569', marginBottom: '16px' }} />
                  <p style={{ color: '#94a3b8', fontSize: '15px' }}>Aucune activité récente</p>
                  <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
                    {canDoCashout
                      ? 'Soumettez votre premier Cash Out pour commencer'
                      : 'Vos pourboires reçus apparaîtront ici'}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
