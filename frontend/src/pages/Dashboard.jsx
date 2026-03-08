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
  RefreshCw,
  CalendarPlus,
  AlertTriangle,
  ChevronDown
} from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, currentRestaurant, isManager } = useAuth()
  const canDoCashout = currentRestaurant?.canDoCashout !== false

  const [stats, setStats] = useState({
    totalSales: 0,
    tipOutGiven: 0,
    tipsReceivedToday: 0,
    pendingReports: 0,
    validatedReports: 0,
    totalReports: 0
  })
  const [myTipsToday, setMyTipsToday] = useState(0)
  const [recentActivity, setRecentActivity] = useState([])
  const [loading, setLoading] = useState(true)

  // ── Accordéon — sections ouvertes/fermées ──────────────────
  const [open, setOpen] = useState({
    stats:    true,
    period:   true,
    actions:  true,
    activity: true
  })
  const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }))

  useEffect(() => {
    if (!currentRestaurant?.id) return

    const fetchData = async () => {
      setLoading(true)
      try {
        const today = new Date().toISOString().split('T')[0]

        if (canDoCashout) {
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
          const tipsRes = await reportAPI.getMyTips(currentRestaurant.id)
          const todayGroup = (tipsRes.history || []).find(g => g.date === today)
          setMyTipsToday(todayGroup ? todayGroup.total : 0)
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
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  })

  // ── Style accordéon header ─────────────────────────────────
  const sectionHeader = (label, icon, isOpen, onToggle, rightSlot) => (
    <div
      onClick={onToggle}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', cursor: 'pointer',
        background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
        borderBottom: isOpen ? '1px solid rgba(71,85,105,0.35)' : 'none',
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {icon}
        <span style={{ color: 'white', fontWeight: 600, fontSize: '15px' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {rightSlot}
        <ChevronDown
          size={18}
          style={{
            color: '#64748b',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s ease',
            flexShrink: 0
          }}
        />
      </div>
    </div>
  )

  const sectionWrap = {
    borderRadius: '18px',
    border: '1px solid rgba(71,85,105,0.5)',
    overflow: 'hidden'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Welcome Header ── */}
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: '20px',
        background: 'linear-gradient(to bottom right, #2563eb, #1d4ed8, #4338ca)',
        padding: '24px 20px'
      }} className="sm-welcome-pad">
        <div style={{
          position: 'absolute', top: 0, right: 0, width: '260px', height: '260px',
          backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '50%', transform: 'translate(33%, -50%)'
        }} />
        <div style={{
          position: 'absolute', bottom: 0, left: 0, width: '200px', height: '200px',
          backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: '50%', transform: 'translate(-25%, 50%)'
        }} />
        <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', gap: '24px' }} className="md:flex-row md:items-center md:justify-between">
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <div style={{
              width: '54px', height: '54px', borderRadius: '50%', flexShrink: 0,
              background: user?.photoURL ? 'transparent' : 'rgba(255,255,255,0.25)',
              border: '2px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              overflow: 'hidden', boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
            }}>
              {user?.photoURL
                ? <img src={user.photoURL} alt={user?.firstName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                : <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>{(user?.firstName?.[0] || '?')}{(user?.lastName?.[0] || '')}</span>
              }
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#bfdbfe', fontSize: '14px', marginBottom: '12px' }}>
                <Calendar size={14} />
                <span style={{ textTransform: 'capitalize' }}>{today}</span>
              </div>
              <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '8px', lineHeight: '1.2' }} className="welcome-title">
                {t('dashboard.welcome')}, {user?.firstName} !
              </h1>
              <p style={{ color: '#bfdbfe', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                <Sparkles size={16} />
                {currentRestaurant?.name || 'Votre restaurant'}
              </p>
            </div>
          </div>
          {canDoCashout ? (
            <Link to="/cash-out" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: 'white', color: '#1d4ed8', fontWeight: 600, borderRadius: '14px', textDecoration: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontSize: '15px' }}>
              <Calculator size={20} />{t('dashboard.startCashOut')}
            </Link>
          ) : (
            <Link to="/my-tips" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', padding: '14px 28px', backgroundColor: 'white', color: '#1d4ed8', fontWeight: 600, borderRadius: '14px', textDecoration: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.2)', fontSize: '15px' }}>
              <DollarSign size={20} />Voir mes pourboires
            </Link>
          )}
        </div>
      </div>

      {/* ── Alerte : aucune période active (manager) ── */}
      {!loading && isManager && !stats.currentPeriod && (
        <Link to="/reports?createPeriod=1" style={{ textDecoration: 'none' }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: '14px', padding: '18px 22px',
            background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(234,88,12,0.08))',
            border: '1px solid rgba(245,158,11,0.35)', borderRadius: '16px', cursor: 'pointer'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: 42, height: 42, borderRadius: '12px', flexShrink: 0, backgroundColor: 'rgba(245,158,11,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertTriangle size={20} style={{ color: '#fbbf24' }} />
              </div>
              <div>
                <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: '0 0 3px' }}>Aucune période de paie active</p>
                <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Les serveurs ne peuvent pas soumettre de Cash Out tant qu'aucune période n'est ouverte.</p>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '9px 16px', borderRadius: '10px', background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: 'white', fontWeight: 600, fontSize: '13px', flexShrink: 0 }}>
              <CalendarPlus size={15} />Créer une période
            </div>
          </div>
        </Link>
      )}

      {/* ── Statistiques (accordéon) ── */}
      <div style={sectionWrap}>
        {sectionHeader(
          'Statistiques',
          <TrendingUp size={18} style={{ color: '#60a5fa' }} />,
          open.stats,
          () => toggle('stats')
        )}
        {open.stats && (
          <div style={{ padding: '16px', background: 'rgba(15,23,42,0.3)' }}>
            <div className="stats-grid">

              {canDoCashout && (
                <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '18px' }}>
                  <div className="stat-card-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                        <p className="stat-label">{isManager ? t('dashboard.totalSales') : 'Mes ventes'}</p>
                        <p className="stat-value">{loading ? '—' : `$${(isManager ? stats.totalSales : (stats.myTotalSales || 0)).toFixed(2)}`}</p>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                        <DollarSign style={{ color: '#4ade80' }} size={20} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#4ade80', fontSize: '12px' }}>
                      <TrendingUp size={13} /><span>Cumul total</span>
                    </div>
                  </div>
                </div>
              )}

              {canDoCashout && isManager && (
                <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '18px' }}>
                  <div className="stat-card-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                        <p className="stat-label">Tip-Out total (restaurant)</p>
                        <p className="stat-value">{loading ? '—' : `$${(stats.totalTipOut || 0).toFixed(2)}`}</p>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
                        <TrendingUp style={{ color: '#60a5fa' }} size={20} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#60a5fa', fontSize: '12px' }}>
                      <TrendingUp size={13} /><span>Cumul total</span>
                    </div>
                  </div>
                </div>
              )}

              {!canDoCashout && (
                <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '18px' }}>
                  <div className="stat-card-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                        <p className="stat-label">Pourboires reçus (aujourd'hui)</p>
                        <p className="stat-value">{loading ? '—' : `$${myTipsToday.toFixed(2)}`}</p>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: 'rgba(59,130,246,0.12)' }}>
                        <TrendingUp style={{ color: '#60a5fa' }} size={20} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#60a5fa', fontSize: '12px' }}>
                      <TrendingUp size={13} /><span>{t('dashboard.today')}</span>
                    </div>
                  </div>
                </div>
              )}

              {canDoCashout && (
                <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '18px' }}>
                  <div className="stat-card-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                        <p className="stat-label">Mon Tip-Out distribué</p>
                        <p className="stat-value">{loading ? '—' : `$${(stats.myTotalTipOut || 0).toFixed(2)}`}</p>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
                        <DollarSign style={{ color: '#fbbf24' }} size={20} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#fbbf24', fontSize: '12px' }}>
                      <TrendingUp size={13} /><span>Cumul total</span>
                    </div>
                  </div>
                </div>
              )}

              {canDoCashout && (
                <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '18px' }}>
                  <div className="stat-card-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                        <p className="stat-label">Tips reçus (aujourd'hui)</p>
                        <p className="stat-value">{loading ? '—' : `$${(stats.tipsReceivedToday || 0).toFixed(2)}`}</p>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                        <DollarSign style={{ color: '#34d399' }} size={20} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#34d399', fontSize: '12px' }}>
                      <TrendingUp size={13} /><span>De mes collègues</span>
                    </div>
                  </div>
                </div>
              )}

              {canDoCashout && (
                <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '18px' }}>
                  <div className="stat-card-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                        <p className="stat-label">{t('dashboard.pendingReports')}</p>
                        <p className="stat-value">{loading ? '—' : (isManager ? stats.pendingReports : (stats.myPendingReports || 0))}</p>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: 'rgba(245,158,11,0.12)' }}>
                        <Clock style={{ color: '#fbbf24' }} size={20} />
                      </div>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#334155', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '9999px', backgroundColor: '#f59e0b', width: isManager ? `${stats.totalReports ? (stats.pendingReports / stats.totalReports) * 100 : 0}%` : `${stats.myTotalReports ? ((stats.myPendingReports || 0) / stats.myTotalReports) * 100 : 0}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              )}

              {!canDoCashout && (
                <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '18px' }}>
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
                      <TrendingUp size={13} /><span>Tous les shifts</span>
                    </div>
                  </div>
                </div>
              )}

              {canDoCashout && (
                <div style={{ background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)', border: '1px solid rgba(71,85,105,0.5)', borderRadius: '18px' }}>
                  <div className="stat-card-inner">
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '14px' }}>
                      <div style={{ minWidth: 0, flex: 1, marginRight: '8px' }}>
                        <p className="stat-label">{t('dashboard.validatedReports')}</p>
                        <p className="stat-value">{loading ? '—' : (isManager ? stats.validatedReports : (stats.myValidatedReports || 0))}</p>
                      </div>
                      <div className="stat-icon" style={{ backgroundColor: 'rgba(16,185,129,0.12)' }}>
                        <CheckCircle style={{ color: '#34d399' }} size={20} />
                      </div>
                    </div>
                    <div style={{ height: '6px', backgroundColor: '#334155', borderRadius: '9999px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: '9999px', backgroundColor: '#10b981', width: isManager ? `${stats.totalReports ? (stats.validatedReports / stats.totalReports) * 100 : 0}%` : `${stats.myTotalReports ? ((stats.myValidatedReports || 0) / stats.myTotalReports) * 100 : 0}%`, transition: 'width 0.5s ease' }} />
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* ── Période de paie en cours (accordéon) ── */}
      {!loading && stats.currentPeriod && (
        <div style={sectionWrap}>
          {sectionHeader(
            'Période de paie en cours',
            <div style={{ width: 28, height: 28, borderRadius: '8px', backgroundColor: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Calendar size={16} style={{ color: '#818cf8' }} />
            </div>,
            open.period,
            () => toggle('period'),
            <Link
              to="/reports"
              onClick={e => e.stopPropagation()}
              style={{ fontSize: '12px', color: '#818cf8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
            >
              Rapports <ArrowRight size={12} />
            </Link>
          )}
          {open.period && (
            <div style={{ padding: '16px 20px 20px', background: 'rgba(15,23,42,0.3)' }}>
              <p style={{ color: '#6366f1', fontSize: '13px', fontWeight: 500, margin: '0 0 16px' }}>
                {new Date(stats.currentPeriod.startDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                {' → '}
                {new Date(stats.currentPeriod.endDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }} className="sm:grid-cols-4">
                {canDoCashout && (
                  <div style={{ backgroundColor: 'rgba(30,41,59,0.7)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(51,65,85,0.5)' }}>
                    <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{isManager ? 'Ventes resto (période)' : 'Mes ventes (période)'}</p>
                    <p style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: 0 }}>${(isManager ? stats.currentPeriod.totalSales : (stats.currentPeriod.mySales || 0)).toFixed(2)}</p>
                  </div>
                )}
                {canDoCashout && (
                  <div style={{ backgroundColor: 'rgba(30,41,59,0.7)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(51,65,85,0.5)' }}>
                    <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Mon Tip-Out (période)</p>
                    <p style={{ color: '#fbbf24', fontSize: '20px', fontWeight: 700, margin: 0 }}>-${(stats.currentPeriod.myTipOut || 0).toFixed(2)}</p>
                  </div>
                )}
                <div style={{ backgroundColor: 'rgba(30,41,59,0.7)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(51,65,85,0.5)' }}>
                  <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Tips reçus (période)</p>
                  <p style={{ color: '#34d399', fontSize: '20px', fontWeight: 700, margin: 0 }}>+${(stats.currentPeriod.myTipsReceived || 0).toFixed(2)}</p>
                </div>
                {canDoCashout && (
                  <div style={{ backgroundColor: 'rgba(30,41,59,0.7)', borderRadius: '14px', padding: '14px 16px', border: '1px solid rgba(51,65,85,0.5)' }}>
                    <p style={{ color: '#64748b', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>Mes rapports (période)</p>
                    <p style={{ color: 'white', fontSize: '20px', fontWeight: 700, margin: 0 }}>{stats.currentPeriod.myReportCount || 0}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Actions rapides (accordéon) ── */}
      <div style={sectionWrap}>
        {sectionHeader(
          t('dashboard.quickActions'),
          <Sparkles size={18} style={{ color: '#60a5fa' }} />,
          open.actions,
          () => toggle('actions')
        )}
        {open.actions && (
          <div style={{ padding: '16px 20px 20px', background: 'rgba(15,23,42,0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>

            {canDoCashout ? (
              <Link to="/cash-out" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(to right, rgba(59,130,246,0.1), transparent)', borderRadius: '14px', border: '1px solid rgba(59,130,246,0.15)', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(59,130,246,0.2)' }}>
                    <Calculator style={{ color: '#60a5fa' }} size={20} />
                  </div>
                  <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>{t('dashboard.startCashOut')}</span>
                </div>
                <ArrowRight style={{ color: '#64748b' }} size={18} />
              </Link>
            ) : (
              <Link to="/my-tips" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(to right, rgba(16,185,129,0.1), transparent)', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.15)', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.2)' }}>
                    <DollarSign style={{ color: '#34d399' }} size={20} />
                  </div>
                  <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>Mes pourboires reçus</span>
                </div>
                <ArrowRight style={{ color: '#64748b' }} size={18} />
              </Link>
            )}

            <Link to="/reports" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(to right, rgba(16,185,129,0.1), transparent)', borderRadius: '14px', border: '1px solid rgba(16,185,129,0.15)', textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(16,185,129,0.2)' }}>
                  <FileText style={{ color: '#34d399' }} size={20} />
                </div>
                <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>{t('dashboard.viewReports')}</span>
              </div>
              <ArrowRight style={{ color: '#64748b' }} size={18} />
            </Link>

            {isManager && (
              <Link to="/team" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(to right, rgba(139,92,246,0.1), transparent)', borderRadius: '14px', border: '1px solid rgba(139,92,246,0.15)', textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(139,92,246,0.2)' }}>
                    <Users style={{ color: '#a78bfa' }} size={20} />
                  </div>
                  <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>{t('nav.team')}</span>
                </div>
                <ArrowRight style={{ color: '#64748b' }} size={18} />
              </Link>
            )}

            {isManager && (
              <Link to="/reports?createPeriod=1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'linear-gradient(to right, rgba(5,150,105,0.1), transparent)', borderRadius: '14px', border: `1px solid ${!stats.currentPeriod && !loading ? 'rgba(245,158,11,0.4)' : 'rgba(5,150,105,0.15)'}`, textDecoration: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: !stats.currentPeriod && !loading ? 'rgba(245,158,11,0.2)' : 'rgba(5,150,105,0.2)' }}>
                    <CalendarPlus style={{ color: !stats.currentPeriod && !loading ? '#fbbf24' : '#34d399' }} size={20} />
                  </div>
                  <div>
                    <span style={{ color: 'white', fontWeight: 500, fontSize: '15px' }}>Périodes de paie</span>
                    {!stats.currentPeriod && !loading && (
                      <p style={{ color: '#fbbf24', fontSize: '11px', margin: '2px 0 0' }}>Aucune période active</p>
                    )}
                  </div>
                </div>
                <ArrowRight style={{ color: '#64748b' }} size={18} />
              </Link>
            )}
          </div>
        )}
      </div>

      {/* ── Activité récente (accordéon) ── */}
      <div style={sectionWrap}>
        {sectionHeader(
          t('dashboard.recentActivity'),
          <Clock size={18} style={{ color: '#94a3b8' }} />,
          open.activity,
          () => toggle('activity'),
          <Link to="/reports" onClick={e => e.stopPropagation()} style={{ fontSize: '12px', color: '#60a5fa', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}>
            Voir tout <ArrowRight size={12} />
          </Link>
        )}
        {open.activity && (
          <div style={{ padding: '12px 16px 16px', background: 'rgba(15,23,42,0.3)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px', gap: '10px', color: '#94a3b8' }}>
                <RefreshCw size={18} style={{ animation: 'spin 1s linear infinite' }} />Chargement...
              </div>
            )}
            {!loading && recentActivity.map((activity) => (
              <div key={activity.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', backgroundColor: 'rgba(30,41,59,0.6)', borderRadius: '14px', border: '1px solid rgba(51,65,85,0.4)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '42px', height: '42px', borderRadius: '13px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: activity.color === 'green' ? 'rgba(16,185,129,0.2)' : 'rgba(59,130,246,0.2)' }}>
                    <span style={{ fontSize: '15px', fontWeight: 'bold', color: activity.color === 'green' ? '#34d399' : '#60a5fa' }}>{activity.user.charAt(0)}</span>
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', textAlign: 'center' }}>
                <Clock size={40} style={{ color: '#475569', marginBottom: '14px' }} />
                <p style={{ color: '#94a3b8', fontSize: '15px' }}>Aucune activité récente</p>
                <p style={{ color: '#64748b', fontSize: '13px', marginTop: '6px' }}>
                  {canDoCashout ? 'Soumettez votre premier Cash Out pour commencer' : 'Vos pourboires reçus apparaîtront ici'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  )
}
