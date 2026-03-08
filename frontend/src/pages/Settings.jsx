import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../contexts/LanguageContext'
import { useAuth } from '../contexts/AuthContext'
import { restaurantAPI, payPeriodAPI } from '../services/api'
import {
  Settings as SettingsIcon,
  Globe,
  Bell,
  Building2,
  Save,
  Check,
  CalendarDays,
  Plus,
  Lock,
  Pencil,
  Download,
  Loader,
  AlertCircle,
  X
} from 'lucide-react'

export default function Settings() {
  const { t } = useTranslation()
  const { language, changeLanguage } = useLanguage()
  const { currentRestaurant, isManager } = useAuth()

  const [notifications, setNotifications] = useState({
    reportSubmitted: true,
    reportValidated: true,
    teamInvite: true
  })

  // ── Pay Period management (manager) ──────────────────────
  const [periods, setPeriods]           = useState([])
  const [periodsLoading, setPeriodsLoading] = useState(false)
  const [periodError, setPeriodError]   = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal]     = useState(false)
  const [editingPeriod, setEditingPeriod]     = useState(null)
  const [periodForm, setPeriodForm]     = useState({ start_date: '', end_date: '' })
  const [savingPeriod, setSavingPeriod] = useState(false)
  const [closingPeriodId, setClosingPeriodId] = useState(null)

  useEffect(() => {
    if (isManager && currentRestaurant?.id) {
      setPeriodsLoading(true)
      payPeriodAPI.getAll(currentRestaurant.id)
        .then(res => setPeriods(res.periods || []))
        .catch(() => {})
        .finally(() => setPeriodsLoading(false))
    }
  }, [currentRestaurant?.id, isManager])

  const refreshPeriods = () => {
    if (!currentRestaurant?.id) return
    payPeriodAPI.getAll(currentRestaurant.id)
      .then(res => setPeriods(res.periods || []))
      .catch(() => {})
  }

  const handleCreatePeriod = async () => {
    setPeriodError('')
    if (!periodForm.start_date || !periodForm.end_date) {
      return setPeriodError('Les deux dates sont requises.')
    }
    if (periodForm.start_date >= periodForm.end_date) {
      return setPeriodError('La date de fin doit être après la date de début.')
    }
    setSavingPeriod(true)
    try {
      await payPeriodAPI.create(currentRestaurant.id, periodForm)
      setShowCreateModal(false)
      setPeriodForm({ start_date: '', end_date: '' })
      refreshPeriods()
    } catch (e) {
      setPeriodError(e.message || 'Erreur lors de la création.')
    } finally {
      setSavingPeriod(false)
    }
  }

  const handleEditPeriod = async () => {
    if (!editingPeriod) return
    setPeriodError('')
    if (!periodForm.start_date || !periodForm.end_date) {
      return setPeriodError('Les deux dates sont requises.')
    }
    if (periodForm.start_date >= periodForm.end_date) {
      return setPeriodError('La date de fin doit être après la date de début.')
    }
    setSavingPeriod(true)
    try {
      await payPeriodAPI.update(currentRestaurant.id, editingPeriod.id, periodForm)
      setShowEditModal(false)
      setEditingPeriod(null)
      setPeriodForm({ start_date: '', end_date: '' })
      refreshPeriods()
    } catch (e) {
      setPeriodError(e.message || 'Erreur lors de la modification.')
    } finally {
      setSavingPeriod(false)
    }
  }

  const handleClosePeriod = async (period) => {
    if (!window.confirm(`Clôturer la période du ${formatPeriodLabel(period)} ?`)) return
    setClosingPeriodId(period.id)
    try {
      const res = await payPeriodAPI.close(currentRestaurant.id, period.id)
      if (res.summary) exportPeriodCSV(res.summary, period)
      refreshPeriods()
    } catch (e) {
      setPeriodError(e.message || 'Erreur lors de la clôture.')
    } finally {
      setClosingPeriodId(null)
    }
  }

  const exportPeriodCSV = (summary, period) => {
    const headers = ['Employé', 'Ventes Totales', 'Tip-Out Distribué', 'Tips Reçus', 'Nb Rapports']
    const rows = (summary.employees || []).map(e => [
      e.employeeName,
      (e.totalSales   || 0).toFixed(2),
      (e.tipOutGiven  || 0).toFixed(2),
      (e.tipsReceived || 0).toFixed(2),
      e.reportCount || 0
    ])
    const csv = [headers, ...rows].map(r => r.map(v => `"${v}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `periode_${period.startDate}_${period.endDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatPeriodLabel = (p) => {
    const fmt = (d) => new Date(d + 'T12:00:00').toLocaleDateString('fr-CA', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${fmt(p.startDate)} → ${fmt(p.endDate)}`
  }

  const openEditModal = (p) => {
    setEditingPeriod(p)
    setPeriodForm({ start_date: p.startDate, end_date: p.endDate })
    setPeriodError('')
    setShowEditModal(true)
  }

  const openCreateModal = () => {
    setPeriodForm({ start_date: '', end_date: '' })
    setPeriodError('')
    setShowCreateModal(true)
  }

  const handleSave = () => {
    console.log('Saving settings:', { notifications })
  }

  const notificationLabels = {
    reportSubmitted: { label: 'Rapport soumis', desc: 'Quand un employé soumet un rapport de caisse' },
    reportValidated: { label: 'Rapport validé', desc: 'Quand votre rapport est approuvé ou rejeté' },
    teamInvite:      { label: 'Invitation équipe', desc: 'Quand vous recevez une invitation à rejoindre un restaurant' }
  }

  return (
    <div className="animate-fade-in max-w-2xl mx-auto" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <div className="p-3.5 bg-slate-700/70 rounded-2xl border border-slate-600/40">
          <SettingsIcon size={24} className="text-blue-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">{t('settings.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">Gérez vos préférences et paramètres</p>
        </div>
      </div>

      {/* ── Language ── */}
      <div className="card">
        {/* Section header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-blue-500/10 rounded-xl">
            <Globe size={20} className="text-blue-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{t('settings.language')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Choisissez votre langue préférée</p>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-700/60 mb-6" />

        {/* Buttons */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { code: 'fr', flag: '🇫🇷', label: t('settings.french') },
            { code: 'en', flag: '🇬🇧', label: t('settings.english') }
          ].map(({ code, flag, label }) => {
            const active = language === code
            return (
              <button
                key={code}
                onClick={() => changeLanguage(code)}
                className={`relative flex flex-col items-center py-7 px-4 rounded-xl border-2 transition-all ${
                  active
                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                    : 'bg-slate-700/40 border-slate-600/60 text-slate-300 hover:border-slate-500 hover:bg-slate-700/60'
                }`}
              >
                {active && (
                  <span className="absolute top-3 right-3 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                    <Check size={11} className="text-white" />
                  </span>
                )}
                <span className="text-4xl mb-4 block">{flag}</span>
                <span className="font-semibold text-sm">{label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="card">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-amber-500/10 rounded-xl">
            <Bell size={20} className="text-amber-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-white">{t('settings.notifications')}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Recevez des alertes en temps réel</p>
          </div>
        </div>

        <div className="border-t border-slate-700/60 mb-6" />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(notifications).map(([key, value]) => {
            const { label, desc } = notificationLabels[key] || { label: key, desc: '' }
            return (
              <label
                key={key}
                className="flex items-center justify-between gap-4 p-5 bg-slate-700/30 rounded-xl cursor-pointer hover:bg-slate-700/50 transition-colors border border-slate-600/30"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium text-sm">{label}</p>
                  <p className="text-slate-500 text-xs mt-1 leading-relaxed">{desc}</p>
                </div>

                <div className="relative flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => setNotifications({ ...notifications, [key]: e.target.checked })}
                    className="sr-only"
                  />
                  {/* Toggle track */}
                  <div className={`w-12 h-6.5 rounded-full transition-colors duration-200 ${
                    value ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                    style={{ width: '48px', height: '26px' }}
                  >
                    {/* Toggle thumb */}
                    <div
                      className="w-5 h-5 rounded-full bg-white shadow-md transform transition-transform duration-200"
                      style={{
                        marginTop: '3px',
                        marginLeft: value ? '25px' : '3px',
                        transition: 'margin-left 0.2s ease'
                      }}
                    />
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      </div>

      {/* ── Restaurant Info (Manager only) ── */}
      {isManager && currentRestaurant && (
        <div className="card">
          <div className="flex items-center gap-3 mb-5">
            <div className="p-2.5 bg-purple-500/10 rounded-xl">
              <Building2 size={20} className="text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">{t('settings.restaurant')}</h2>
              <p className="text-xs text-slate-400 mt-0.5">Informations de votre établissement</p>
            </div>
          </div>

          <div className="border-t border-slate-700/60 mb-6" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t('settings.restaurantName')}
              </label>
              <input
                type="text"
                defaultValue={currentRestaurant.name}
                className="w-full px-4 py-3 rounded-xl text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-3">
                {t('settings.address')}
              </label>
              <input
                type="text"
                placeholder="123 Rue Exemple, Montréal"
                className="w-full px-4 py-3 rounded-xl text-white"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('settings.timezone')}
                </label>
                <select className="w-full px-4 py-3 rounded-xl text-white">
                  <option>America/Montreal</option>
                  <option>America/Toronto</option>
                  <option>America/Vancouver</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-3">
                  {t('settings.currency')}
                </label>
                <select className="w-full px-4 py-3 rounded-xl text-white">
                  <option>CAD ($)</option>
                  <option>USD ($)</option>
                  <option>EUR (€)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Gestion des Périodes de Paie (Manager only) ── */}
      {isManager && currentRestaurant && (
        <div className="card">
          {/* Header */}
          <div className="flex items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <CalendarDays size={20} className="text-emerald-400" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-white">Périodes de paie</h2>
                <p className="text-xs text-slate-400 mt-0.5">Créez et gérez les périodes manuellement</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 14px', borderRadius: '10px', border: 'none',
                background: 'linear-gradient(135deg, #059669, #047857)',
                color: 'white', fontSize: '13px', fontWeight: 600, cursor: 'pointer'
              }}
            >
              <Plus size={15} /> Créer une période
            </button>
          </div>

          <div className="border-t border-slate-700/60 mb-6" />

          {/* Erreur */}
          {periodError && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px',
              backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '10px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px'
            }}>
              <AlertCircle size={15} />{periodError}
            </div>
          )}

          {/* Liste des périodes */}
          {periodsLoading ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#475569' }}>
              <Loader size={20} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
            </div>
          ) : periods.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#475569', fontSize: '14px', padding: '24px 0' }}>
              Aucune période créée. Commencez par créer votre première période.
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {periods.map(p => (
                <div key={p.id} style={{
                  display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
                  gap: '10px', padding: '14px 16px',
                  backgroundColor: p.status === 'active' ? 'rgba(5,150,105,0.07)' : 'rgba(30,41,59,0.5)',
                  border: `1px solid ${p.status === 'active' ? 'rgba(5,150,105,0.3)' : '#334155'}`,
                  borderRadius: '12px'
                }}>
                  <div>
                    <p style={{ color: 'white', fontWeight: 600, fontSize: '14px', margin: '0 0 3px' }}>
                      {formatPeriodLabel(p)}
                    </p>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', gap: '4px',
                      padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 500,
                      backgroundColor: p.status === 'active' ? 'rgba(5,150,105,0.15)' : 'rgba(71,85,105,0.3)',
                      color: p.status === 'active' ? '#34d399' : '#64748b'
                    }}>
                      {p.status === 'active' ? '🟢 Active' : '🔒 Clôturée'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    {p.status === 'active' ? (
                      <>
                        <button
                          onClick={() => openEditModal(p)}
                          title="Modifier"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '7px 12px', borderRadius: '8px',
                            border: '1px solid #334155', backgroundColor: 'transparent',
                            color: '#94a3b8', fontSize: '12px', cursor: 'pointer'
                          }}
                        >
                          <Pencil size={13} /> Modifier
                        </button>
                        <button
                          onClick={() => handleClosePeriod(p)}
                          disabled={closingPeriodId === p.id}
                          title="Clôturer"
                          style={{
                            display: 'flex', alignItems: 'center', gap: '5px',
                            padding: '7px 12px', borderRadius: '8px',
                            border: '1px solid rgba(239,68,68,0.3)',
                            backgroundColor: 'rgba(239,68,68,0.08)',
                            color: '#f87171', fontSize: '12px', cursor: 'pointer'
                          }}
                        >
                          {closingPeriodId === p.id
                            ? <Loader size={13} style={{ animation: 'spin 1s linear infinite' }} />
                            : <Lock size={13} />
                          }
                          Clôturer
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => payPeriodAPI.getSummary(currentRestaurant.id, p.id)
                          .then(res => { if (res.summary) exportPeriodCSV(res.summary, p) })
                          .catch(() => {})
                        }
                        title="Télécharger résumé CSV"
                        style={{
                          display: 'flex', alignItems: 'center', gap: '5px',
                          padding: '7px 12px', borderRadius: '8px',
                          border: '1px solid rgba(59,130,246,0.3)',
                          backgroundColor: 'rgba(59,130,246,0.07)',
                          color: '#60a5fa', fontSize: '12px', cursor: 'pointer'
                        }}
                      >
                        <Download size={13} /> Résumé CSV
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Modal Créer une période ── */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
        }} onClick={e => e.target === e.currentTarget && setShowCreateModal(false)}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(5,150,105,0.3)',
            borderRadius: '20px', maxWidth: '400px', width: '100%',
            backdropFilter: 'blur(20px)', padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '17px', margin: 0 }}>Créer une période</h2>
              <button onClick={() => setShowCreateModal(false)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            {periodError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={15} />{periodError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Date de début</label>
                <input
                  type="date"
                  value={periodForm.start_date}
                  onChange={e => setPeriodForm(f => ({ ...f, start_date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Date de fin</label>
                <input
                  type="date"
                  value={periodForm.end_date}
                  onChange={e => setPeriodForm(f => ({ ...f, end_date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowCreateModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={handleCreatePeriod}
                disabled={savingPeriod}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #059669, #047857)', color: 'white', fontWeight: 600, cursor: savingPeriod ? 'not-allowed' : 'pointer', opacity: savingPeriod ? 0.7 : 1 }}
              >
                {savingPeriod ? 'Création...' : 'Créer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Modifier une période ── */}
      {showEditModal && editingPeriod && (
        <div style={{
          position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px'
        }} onClick={e => e.target === e.currentTarget && setShowEditModal(false)}>
          <div style={{
            background: 'rgba(15,23,42,0.97)', border: '1px solid rgba(59,130,246,0.3)',
            borderRadius: '20px', maxWidth: '400px', width: '100%',
            backdropFilter: 'blur(20px)', padding: '24px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ color: 'white', fontWeight: 700, fontSize: '17px', margin: 0 }}>Modifier la période</h2>
              <button onClick={() => setShowEditModal(false)} style={{ padding: '6px', border: 'none', background: 'transparent', color: '#64748b', cursor: 'pointer' }}>
                <X size={20} />
              </button>
            </div>
            {periodError && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 14px', backgroundColor: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: '10px', color: '#fca5a5', fontSize: '13px', marginBottom: '16px' }}>
                <AlertCircle size={15} />{periodError}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Date de début</label>
                <input
                  type="date"
                  value={periodForm.start_date}
                  onChange={e => setPeriodForm(f => ({ ...f, start_date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>Date de fin</label>
                <input
                  type="date"
                  value={periodForm.end_date}
                  onChange={e => setPeriodForm(f => ({ ...f, end_date: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(30,41,59,0.8)', border: '1px solid #334155', color: 'white', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setShowEditModal(false)} style={{ flex: 1, padding: '11px', borderRadius: '10px', border: '1px solid #334155', backgroundColor: 'transparent', color: '#94a3b8', cursor: 'pointer' }}>
                Annuler
              </button>
              <button
                onClick={handleEditPeriod}
                disabled={savingPeriod}
                style={{ flex: 1, padding: '11px', borderRadius: '10px', border: 'none', background: 'linear-gradient(135deg, #3b82f6, #2563eb)', color: 'white', fontWeight: 600, cursor: savingPeriod ? 'not-allowed' : 'pointer', opacity: savingPeriod ? 0.7 : 1 }}
              >
                {savingPeriod ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Save Button ── */}
      <div className="pt-2">
        <button
          onClick={handleSave}
          className="btn btn-primary w-full py-4 text-base"
        >
          <Save size={20} />
          {t('common.save')}
        </button>
      </div>

    </div>
  )
}
