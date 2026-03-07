import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { reportAPI, restaurantAPI } from '../services/api'
import {
  FileText, Check, X, Clock, ChevronDown, Download,
  Eye, Loader, AlertCircle, DollarSign, Users, Gift,
  UtensilsCrossed, Calculator, Image, BarChart3, UserPlus
} from 'lucide-react'

// ── Export CSV ────────────────────────────────────────────────
function exportCSV(reports, filename) {
  const headers = [
    'Date', 'Heure', 'Employé', 'Ventes Totales', 'Comptant',
    'Tip-Out Total', 'Due Back', 'Statut'
  ]
  const rows = reports.map(r => {
    const d = new Date(r.createdAt)
    return [
      d.toLocaleDateString('fr-CA'),
      d.toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' }),
      r.employeeName || '',
      (r.totalSales || 0).toFixed(2),
      (r.cashAmount || 0).toFixed(2),
      (r.tipOutAmount || 0).toFixed(2),
      (r.dueBack || 0).toFixed(2),
      r.status
    ]
  })
  const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ── Export Stats CSV ──────────────────────────────────────────
function exportStatsCSV(reports, monthLabel) {
  const validated = reports.filter(r => r.status === 'validated')
  const totalSales   = validated.reduce((s, r) => s + (r.totalSales   || 0), 0)
  const totalTipOut  = validated.reduce((s, r) => s + (r.tipOutAmount || 0), 0)
  const totalDueBack = validated.reduce((s, r) => s + (r.dueBack      || 0), 0)

  // Agréger distributions par position ET par personne
  const byPosition = {}  // { position: { pct, total, persons: { name: total } } }
  const byPerson   = {}  // { personName: total }

  validated.forEach(r => {
    ;(r.tipOutBreakdown || []).forEach(item => {
      const pos = item.position || item.role || 'Autre'
      const pct = parseFloat(item.percentage) || 0
      if (!byPosition[pos]) byPosition[pos] = { pct, total: 0, persons: {} }

      if (item.isPool || pos.toLowerCase().includes('pool') || pos.toLowerCase().includes('cuisine')) {
        const amt = parseFloat(item.totalAmount ?? item.amount) || 0
        byPosition[pos].total += amt
        byPosition[pos].persons['Pool Cuisine'] = (byPosition[pos].persons['Pool Cuisine'] || 0) + amt
        byPerson['Pool Cuisine'] = (byPerson['Pool Cuisine'] || 0) + amt
      } else {
        for (const p of (item.persons || [])) {
          const amt = parseFloat(p.net ?? p.tipAmount) || 0
          byPosition[pos].total += amt
          byPosition[pos].persons[p.personName] = (byPosition[pos].persons[p.personName] || 0) + amt
          byPerson[p.personName] = (byPerson[p.personName] || 0) + amt
        }
        // Fallback structure legacy (personName/amount directement sur l'item)
        if (!item.persons?.length && item.personName) {
          const amt = parseFloat(item.amount) || 0
          byPosition[pos].total += amt
          byPosition[pos].persons[item.personName] = (byPosition[pos].persons[item.personName] || 0) + amt
          byPerson[item.personName] = (byPerson[item.personName] || 0) + amt
        }
      }
    })
  })

  const headers = ['Type', 'Catégorie / Nom', 'Rôle / Position', '%', 'Montant ($)']
  const rows = [
    // Résumé global
    ['RÉSUMÉ', `Ventes totales (${monthLabel})`,    '', '',  totalSales.toFixed(2)],
    ['RÉSUMÉ', `Tip-Out total (${monthLabel})`,     '', '',  totalTipOut.toFixed(2)],
    ['RÉSUMÉ', `Due Back total (${monthLabel})`,    '', '',  totalDueBack.toFixed(2)],
    ['RÉSUMÉ', 'Rapports validés',                  '', '',  validated.length],
    ['', '', '', '', ''],
    // Par position avec détail des personnes
    ...Object.entries(byPosition).flatMap(([pos, data]) => [
      ['POSITION', pos, pos, data.pct.toFixed(1) + '%', data.total.toFixed(2)],
      ...Object.entries(data.persons).map(([name, amt]) =>
        ['  BÉNÉFICIAIRE', name, pos, '', amt.toFixed(2)]
      )
    ]),
    ['', '', '', '', ''],
    // Récap total reçu par personne (toutes positions confondues)
    ...Object.entries(byPerson).map(([name, amt]) =>
      ['TOTAL REÇU', name, 'Tous rôles', '', amt.toFixed(2)]
    )
  ]

  const csv = [headers, ...rows].map(row => row.map(v => `"${v}"`).join(',')).join('\n')
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = `shiftclose_stats_${monthLabel}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

// ── Générer les options de mois (12 derniers mois) ───────────
function getMonthOptions() {
  const options = [{ value: 'all', label: 'Tous les mois' }]
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleDateString('fr-CA', { month: 'long', year: 'numeric' })
    options.push({ value, label })
  }
  return options
}

export default function Reports() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { isManager, currentRestaurant, user } = useAuth()

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMonth,  setFilterMonth]  = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError]       = useState('')

  // Manager: saisir pour un serveur
  const [teamMembers, setTeamMembers] = useState([])
  const [showForUserModal, setShowForUserModal] = useState(false)

  const monthOptions = getMonthOptions()

  useEffect(() => {
    if (!currentRestaurant?.id) return
    fetchReports()
  }, [currentRestaurant?.id, filterStatus, filterMonth])

  useEffect(() => {
    if (isManager && currentRestaurant?.id) {
      restaurantAPI.getTeam(currentRestaurant.id)
        .then(res => setTeamMembers((res.members || []).filter(m => m.id !== user?.id)))
        .catch(() => {})
    }
  }, [isManager, currentRestaurant?.id])

  const fetchReports = async () => {
    setLoading(true)
    setError('')
    try {
      const filters = {}
      if (filterStatus !== 'all') filters.status = filterStatus
      if (filterMonth  !== 'all') filters.month  = filterMonth
      const res = await reportAPI.getAll(currentRestaurant.id, filters)
      if (res.success) setReports(res.reports)
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleValidate = async (reportId) => {
    setActionLoading(reportId)
    try {
      await reportAPI.validate(reportId, 'validated')
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'validated' } : r))
      if (selectedReport?.id === reportId) setSelectedReport(prev => ({ ...prev, status: 'validated' }))
    } catch (err) {
      setError(err.message || 'Erreur lors de la validation.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleReject = async (reportId) => {
    setActionLoading(reportId)
    try {
      await reportAPI.validate(reportId, 'rejected')
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'rejected' } : r))
      if (selectedReport?.id === reportId) setSelectedReport(prev => ({ ...prev, status: 'rejected' }))
    } catch (err) {
      setError(err.message || 'Erreur lors du rejet.')
    } finally {
      setActionLoading(null)
    }
  }

  const handleExportCSV = () => {
    const month = filterMonth !== 'all' ? filterMonth : 'complet'
    exportCSV(reports, `shiftclose_rapports_${month}.csv`)
  }

  const handleExportStats = () => {
    const month = filterMonth !== 'all' ? filterMonth : 'complet'
    exportStatsCSV(reports, month)
  }

  // Redirige vers CashOut avec l'employé présélectionné
  const handleCashoutForUser = (member) => {
    setShowForUserModal(false)
    navigate(`/cash-out?forUserId=${member.id}&forUserName=${encodeURIComponent(member.firstName + ' ' + member.lastName)}`)
  }

  const getStatusBadge = (status) => {
    const map = {
      pending:   { bg: 'rgba(245,158,11,0.12)',  color: '#fbbf24', border: 'rgba(245,158,11,0.3)',  icon: <Clock size={12} />,  label: t('reports.pending')   },
      validated: { bg: 'rgba(16,185,129,0.12)',  color: '#34d399', border: 'rgba(16,185,129,0.3)',  icon: <Check size={12} />,  label: t('reports.validated') },
      rejected:  { bg: 'rgba(239,68,68,0.12)',   color: '#f87171', border: 'rgba(239,68,68,0.3)',   icon: <X size={12} />,      label: t('reports.rejected')  }
    }
    const s = map[status] || map.pending
    return (
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: '5px',
        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 500,
        backgroundColor: s.bg, color: s.color, border: `1px solid ${s.border}`
      }}>
        {s.icon}{s.label}
      </span>
    )
  }

  const dueBackStyle = (dueBack) => {
    if (dueBack > 0) return { bg: 'rgba(239,68,68,0.15)',   color: '#f87171', border: 'rgba(239,68,68,0.3)',   label: 'À remettre au gérant' }
    if (dueBack < 0) return { bg: 'rgba(16,185,129,0.15)', color: '#34d399', border: 'rgba(16,185,129,0.3)', label: 'Le gérant vous doit' }
    return              { bg: 'rgba(71,85,105,0.3)',        color: '#94a3b8', border: 'rgba(71,85,105,0.5)',   label: 'Caisse équilibrée' }
  }

  const fmt = (n) => `$${Math.abs(parseFloat(n) || 0).toFixed(2)}`

  const sel = { // select style helper
    appearance: 'none', backgroundColor: '#1e293b', border: '1px solid #334155',
    borderRadius: '10px', padding: '9px 32px 9px 12px', color: 'white',
    fontSize: '13px', outline: 'none', cursor: 'pointer'
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: '22px', fontWeight: 700, margin: '0 0 4px' }}>{t('reports.title')}</h1>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {reports.length} rapport{reports.length !== 1 ? 's' : ''} • {currentRestaurant?.name}
          </p>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
          {/* Filtre par mois */}
          <div style={{ position: 'relative' }}>
            <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)} style={sel}>
              {monthOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          </div>

          {/* Filtre par statut */}
          <div style={{ position: 'relative' }}>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={sel}>
              <option value="all">{t('common.all')}</option>
              <option value="pending">{t('reports.pending')}</option>
              <option value="validated">{t('reports.validated')}</option>
              <option value="rejected">{t('reports.rejected')}</option>
            </select>
            <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
          </div>

          {/* Export rapports */}
          <button
            onClick={handleExportCSV}
            title="Exporter les rapports CSV"
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '9px 14px', borderRadius: '10px',
              border: '1px solid #334155', backgroundColor: '#1e293b',
              color: '#94a3b8', fontSize: '13px', cursor: 'pointer'
            }}
          >
            <Download size={15} />
            Rapports
          </button>

          {/* Export statistiques */}
          {isManager && (
            <button
              onClick={handleExportStats}
              title="Exporter les statistiques pour le comptable"
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 14px', borderRadius: '10px',
                border: '1px solid rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.08)',
                color: '#60a5fa', fontSize: '13px', cursor: 'pointer'
              }}
            >
              <BarChart3 size={15} />
              Stats comptable
            </button>
          )}

          {/* Saisir pour un serveur (manager) */}
          {isManager && (
            <button
              onClick={() => setShowForUserModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 14px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(59,130,246,0.3)'
              }}
            >
              <UserPlus size={15} />
              Saisir pour un serveur
            </button>
          )}
        </div>
      </div>

      {/* ── Error ── */}
      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px',
          backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '12px', color: '#fca5a5', fontSize: '14px'
        }}>
          <AlertCircle size={16} />{error}
        </div>
      )}

      {/* ── Liste des rapports ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
          <Loader size={36} style={{ margin: '0 auto 12px', color: '#334155', animation: 'spin 1s linear infinite', display: 'block' }} />
          <p style={{ color: '#64748b' }}>Chargement des rapports...</p>
        </div>
      ) : reports.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 24px', backgroundColor: '#1e293b', borderRadius: '16px', border: '1px solid #334155' }}>
          <FileText size={48} style={{ margin: '0 auto 16px', color: '#334155', display: 'block' }} />
          <p style={{ color: '#94a3b8', fontSize: '16px', margin: '0 0 6px' }}>{t('reports.noReports')}</p>
          <p style={{ color: '#475569', fontSize: '13px', margin: 0 }}>Aucun rapport pour cette période</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {reports.map((report) => {
            const empName   = report.employeeName || '?'
            const initials  = empName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
            const date      = new Date(report.createdAt).toLocaleDateString('fr-CA')
            const time      = new Date(report.createdAt).toLocaleTimeString('fr-CA', { hour: '2-digit', minute: '2-digit' })
            const isActing  = actionLoading === report.id
            const db        = parseFloat(report.dueBack) || 0
            const dbStyle   = dueBackStyle(db)

            return (
              <div key={report.id} style={{
                background: 'linear-gradient(145deg, #1e293b 0%, #1a2332 100%)',
                border: '1px solid #334155', borderRadius: '16px', padding: '16px 20px',
                transition: 'border-color 0.2s'
              }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>

                  {/* Employé + date */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                    <div style={{
                      width: 44, height: 44, borderRadius: '50%', flexShrink: 0,
                      background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <span style={{ color: 'white', fontWeight: 700, fontSize: '13px' }}>{initials}</span>
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ color: 'white', fontWeight: 600, margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{empName}</p>
                      <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{date} · {time}</p>
                    </div>
                  </div>

                  {/* Stats */}
                  <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#475569', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>Ventes</p>
                      <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: 0 }}>${(report.totalSales || 0).toFixed(2)}</p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ color: '#475569', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>Tip-Out</p>
                      <p style={{ color: '#fbbf24', fontWeight: 600, fontSize: '14px', margin: 0 }}>-${(report.tipOutAmount || 0).toFixed(2)}</p>
                    </div>
                    {report.dueBack !== undefined && (
                      <div style={{
                        textAlign: 'right', padding: '4px 10px', borderRadius: '8px',
                        backgroundColor: dbStyle.bg, border: `1px solid ${dbStyle.border}`
                      }}>
                        <p style={{ color: dbStyle.color, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 2px' }}>Due Back</p>
                        <p style={{ color: dbStyle.color, fontWeight: 700, fontSize: '15px', margin: 0 }}>
                          {db < 0 ? '-' : '+'}{fmt(db)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Statut + actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {getStatusBadge(report.status)}

                    {isManager && report.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleValidate(report.id)}
                          disabled={isActing}
                          title={t('reports.validate')}
                          style={{
                            padding: '7px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            backgroundColor: 'rgba(16,185,129,0.12)', color: '#34d399'
                          }}
                        >
                          {isActing ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Check size={16} />}
                        </button>
                        <button
                          onClick={() => handleReject(report.id)}
                          disabled={isActing}
                          title={t('reports.reject')}
                          style={{
                            padding: '7px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                            backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171'
                          }}
                        >
                          <X size={16} />
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setSelectedReport(report)}
                      title={t('reports.details')}
                      style={{
                        padding: '7px', borderRadius: '9px', border: '1px solid #334155', cursor: 'pointer',
                        backgroundColor: 'transparent', color: '#94a3b8'
                      }}
                    >
                      <Eye size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal "Saisir pour un serveur" ── */}
      {showForUserModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
        }} onClick={e => e.target === e.currentTarget && setShowForUserModal(false)}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid #334155',
            borderRadius: '20px', maxWidth: '400px', width: '100%',
            backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
          }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: '0 0 4px' }}>Saisir un Cash Out</h2>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>Pour quel employé ?</p>
              </div>
              <button onClick={() => setShowForUserModal(false)} style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748b' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '400px', overflowY: 'auto' }}>
              {teamMembers.filter(m => m.canDoCashout !== false || true).map(member => (
                <button
                  key={member.id}
                  onClick={() => handleCashoutForUser(member)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 14px', borderRadius: '12px', border: '1px solid #334155',
                    backgroundColor: 'rgba(30,41,59,0.8)', cursor: 'pointer', textAlign: 'left',
                    transition: 'border-color 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#334155'}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '12px' }}>
                      {member.firstName?.[0]}{member.lastName?.[0]}
                    </span>
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 500, margin: 0 }}>{member.firstName} {member.lastName}</p>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '2px 0 0' }}>{member.email}</p>
                  </div>
                </button>
              ))}
              {teamMembers.length === 0 && (
                <p style={{ color: '#64748b', textAlign: 'center', padding: '24px 0' }}>Aucun membre dans l'équipe</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal détail ── */}
      {selectedReport && (() => {
        const db      = parseFloat(selectedReport.dueBack) || 0
        const dbStyle = dueBackStyle(db)
        return (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
          }}>
            <div style={{
              backgroundColor: '#1e293b', border: '1px solid #334155',
              borderRadius: '20px', maxWidth: '480px', width: '100%',
              maxHeight: '92vh', overflowY: 'auto',
              boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}>
              {/* En-tête */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, backgroundColor: '#1e293b', zIndex: 1 }}>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '18px', margin: 0 }}>{t('reports.details')}</h2>
                <button onClick={() => setSelectedReport(null)} style={{ padding: '6px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'rgba(51,65,85,0.5)', color: '#94a3b8' }}>
                  <X size={20} />
                </button>
              </div>

              {/* Employé */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: 54, height: 54, borderRadius: '50%', flexShrink: 0,
                    background: 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ color: 'white', fontWeight: 700, fontSize: '17px' }}>
                      {(selectedReport.employeeName || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: '0 0 4px' }}>{selectedReport.employeeName}</p>
                    <p style={{ color: '#64748b', fontSize: '13px', margin: '0 0 6px' }}>
                      {new Date(selectedReport.createdAt).toLocaleDateString('fr-CA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                    {getStatusBadge(selectedReport.status)}
                  </div>
                </div>
              </div>

              {/* Résumé financier */}
              <div style={{ padding: '20px 24px', borderBottom: '1px solid #334155' }}>
                <p style={{ color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 14px' }}>
                  Résumé financier
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Ventes totales</span>
                    <span style={{ color: 'white', fontWeight: 600 }}>${(selectedReport.totalSales || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Tip-Out total</span>
                    <span style={{ color: '#fbbf24', fontWeight: 600 }}>-${(selectedReport.tipOutAmount || 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#94a3b8', fontSize: '14px' }}>Comptant</span>
                    <span style={{ color: (selectedReport.cashAmount || 0) >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                      {(selectedReport.cashAmount || 0) >= 0 ? '+' : ''}{(selectedReport.cashAmount || 0).toFixed(2)} $
                    </span>
                  </div>

                  {/* Due Back coloré */}
                  <div style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '14px 16px', marginTop: '6px',
                    backgroundColor: dbStyle.bg, borderRadius: '12px',
                    border: `1px solid ${dbStyle.border}`
                  }}>
                    <div>
                      <p style={{ color: dbStyle.color, fontSize: '12px', margin: '0 0 2px', fontWeight: 500 }}>{dbStyle.label}</p>
                      <p style={{ color: dbStyle.color, fontWeight: 800, fontSize: '24px', margin: 0 }}>
                        {db < 0 ? '-' : ''}{fmt(db)}
                      </p>
                    </div>
                    <DollarSign size={34} color={dbStyle.color} style={{ opacity: 0.5 }} />
                  </div>

                  {selectedReport.validatedByName && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '10px', borderTop: '1px solid #334155', marginTop: '4px' }}>
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Validé par</span>
                      <span style={{ color: '#cbd5e1', fontSize: '13px', fontWeight: 500 }}>{selectedReport.validatedByName}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Distributions tip-out */}
              {selectedReport.tipOutBreakdown?.length > 0 && (
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Users size={14} color="#60a5fa" />
                    <p style={{ color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                      Distributions Tip-Out
                    </p>
                  </div>
                  {selectedReport.tipOutBreakdown.map((item, idx) => (
                    <div key={idx} style={{ marginBottom: 10 }}>
                      {/* En-tête de la position */}
                      <div style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '8px 12px', borderRadius: '8px',
                        backgroundColor: 'rgba(59,130,246,0.08)',
                        border: '1px solid rgba(59,130,246,0.15)',
                        marginBottom: 4
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ color: '#93c5fd', fontWeight: 600, fontSize: 13 }}>
                            {item.position || item.role || 'Position'}
                          </span>
                          {item.isPool && (
                            <span style={{
                              fontSize: 10, padding: '1px 6px', borderRadius: 4,
                              backgroundColor: 'rgba(251,191,36,0.15)', color: '#fbbf24', fontWeight: 600
                            }}>POOL</span>
                          )}
                        </div>
                        <span style={{ color: '#94a3b8', fontSize: 12 }}>
                          {(item.percentage || 0).toFixed(1)}% →{' '}
                          <strong style={{ color: '#fbbf24' }}>${(item.totalAmount || 0).toFixed(2)}</strong>
                        </span>
                      </div>

                      {/* Personnes (si pas pool) */}
                      {!item.isPool && item.persons?.length > 0 && item.persons.map((p, pidx) => (
                        <div key={pidx} style={{
                          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                          padding: '7px 12px 7px 22px', borderRadius: '7px', marginBottom: 3,
                          backgroundColor: 'rgba(51,65,85,0.3)'
                        }}>
                          <div>
                            <p style={{ color: '#e2e8f0', fontSize: 13, fontWeight: 500, margin: 0 }}>{p.personName}</p>
                            {(p.meal > 0 || p.donation > 0) && (
                              <p style={{ color: '#64748b', fontSize: 11, margin: '2px 0 0' }}>
                                Tip: ${(p.tipAmount || 0).toFixed(2)}
                                {p.meal > 0 && <> · repas -{fmt(p.meal)}</>}
                                {p.donation > 0 && <> · don +{fmt(p.donation)}</>}
                              </p>
                            )}
                          </div>
                          <span style={{ color: '#34d399', fontWeight: 700, fontSize: 14 }}>
                            ${(p.net ?? p.tipAmount ?? 0).toFixed(2)}
                          </span>
                        </div>
                      ))}

                      {/* Pool cuisine : aucune personne spécifique */}
                      {item.isPool && (
                        <div style={{
                          padding: '7px 12px 7px 22px', borderRadius: '7px',
                          backgroundColor: 'rgba(251,191,36,0.06)',
                          color: '#94a3b8', fontSize: 12
                        }}>
                          Versé dans le pool cuisine
                        </div>
                      )}

                      {/* Pas de personnes sélectionnées */}
                      {!item.isPool && (!item.persons || item.persons.length === 0) && (
                        <div style={{
                          padding: '7px 12px 7px 22px', borderRadius: '7px',
                          backgroundColor: 'rgba(51,65,85,0.2)',
                          color: '#64748b', fontSize: 12
                        }}>
                          Aucun bénéficiaire sélectionné
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Preuve photo */}
              {selectedReport.proofImageBase64 && (
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #334155' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Image size={14} color="#94a3b8" />
                    <p style={{ color: '#475569', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                      Preuve (photo)
                    </p>
                  </div>
                  <img
                    src={selectedReport.proofImageBase64}
                    alt="Preuve de calcul"
                    style={{ width: '100%', borderRadius: '12px', border: '1px solid #334155', maxHeight: '300px', objectFit: 'contain', backgroundColor: '#0f172a' }}
                  />
                </div>
              )}

              {/* Boutons validation */}
              {isManager && selectedReport.status === 'pending' && (
                <div style={{ padding: '16px 24px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleReject(selectedReport.id)}
                    disabled={actionLoading === selectedReport.id}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '12px', borderRadius: '11px', border: '1px solid rgba(239,68,68,0.3)',
                      backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171',
                      fontWeight: 600, fontSize: '14px', cursor: 'pointer'
                    }}
                  >
                    <X size={16} /> {t('reports.reject')}
                  </button>
                  <button
                    onClick={() => handleValidate(selectedReport.id)}
                    disabled={actionLoading === selectedReport.id}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '12px', borderRadius: '11px', border: 'none',
                      background: 'linear-gradient(135deg, #10b981, #059669)', color: 'white',
                      fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(16,185,129,0.3)'
                    }}
                  >
                    {actionLoading === selectedReport.id
                      ? <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
                      : <Check size={16} />}
                    {t('reports.validate')}
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
