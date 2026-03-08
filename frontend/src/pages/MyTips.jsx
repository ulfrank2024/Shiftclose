import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { reportAPI } from '../services/api'
import {
  DollarSign,
  Calendar,
  User,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Gift,
  RefreshCw
} from 'lucide-react'

export default function MyTips() {
  const { t } = useTranslation()
  const { currentRestaurant } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [tipsData, setTipsData] = useState([])      // groupé par date (fallback)
  const [byPeriod, setByPeriod] = useState([])       // groupé par période
  const [expandedKeys, setExpandedKeys] = useState({})
  const [totalReceived, setTotalReceived] = useState(0)
  const [viewMode, setViewMode] = useState('period') // 'period' | 'date'

  useEffect(() => {
    if (currentRestaurant?.id) {
      loadMyTips()
    }
  }, [currentRestaurant])

  const loadMyTips = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await reportAPI.getMyTips(currentRestaurant.id)
      setTipsData(data.history || [])
      setByPeriod(data.byPeriod || [])
      setTotalReceived(data.totalReceived || 0)

      // Expand la période active (ou aujourd'hui) par défaut
      const today = new Date().toISOString().split('T')[0]
      const initial = {}
      ;(data.byPeriod || []).forEach(p => {
        if (p.status === 'active') initial[p.periodId || 'active'] = true
      })
      ;(data.history || []).forEach(group => {
        if (group.date === today) initial[group.date] = true
      })
      setExpandedKeys(initial)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleKey = (key) => {
    setExpandedKeys(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const fmt = (n) => `$${(parseFloat(n) || 0).toFixed(2)}`

  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T12:00:00')
    const today = new Date()
    const yesterday = new Date()
    yesterday.setDate(today.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return "Aujourd'hui"
    }
    if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Hier'
    }
    return date.toLocaleDateString('fr-CA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const ROLE_COLORS = {
    bar: '#60a5fa',
    commis: '#34d399',
    host: '#f472b6',
    manager: '#a78bfa',
    kitchen_pool: '#fb923c',
    donation: '#fbbf24'
  }

  const ROLE_LABELS = {
    bar: 'Bar',
    commis: 'Commis',
    host: 'Hôte / Hôtesse',
    manager: 'Gérant·e',
    kitchen_pool: 'Cuisine (Pool)',
    donation: 'Don volontaire'
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '44px', height: '44px', borderRadius: '50%',
            border: '3px solid #334155', borderTopColor: '#3b82f6',
            animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', fontSize: '14px' }}>Chargement de vos pourboires...</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto', padding: '20px 16px 100px' }}>

      {/* En-tête */}
      <div style={{
        background: 'linear-gradient(135deg, #1e40af 0%, #1e293b 100%)',
        borderRadius: '20px',
        padding: '28px 24px',
        marginBottom: '24px',
        border: '1px solid rgba(59,130,246,0.2)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Cercle décoratif */}
        <div style={{
          position: 'absolute', top: '-30px', right: '-30px',
          width: '120px', height: '120px', borderRadius: '50%',
          background: 'rgba(59,130,246,0.15)'
        }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px', position: 'relative' }}>
          <div style={{
            width: '52px', height: '52px', borderRadius: '14px',
            backgroundColor: 'rgba(59,130,246,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <DollarSign size={26} color="#60a5fa" />
          </div>
          <div>
            <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: 0 }}>
              Mes Pourboires Reçus
            </h1>
            <p style={{ color: '#93c5fd', fontSize: '13px', margin: '4px 0 0' }}>
              {currentRestaurant?.name}
            </p>
          </div>
        </div>

        {/* Total global */}
        <div style={{
          backgroundColor: 'rgba(0,0,0,0.25)',
          borderRadius: '14px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div>
            <p style={{ color: '#93c5fd', fontSize: '13px', margin: '0 0 4px' }}>Total reçu (tous les shifts)</p>
            <p style={{ color: 'white', fontSize: '32px', fontWeight: 800, margin: 0, letterSpacing: '-1px' }}>
              {fmt(totalReceived)}
            </p>
          </div>
          <div style={{
            width: '48px', height: '48px', borderRadius: '12px',
            backgroundColor: 'rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <TrendingUp size={22} color="#60a5fa" />
          </div>
        </div>
      </div>

      {/* Barre d'actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        {/* Toggle vue */}
        <div style={{ display: 'flex', gap: '6px' }}>
          {[
            { value: 'period', label: 'Par période' },
            { value: 'date',   label: 'Par date' }
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setViewMode(opt.value)}
              style={{
                padding: '7px 14px', borderRadius: '9px', fontSize: '13px', cursor: 'pointer',
                border: viewMode === opt.value ? 'none' : '1px solid #334155',
                background: viewMode === opt.value ? 'linear-gradient(135deg, #3b82f6, #2563eb)' : 'rgba(30,41,59,0.8)',
                color: viewMode === opt.value ? 'white' : '#94a3b8',
                fontWeight: viewMode === opt.value ? 600 : 400
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <button
          onClick={loadMyTips}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '8px 14px', borderRadius: '10px',
            border: '1px solid #334155', backgroundColor: 'rgba(30,41,59,0.8)',
            color: '#94a3b8', fontSize: '13px', cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} />
          Actualiser
        </button>
      </div>

      {/* Erreur */}
      {error && (
        <div style={{
          padding: '14px 18px', borderRadius: '12px',
          backgroundColor: 'rgba(239,68,68,0.1)',
          border: '1px solid rgba(239,68,68,0.3)',
          color: '#fca5a5', marginBottom: '16px', fontSize: '14px'
        }}>
          {error}
        </div>
      )}

      {/* Aucune donnée */}
      {!loading && tipsData.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '48px 24px',
          backgroundColor: '#1e293b', borderRadius: '16px',
          border: '1px solid #334155'
        }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '50%',
            backgroundColor: 'rgba(100,116,139,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Gift size={28} color="#475569" />
          </div>
          <p style={{ color: '#94a3b8', fontSize: '16px', fontWeight: 500, margin: '0 0 8px' }}>
            Aucun pourboire reçu
          </p>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>
            Vos pourboires apparaîtront ici après chaque shift
          </p>
        </div>
      )}

      {/* ── Vue par Période ── */}
      {viewMode === 'period' && byPeriod.map((period) => {
        const key    = period.periodId || 'no-period'
        const isOpen = !!expandedKeys[key]
        const items  = period.items || []

        const startLabel = period.startDate
          ? new Date(period.startDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })
          : 'Anciens shifts'
        const endLabel = period.endDate
          ? new Date(period.endDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })
          : ''

        return (
          <div key={key} style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            border: period.status === 'active' ? '1px solid rgba(99,102,241,0.4)' : '1px solid #334155',
            marginBottom: '12px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleKey(key)}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '16px 20px', backgroundColor: 'transparent',
                border: 'none', cursor: 'pointer', gap: '14px',
                borderBottom: isOpen ? '1px solid #334155' : 'none'
              }}
            >
              <div style={{
                width: '40px', height: '40px', borderRadius: '10px',
                backgroundColor: period.status === 'active' ? 'rgba(99,102,241,0.2)' : 'rgba(59,130,246,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
              }}>
                <Calendar size={18} color={period.status === 'active' ? '#818cf8' : '#60a5fa'} />
              </div>

              <div style={{ flex: 1, textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <p style={{ color: 'white', fontSize: '15px', fontWeight: 600, margin: 0 }}>
                    {startLabel}{endLabel ? ` → ${endLabel}` : ''}
                  </p>
                  {period.status === 'active' && (
                    <span style={{
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 600,
                      backgroundColor: 'rgba(99,102,241,0.15)', color: '#818cf8'
                    }}>En cours</span>
                  )}
                </div>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '3px 0 0' }}>
                  {items.length} distribution{items.length > 1 ? 's' : ''}
                </p>
              </div>

              <div style={{ textAlign: 'right', marginRight: '12px' }}>
                <p style={{ color: '#34d399', fontSize: '18px', fontWeight: 700, margin: 0 }}>
                  {fmt(period.total)}
                </p>
                <p style={{ color: '#475569', fontSize: '11px', margin: '2px 0 0' }}>reçu</p>
              </div>

              {isOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
            </button>

            {isOpen && (
              <div style={{ padding: '12px 16px' }}>
                {items.map((dist, idx) => {
                  const roleColor = ROLE_COLORS[dist.role] || '#94a3b8'
                  const roleLabel = ROLE_LABELS[dist.role] || dist.role
                  return (
                    <div key={idx} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '12px 14px', borderRadius: '12px',
                      backgroundColor: 'rgba(51,65,85,0.3)',
                      marginBottom: idx < items.length - 1 ? '8px' : 0
                    }}>
                      <div style={{
                        width: '38px', height: '38px', borderRadius: '50%',
                        backgroundColor: 'rgba(59,130,246,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}>
                        <User size={16} color="#60a5fa" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontSize: '14px', fontWeight: 500, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {dist.fromEmployeeName}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, backgroundColor: `${roleColor}20`, color: roleColor }}>
                            {roleLabel}
                          </span>
                          <span style={{ color: '#64748b', fontSize: '11px' }}>{dist.reportDate}</span>
                        </div>
                      </div>
                      <p style={{ color: '#34d399', fontSize: '17px', fontWeight: 700, margin: 0, flexShrink: 0 }}>
                        +{fmt(dist.amount)}
                      </p>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 4px', borderTop: '1px solid #334155', marginTop: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Total de la période</span>
                  <span style={{ color: '#34d399', fontSize: '18px', fontWeight: 700 }}>{fmt(period.total)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}

      {/* ── Vue par Date ── */}
      {viewMode === 'date' && tipsData.map((group) => {
        const isOpen = !!expandedKeys[group.date]
        const items = group.items || group.distributions || []
        const dayTotal = items.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0)

        return (
          <div key={group.date} style={{
            backgroundColor: '#1e293b',
            borderRadius: '16px',
            border: '1px solid #334155',
            marginBottom: '12px',
            overflow: 'hidden'
          }}>
            <button
              onClick={() => toggleKey(group.date)}
              style={{
                display: 'flex', alignItems: 'center', width: '100%',
                padding: '16px 20px', backgroundColor: 'transparent',
                border: 'none', cursor: 'pointer', gap: '14px',
                borderBottom: isOpen ? '1px solid #334155' : 'none'
              }}
            >
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Calendar size={18} color="#60a5fa" />
              </div>
              <div style={{ flex: 1, textAlign: 'left' }}>
                <p style={{ color: 'white', fontSize: '15px', fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>{formatDate(group.date)}</p>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>{items.length} source{items.length > 1 ? 's' : ''}</p>
              </div>
              <div style={{ textAlign: 'right', marginRight: '12px' }}>
                <p style={{ color: '#34d399', fontSize: '18px', fontWeight: 700, margin: 0 }}>{fmt(dayTotal)}</p>
                <p style={{ color: '#475569', fontSize: '11px', margin: '2px 0 0' }}>reçu</p>
              </div>
              {isOpen ? <ChevronUp size={18} color="#64748b" /> : <ChevronDown size={18} color="#64748b" />}
            </button>

            {isOpen && (
              <div style={{ padding: '12px 16px' }}>
                {items.map((dist, idx) => {
                  const roleColor = ROLE_COLORS[dist.role] || '#94a3b8'
                  const roleLabel = ROLE_LABELS[dist.role] || dist.role
                  return (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '12px 14px', borderRadius: '12px', backgroundColor: 'rgba(51,65,85,0.3)', marginBottom: idx < items.length - 1 ? '8px' : 0 }}>
                      <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <User size={16} color="#60a5fa" />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: 'white', fontSize: '14px', fontWeight: 500, margin: '0 0 3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dist.fromEmployeeName}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500, backgroundColor: `${roleColor}20`, color: roleColor }}>{roleLabel}</span>
                          {dist.percentage > 0 && <span style={{ color: '#64748b', fontSize: '11px' }}>{parseFloat(dist.percentage).toFixed(1)}%</span>}
                          {dist.isDonation && <span style={{ padding: '2px 8px', borderRadius: '20px', fontSize: '11px', backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>Don volontaire</span>}
                        </div>
                      </div>
                      <p style={{ color: dist.isMealDeduction ? '#f87171' : '#34d399', fontSize: '17px', fontWeight: 700, margin: 0, flexShrink: 0 }}>
                        {dist.isMealDeduction ? '-' : '+'}{fmt(dist.amount)}
                      </p>
                    </div>
                  )
                })}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px 4px', borderTop: '1px solid #334155', marginTop: '12px' }}>
                  <span style={{ color: '#64748b', fontSize: '13px' }}>Total du shift</span>
                  <span style={{ color: '#34d399', fontSize: '18px', fontWeight: 700 }}>{fmt(dayTotal)}</span>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
