import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { reportAPI, restaurantAPI, payPeriodAPI } from '../services/api'
import {
  FileText, Check, X, Clock, ChevronDown, Download,
  Eye, Loader, AlertCircle, DollarSign, Users, Gift,
  UtensilsCrossed, Calculator, Image, BarChart3, UserPlus,
  CalendarDays, Lock, Plus, Pencil, Trash2, RefreshCw, Play
} from 'lucide-react'

// ── Noms d'affichage des positions ────────────────────────────
const POSITION_LABELS = {
  kitchen_pool:  'Pool Cuisine',
  cuisine:       'Pool Cuisine',
  'pool cuisine':'Pool Cuisine',
  bar:           'Bar',
  bartender:     'Bartender',
  commis:        'Commis',
  host:          'Hôte',
  manager:       'Manager',
  server:        'Serveur'
}
const formatPosition = (pos) =>
  pos ? (POSITION_LABELS[pos.toLowerCase()] ?? pos) : 'Position'

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
      const pos = formatPosition(item.position || item.role || 'Autre')
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
  const [searchParams, setSearchParams] = useSearchParams()
  const { isManager, currentRestaurant, user } = useAuth()

  const [filterStatus, setFilterStatus] = useState('all')
  const [filterMonth,  setFilterMonth]  = useState('all')
  const [filterPeriod, setFilterPeriod] = useState('all')
  const [selectedReport, setSelectedReport] = useState(null)
  const [reports, setReports]   = useState([])
  const [loading, setLoading]   = useState(true)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError]       = useState('')

  // Périodes de paie
  const [periods, setPeriods] = useState([])
  const [closingPeriod, setClosingPeriod] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)

  // Gestion des périodes (modal dédié)
  const [showManagePeriodsModal, setShowManagePeriodsModal] = useState(false)
  const [managePeriodView, setManagePeriodView] = useState('list') // 'list' | 'create' | 'edit'
  const [editingPeriod, setEditingPeriod] = useState(null)
  const [periodForm, setPeriodForm] = useState({ start_date: '', end_date: '' })
  const [periodFormError, setPeriodFormError] = useState('')
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [closingPeriodId, setClosingPeriodId] = useState(null)
  const [launchingPeriodId, setLaunchingPeriodId] = useState(null)

  // Suppression de rapport
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null) // reportId
  const [deleteLoading, setDeleteLoading] = useState(false)

  // Rejet avec raison
  const [showRejectModal, setShowRejectModal] = useState(null) // reportId
  const [rejectNote, setRejectNote] = useState('')

  // Déplacement de rapport vers une autre période
  const [showMovePeriodModal, setShowMovePeriodModal] = useState(false)
  const [movingReport, setMovingReport] = useState(null)
  const [moveTargetPeriodId, setMoveTargetPeriodId] = useState('')
  const [movingLoading, setMovingLoading] = useState(false)

  // Manager: saisir pour un serveur
  const [teamMembers, setTeamMembers] = useState([])
  const [showForUserModal, setShowForUserModal] = useState(false)

  const monthOptions = getMonthOptions()

  useEffect(() => {
    if (!currentRestaurant?.id) return
    fetchReports()
  }, [currentRestaurant?.id, filterStatus, filterMonth, filterPeriod])

  useEffect(() => {
    if (!currentRestaurant?.id) return
    // Charger les périodes de paie
    payPeriodAPI.getAll(currentRestaurant.id)
      .then(res => setPeriods(res.periods || []))
      .catch(() => {})
  }, [currentRestaurant?.id])

  // Ouvrir le modal "Créer une période" si ?createPeriod=1 dans l'URL
  useEffect(() => {
    if (searchParams.get('createPeriod') === '1' && isManager) {
      setPeriodForm({ start_date: '', end_date: '' })
      setPeriodFormError('')
      setManagePeriodView('create')
      setShowManagePeriodsModal(true)
      // Nettoyer le paramètre URL
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, isManager])

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
      if (filterStatus !== 'all') filters.status   = filterStatus
      if (filterPeriod !== 'all') filters.periodId = filterPeriod
      else if (filterMonth !== 'all') filters.month = filterMonth
      const res = await reportAPI.getAll(currentRestaurant.id, filters)
      if (res.success) setReports(res.reports)
    } catch (err) {
      setError(err.message || 'Erreur lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const handleClosePeriod = async () => {
    const activePeriod = periods.find(p => p.status === 'active')
    if (!activePeriod) return
    setClosingPeriod(true)
    try {
      const res = await payPeriodAPI.close(currentRestaurant.id, activePeriod.id)
      // Export CSV automatique du résumé
      if (res.summary) {
        exportPeriodSummaryCSV(res.summary, activePeriod)
      }
      // Rafraîchir les périodes
      const updatedPeriods = await payPeriodAPI.getAll(currentRestaurant.id)
      setPeriods(updatedPeriods.periods || [])
      setFilterPeriod('all')
      setShowCloseModal(false)
      fetchReports()
    } catch (err) {
      setError(err.message || 'Erreur lors de la clôture.')
    } finally {
      setClosingPeriod(false)
    }
  }

  // Export CSV du résumé d'une période
  const exportPeriodSummaryCSV = (summary, period) => {
    const headers = ['Employé', 'Ventes Totales', 'Tip-Out Distribué', 'Tips Reçus', 'Nb Rapports']
    const rows = (summary.employees || []).map(e => [
      e.employeeName,
      (e.totalSales   || 0).toFixed(2),
      (e.tipOutGiven  || 0).toFixed(2),
      (e.tipsReceived || 0).toFixed(2),
      e.reportCount || 0
    ])
    const totalsRow = [
      'TOTAL',
      (summary.totals?.totalSales    || 0).toFixed(2),
      (summary.totals?.totalTipOut   || 0).toFixed(2),
      (summary.totals?.totalReceived || 0).toFixed(2),
      summary.totals?.totalReports || 0
    ]
    rows.push([])
    rows.push(totalsRow)
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `periode_${period.startDate}_${period.endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Format une période pour l'affichage
  const formatPeriodLabel = (p) => {
    const start = new Date(p.startDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
    const end   = new Date(p.endDate   + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' })
    const statusLabel = p.status === 'active' ? '(active)' : p.status === 'pending' ? '(planifiée)' : '(clôturée)'
    return `${start} → ${end} ${statusLabel}`
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

  const handleReject = async (reportId, note = '') => {
    setActionLoading(reportId)
    try {
      await reportAPI.validate(reportId, 'rejected', note)
      setReports(prev => prev.map(r =>
        r.id === reportId ? { ...r, status: 'rejected', validationNote: note } : r
      ))
      if (selectedReport?.id === reportId)
        setSelectedReport(prev => ({ ...prev, status: 'rejected', validationNote: note }))
      setShowRejectModal(null)
      setRejectNote('')
    } catch (err) {
      setError(err.message || 'Erreur lors du rejet.')
    } finally {
      setActionLoading(null)
    }
  }

  const openRejectModal = (reportId) => {
    setRejectNote('')
    setShowRejectModal(reportId)
  }

  const handleDelete = async (reportId) => {
    setDeleteLoading(true)
    try {
      await reportAPI.delete(reportId)
      setReports(prev => prev.filter(r => r.id !== reportId))
      if (selectedReport?.id === reportId) setSelectedReport(null)
      setShowDeleteConfirm(null)
    } catch (err) {
      setError(err.message || 'Erreur lors de la suppression.')
      setShowDeleteConfirm(null)
    } finally {
      setDeleteLoading(false)
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

  const refreshPeriods = () => {
    if (!currentRestaurant?.id) return
    payPeriodAPI.getAll(currentRestaurant.id)
      .then(res => setPeriods(res.periods || []))
      .catch(() => {})
  }

  const openManagePeriods = () => {
    setManagePeriodView('list')
    setPeriodFormError('')
    setShowManagePeriodsModal(true)
  }

  const handleCreatePeriod = async () => {
    setPeriodFormError('')
    if (!periodForm.start_date || !periodForm.end_date) return setPeriodFormError('Les deux dates sont requises.')
    if (periodForm.start_date >= periodForm.end_date) return setPeriodFormError('La date de fin doit être après la date de début.')
    setSavingPeriod(true)
    try {
      await payPeriodAPI.create(currentRestaurant.id, periodForm)
      setPeriodForm({ start_date: '', end_date: '' })
      setManagePeriodView('list')
      refreshPeriods()
    } catch (e) {
      setPeriodFormError(e.message || 'Erreur lors de la création.')
    } finally {
      setSavingPeriod(false)
    }
  }

  const handleEditPeriodSave = async () => {
    if (!editingPeriod) return
    setPeriodFormError('')
    if (!periodForm.start_date || !periodForm.end_date) return setPeriodFormError('Les deux dates sont requises.')
    if (periodForm.start_date >= periodForm.end_date) return setPeriodFormError('La date de fin doit être après la date de début.')
    setSavingPeriod(true)
    try {
      await payPeriodAPI.update(currentRestaurant.id, editingPeriod.id, periodForm)
      setEditingPeriod(null)
      setPeriodForm({ start_date: '', end_date: '' })
      setManagePeriodView('list')
      refreshPeriods()
    } catch (e) {
      setPeriodFormError(e.message || 'Erreur lors de la modification.')
    } finally {
      setSavingPeriod(false)
    }
  }

  const handleClosePeriodManage = async (period) => {
    setClosingPeriodId(period.id)
    try {
      const res = await payPeriodAPI.close(currentRestaurant.id, period.id)
      if (res.summary) exportPeriodSummaryCSV(res.summary, period)
      refreshPeriods()
      fetchReports()
    } catch (e) {
      setError(e.message || 'Erreur lors de la clôture.')
    } finally {
      setClosingPeriodId(null)
    }
  }

  const handleLaunchPeriod = async (period) => {
    setLaunchingPeriodId(period.id)
    try {
      await payPeriodAPI.launch(currentRestaurant.id, period.id)
      refreshPeriods()
      fetchReports()
    } catch (e) {
      setError(e.message || 'Erreur lors du lancement.')
    } finally {
      setLaunchingPeriodId(null)
    }
  }

  const handleOpenMovePeriod = (report) => {
    setMovingReport(report)
    setMoveTargetPeriodId('')
    setShowMovePeriodModal(true)
  }

  const handleMovePeriod = async () => {
    if (!movingReport || !moveTargetPeriodId) return
    setMovingLoading(true)
    try {
      await reportAPI.movePeriod(movingReport.id, moveTargetPeriodId)
      setReports(prev => prev.map(r =>
        r.id === movingReport.id ? { ...r, payPeriodId: moveTargetPeriodId } : r
      ))
      setShowMovePeriodModal(false)
      setMovingReport(null)
      fetchReports()
    } catch (err) {
      setError(err.message || 'Erreur lors du déplacement.')
    } finally {
      setMovingLoading(false)
    }
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
          {/* Filtre par période de paie */}
          {periods.length > 0 && (
            <div style={{ position: 'relative' }}>
              <CalendarDays size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              <select
                value={filterPeriod}
                onChange={e => { setFilterPeriod(e.target.value); if (e.target.value !== 'all') setFilterMonth('all') }}
                style={{ ...sel, paddingLeft: '28px' }}
              >
                <option value="all">Toutes les périodes</option>
                {periods.map(p => (
                  <option key={p.id} value={p.id}>{formatPeriodLabel(p)}</option>
                ))}
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
            </div>
          )}

          {/* Filtre par mois (désactivé si période sélectionnée) */}
          <div style={{ position: 'relative' }}>
            <select
              value={filterMonth}
              onChange={e => { setFilterMonth(e.target.value); setFilterPeriod('all') }}
              style={{ ...sel, opacity: filterPeriod !== 'all' ? 0.4 : 1 }}
              disabled={filterPeriod !== 'all'}
            >
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

          {/* Gérer les périodes (manager) */}
          {isManager && (
            <button
              onClick={openManagePeriods}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '9px 14px', borderRadius: '10px',
                border: '1px solid rgba(5,150,105,0.35)',
                backgroundColor: 'rgba(5,150,105,0.08)',
                color: '#34d399', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <CalendarDays size={15} />
              Périodes
              {periods.some(p => p.status === 'active' || p.status === 'pending') && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  backgroundColor: periods.some(p => p.status === 'active') ? '#34d399' : '#60a5fa',
                  display: 'inline-block'
                }} />
              )}
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

                  {/* Raison de rejet (employé) */}
                  {report.status === 'rejected' && report.validationNote && (
                    <div style={{
                      width: '100%', padding: '8px 12px', borderRadius: '8px',
                      backgroundColor: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)',
                      display: 'flex', alignItems: 'flex-start', gap: '6px'
                    }}>
                      <AlertCircle size={13} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: '#fca5a5', fontSize: '12px', lineHeight: 1.5 }}>
                        <strong>Raison :</strong> {report.validationNote}
                      </span>
                    </div>
                  )}

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
                          onClick={() => openRejectModal(report.id)}
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

                    {/* Bouton Modifier & Renvoyer — employé concerné, rapport rejeté */}
                    {!isManager && report.status === 'rejected' && report.employeeId === user?.id && (
                      <button
                        onClick={() => navigate(`/cash-out?editReportId=${report.id}`)}
                        title="Modifier et renvoyer"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '7px 11px', borderRadius: '9px',
                          border: '1px solid rgba(99,102,241,0.35)',
                          cursor: 'pointer', backgroundColor: 'rgba(99,102,241,0.1)',
                          color: '#a5b4fc', fontSize: '12px', fontWeight: 600
                        }}
                      >
                        <RefreshCw size={14} /> Modifier
                      </button>
                    )}

                    {isManager && periods.length > 0 && (
                      <button
                        onClick={() => handleOpenMovePeriod(report)}
                        title="Changer de période"
                        style={{
                          padding: '7px', borderRadius: '9px', border: '1px solid rgba(139,92,246,0.3)',
                          cursor: 'pointer', backgroundColor: 'rgba(139,92,246,0.08)', color: '#a78bfa'
                        }}
                      >
                        <CalendarDays size={16} />
                      </button>
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

                    {isManager && (
                      <button
                        onClick={() => setShowDeleteConfirm(report.id)}
                        title="Supprimer le rapport"
                        style={{
                          padding: '7px', borderRadius: '9px', border: '1px solid rgba(239,68,68,0.3)',
                          cursor: 'pointer', backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171'
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── Modal Clôture de période ── */}
      {showCloseModal && (() => {
        const activePeriod = periods.find(p => p.status === 'active')
        return (
          <div style={{
            position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
          }} onClick={e => e.target === e.currentTarget && setShowCloseModal(false)}>
            <div style={{
              background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '20px', maxWidth: '420px', width: '100%',
              backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
            }}>
              <div style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ padding: '10px', backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: '12px' }}>
                    <Lock size={20} color="#f87171" />
                  </div>
                  <div>
                    <h2 style={{ color: 'white', fontWeight: 700, fontSize: '17px', margin: 0 }}>Clôturer la période</h2>
                    <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>Cette action est irréversible</p>
                  </div>
                </div>

                {activePeriod && (
                  <div style={{
                    backgroundColor: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)',
                    borderRadius: '12px', padding: '14px 16px', marginBottom: '20px'
                  }}>
                    <p style={{ color: '#94a3b8', fontSize: '13px', margin: '0 0 6px' }}>Période en cours</p>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '15px', margin: 0 }}>
                      {new Date(activePeriod.startDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' })}
                      {' → '}
                      {new Date(activePeriod.endDate + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                )}

                <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 24px' }}>
                  La clôture va <strong style={{ color: 'white' }}>générer un export CSV</strong> de la période. Vous devrez créer manuellement la prochaine période dans les paramètres.
                </p>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => setShowCloseModal(false)}
                    style={{
                      flex: 1, padding: '12px', borderRadius: '11px',
                      border: '1px solid #334155', backgroundColor: 'transparent',
                      color: '#94a3b8', fontWeight: 500, cursor: 'pointer'
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleClosePeriod}
                    disabled={closingPeriod}
                    style={{
                      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '12px', borderRadius: '11px', border: 'none',
                      background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white',
                      fontWeight: 600, cursor: closingPeriod ? 'not-allowed' : 'pointer',
                      opacity: closingPeriod ? 0.7 : 1
                    }}
                  >
                    {closingPeriod
                      ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Clôture...</>
                      : <><Lock size={16} /> Clôturer & Exporter</>}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )
      })()}

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
                            {formatPosition(item.position || item.role)}
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
                <div style={{ padding: '16px 24px 8px', display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => openRejectModal(selectedReport.id)}
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

              {/* Bouton Modifier & Renvoyer (employé sur rapport rejeté) */}
              {!isManager && selectedReport.status === 'rejected' && selectedReport.employeeId === user?.id && (
                <div style={{ padding: '0 24px 8px' }}>
                  {selectedReport.validationNote && (
                    <div style={{
                      display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '10px 14px',
                      backgroundColor: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
                      borderRadius: '10px', marginBottom: '10px'
                    }}>
                      <AlertCircle size={14} color="#f87171" style={{ flexShrink: 0, marginTop: 2 }} />
                      <span style={{ color: '#fca5a5', fontSize: '13px', lineHeight: 1.5 }}>
                        <strong>Raison du rejet :</strong> {selectedReport.validationNote}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={() => { setSelectedReport(null); navigate(`/cash-out?editReportId=${selectedReport.id}`) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '13px', borderRadius: '11px', border: 'none',
                      background: 'linear-gradient(135deg, #6366f1, #4f46e5)', color: 'white',
                      fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(99,102,241,0.3)'
                    }}
                  >
                    <RefreshCw size={16} /> Modifier & Renvoyer
                  </button>
                </div>
              )}

              {/* Bouton supprimer (manager) */}
              {isManager && (
                <div style={{ padding: selectedReport.status === 'pending' ? '0 16px 16px' : '16px 24px' }}>
                  <button
                    onClick={() => { setSelectedReport(null); setShowDeleteConfirm(selectedReport.id) }}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                      padding: '11px', borderRadius: '11px', border: '1px solid rgba(239,68,68,0.3)',
                      backgroundColor: 'rgba(239,68,68,0.07)', color: '#f87171',
                      fontWeight: 500, fontSize: '13px', cursor: 'pointer'
                    }}
                  >
                    <Trash2 size={15} /> Supprimer ce rapport
                  </button>
                </div>
              )}
            </div>
          </div>
        )
      })()}

      {/* ── Modal Gestion des Périodes ── */}
      {showManagePeriodsModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
        }} onClick={e => e.target === e.currentTarget && setShowManagePeriodsModal(false)}>
          <div style={{
            background: 'rgba(15,23,42,0.98)', border: '1px solid rgba(5,150,105,0.3)',
            borderRadius: '20px', maxWidth: '480px', width: '100%', maxHeight: '85vh',
            display: 'flex', flexDirection: 'column',
            backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.6)'
          }}>

            {/* Header modal */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(51,65,85,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {managePeriodView !== 'list' && (
                  <button
                    onClick={() => { setManagePeriodView('list'); setPeriodFormError('') }}
                    style={{ padding: '5px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}
                  >
                    ←
                  </button>
                )}
                <div>
                  <h2 style={{ color: 'white', fontWeight: 700, fontSize: '17px', margin: 0 }}>
                    {managePeriodView === 'create' ? 'Créer une période' : managePeriodView === 'edit' ? 'Modifier la période' : 'Périodes de paie'}
                  </h2>
                  {managePeriodView === 'list' && (
                    <p style={{ color: '#475569', fontSize: '12px', margin: '3px 0 0' }}>
                      {periods.filter(p => p.status === 'active').length} active
                      {periods.filter(p => p.status === 'pending').length > 0 && ` · ${periods.filter(p => p.status === 'pending').length} planifiée(s)`}
                      {periods.filter(p => p.status === 'closed').length > 0 && ` · ${periods.filter(p => p.status === 'closed').length} clôturée(s)`}
                    </p>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {managePeriodView === 'list' && (
                  <button
                    onClick={() => { setPeriodForm({ start_date: '', end_date: '' }); setPeriodFormError(''); setManagePeriodView('create') }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '7px 13px', borderRadius: '9px', border: 'none',
                      background: 'linear-gradient(135deg, #059669, #047857)',
                      color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                    }}
                  >
                    <Plus size={14} /> Créer
                  </button>
                )}
                <button onClick={() => setShowManagePeriodsModal(false)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Corps */}
            <div style={{ padding: '20px 24px', overflowY: 'auto', flex: 1 }}>

              {/* Vue liste */}
              {managePeriodView === 'list' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {periods.length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#475569', padding: '32px 0', fontSize: '14px' }}>
                      Aucune période. Créez votre première période.
                    </p>
                  ) : periods.map(p => {
                    const isActive  = p.status === 'active'
                    const isPending = p.status === 'pending'
                    const isClosed  = p.status === 'closed'
                    return (
                      <div key={p.id} style={{
                        display: 'flex', flexWrap: 'wrap', alignItems: 'center',
                        justifyContent: 'space-between', gap: '10px',
                        padding: '14px 16px', borderRadius: '12px',
                        backgroundColor: isActive  ? 'rgba(5,150,105,0.07)'
                                        : isPending ? 'rgba(59,130,246,0.05)'
                                        : 'rgba(30,41,59,0.5)',
                        border: `1px solid ${isActive  ? 'rgba(5,150,105,0.3)'
                                            : isPending ? 'rgba(59,130,246,0.25)'
                                            : '#334155'}`
                      }}>
                        <div>
                          <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: '0 0 4px' }}>
                            {formatPeriodLabel(p)}
                          </p>
                          <span style={{
                            padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                            backgroundColor: isActive  ? 'rgba(5,150,105,0.15)'
                                           : isPending ? 'rgba(59,130,246,0.15)'
                                           : 'rgba(71,85,105,0.3)',
                            color: isActive  ? '#34d399'
                                 : isPending ? '#60a5fa'
                                 : '#64748b'
                          }}>
                            {isActive ? '🟢 Active' : isPending ? '🕐 Planifiée' : '🔒 Clôturée'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                          {isActive && (
                            <>
                              <button
                                onClick={() => { setEditingPeriod(p); setPeriodForm({ start_date: p.startDate, end_date: p.endDate }); setPeriodFormError(''); setManagePeriodView('edit') }}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 11px', borderRadius: '8px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', fontSize: '12px', cursor: 'pointer' }}
                              >
                                <Pencil size={12} /> Modifier
                              </button>
                              <button
                                onClick={() => handleClosePeriodManage(p)}
                                disabled={closingPeriodId === p.id}
                                style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 11px', borderRadius: '8px', border: '1px solid rgba(239,68,68,0.3)', backgroundColor: 'rgba(239,68,68,0.08)', color: '#f87171', fontSize: '12px', cursor: 'pointer' }}
                              >
                                {closingPeriodId === p.id
                                  ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                  : <Lock size={12} />}
                                Clôturer
                              </button>
                            </>
                          )}
                          {isPending && (
                            <button
                              onClick={() => handleLaunchPeriod(p)}
                              disabled={launchingPeriodId === p.id}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 13px', borderRadius: '8px', border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', fontSize: '12px', fontWeight: 600, cursor: launchingPeriodId === p.id ? 'not-allowed' : 'pointer', opacity: launchingPeriodId === p.id ? 0.7 : 1 }}
                            >
                              {launchingPeriodId === p.id
                                ? <Loader size={12} style={{ animation: 'spin 1s linear infinite' }} />
                                : <Play size={12} />}
                              Lancer
                            </button>
                          )}
                          {isClosed && (
                            <button
                              onClick={() => payPeriodAPI.getSummary(currentRestaurant.id, p.id)
                                .then(res => { if (res.summary) exportPeriodSummaryCSV(res.summary, p) })
                                .catch(() => {})}
                              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 11px', borderRadius: '8px', border: '1px solid rgba(59,130,246,0.3)', backgroundColor: 'rgba(59,130,246,0.07)', color: '#60a5fa', fontSize: '12px', cursor: 'pointer' }}
                            >
                              <Download size={12} /> CSV
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Vue créer / modifier */}
              {(managePeriodView === 'create' || managePeriodView === 'edit') && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {periodFormError && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px' }}>
                      <AlertCircle size={14} />{periodFormError}
                    </div>
                  )}
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Date de début</label>
                    <input
                      type="date"
                      value={periodForm.start_date}
                      onChange={e => setPeriodForm(f => ({ ...f, start_date: e.target.value }))}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>Date de fin</label>
                    <input
                      type="date"
                      value={periodForm.end_date}
                      onChange={e => setPeriodForm(f => ({ ...f, end_date: e.target.value }))}
                      style={{ width: '100%', padding: '11px 14px', borderRadius: '10px', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                    />
                  </div>
                  <button
                    onClick={managePeriodView === 'create' ? handleCreatePeriod : handleEditPeriodSave}
                    disabled={savingPeriod}
                    style={{
                      padding: '13px', borderRadius: '11px', border: 'none',
                      background: managePeriodView === 'create'
                        ? 'linear-gradient(135deg, #059669, #047857)'
                        : 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      color: 'white', fontWeight: 600, fontSize: '14px',
                      cursor: savingPeriod ? 'not-allowed' : 'pointer', opacity: savingPeriod ? 0.7 : 1
                    }}
                  >
                    {savingPeriod
                      ? (managePeriodView === 'create' ? 'Création...' : 'Sauvegarde...')
                      : (managePeriodView === 'create' ? '+ Créer la période' : 'Sauvegarder les modifications')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Rejet avec raison ── */}
      {showRejectModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px'
        }} onClick={e => e.target === e.currentTarget && !actionLoading && setShowRejectModal(null)}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '20px', maxWidth: '420px', width: '100%',
            backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: '12px', flexShrink: 0 }}>
                <X size={20} color="#f87171" />
              </div>
              <div>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: 0 }}>Rejeter le rapport</h2>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>L'employé recevra un email avec la raison</p>
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px', fontWeight: 500 }}>
                Raison du rejet <span style={{ color: '#475569' }}>(optionnel mais recommandé)</span>
              </label>
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Ex: Montant des ventes incorrect, veuillez vérifier votre total..."
                rows={3}
                style={{
                  width: '100%', padding: '11px 14px', borderRadius: '10px',
                  backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155',
                  color: 'white', fontSize: '14px', outline: 'none', resize: 'vertical',
                  boxSizing: 'border-box', lineHeight: 1.5,
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => { setShowRejectModal(null); setRejectNote('') }}
                disabled={!!actionLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: '11px',
                  border: '1px solid #334155', backgroundColor: 'transparent',
                  color: '#94a3b8', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleReject(showRejectModal, rejectNote.trim())}
                disabled={!!actionLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '12px', borderRadius: '11px', border: 'none',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white',
                  fontWeight: 600, cursor: actionLoading ? 'not-allowed' : 'pointer',
                  opacity: actionLoading ? 0.7 : 1
                }}
              >
                {actionLoading
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Rejet...</>
                  : <><X size={16} /> Confirmer le rejet</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Confirmation Suppression ── */}
      {showDeleteConfirm && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: '16px'
        }} onClick={e => e.target === e.currentTarget && !deleteLoading && setShowDeleteConfirm(null)}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(239,68,68,0.35)',
            borderRadius: '20px', maxWidth: '380px', width: '100%',
            backdropFilter: 'blur(20px)', boxShadow: '0 25px 50px rgba(0,0,0,0.6)', padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ padding: '10px', backgroundColor: 'rgba(239,68,68,0.12)', borderRadius: '12px', flexShrink: 0 }}>
                <Trash2 size={20} color="#f87171" />
              </div>
              <div>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '16px', margin: 0 }}>Supprimer le rapport</h2>
                <p style={{ color: '#64748b', fontSize: '12px', margin: '4px 0 0' }}>Cette action est irréversible</p>
              </div>
            </div>
            <p style={{ color: '#94a3b8', fontSize: '14px', lineHeight: '1.6', margin: '0 0 20px' }}>
              Le rapport sera supprimé et tous les <strong style={{ color: 'white' }}>tip-outs associés seront annulés</strong>.
              Les bénéficiaires recevront une notification par email.
            </p>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowDeleteConfirm(null)}
                disabled={deleteLoading}
                style={{
                  flex: 1, padding: '12px', borderRadius: '11px',
                  border: '1px solid #334155', backgroundColor: 'transparent',
                  color: '#94a3b8', fontWeight: 500, cursor: 'pointer'
                }}
              >
                Annuler
              </button>
              <button
                onClick={() => handleDelete(showDeleteConfirm)}
                disabled={deleteLoading}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '12px', borderRadius: '11px', border: 'none',
                  background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white',
                  fontWeight: 600, cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  opacity: deleteLoading ? 0.7 : 1
                }}
              >
                {deleteLoading
                  ? <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Suppression...</>
                  : <><Trash2 size={16} /> Supprimer</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Changer de période ── */}
      {showMovePeriodModal && movingReport && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
        }} onClick={e => e.target === e.currentTarget && setShowMovePeriodModal(false)}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(139,92,246,0.3)',
            borderRadius: '20px', maxWidth: '400px', width: '100%',
            backdropFilter: 'blur(20px)', padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div>
                <h2 style={{ color: 'white', fontWeight: 700, fontSize: '17px', margin: '0 0 4px' }}>Changer de période</h2>
                <p style={{ color: '#64748b', fontSize: '12px', margin: 0 }}>{movingReport.employeeName}</p>
              </div>
              <button onClick={() => setShowMovePeriodModal(false)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>
                Déplacer vers la période :
              </label>
              <div style={{ position: 'relative' }}>
                <select
                  value={moveTargetPeriodId}
                  onChange={e => setMoveTargetPeriodId(e.target.value)}
                  style={{
                    width: '100%', padding: '10px 32px 10px 14px', borderRadius: '10px',
                    backgroundColor: '#1e293b', border: '1px solid #334155',
                    color: 'white', fontSize: '14px', appearance: 'none'
                  }}
                >
                  <option value="">— Sélectionner une période —</option>
                  {periods.map(p => (
                    <option key={p.id} value={p.id}>
                      {formatPeriodLabel(p)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: '#64748b', pointerEvents: 'none' }} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setShowMovePeriodModal(false)}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button
                onClick={handleMovePeriod}
                disabled={movingLoading || !moveTargetPeriodId}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '11px', borderRadius: '10px', border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
                  color: 'white', fontWeight: 600, cursor: (movingLoading || !moveTargetPeriodId) ? 'not-allowed' : 'pointer',
                  opacity: (movingLoading || !moveTargetPeriodId) ? 0.6 : 1
                }}
              >
                {movingLoading
                  ? <><Loader size={15} style={{ animation: 'spin 1s linear infinite' }} /> Déplacement...</>
                  : <><CalendarDays size={15} /> Confirmer</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
