import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI } from '../services/api'
import { Navigate } from 'react-router-dom'
import {
  Building2, Users, CreditCard, BarChart3, Activity,
  Search, CheckCircle, XCircle, Clock, TrendingUp,
  DollarSign, Loader, RefreshCw, Eye, Ban, Mail,
  CheckSquare, Shield, ChevronDown, AlertCircle, Star,
  Plus, Send, X
} from 'lucide-react'

const fmt = (isoDate) =>
  isoDate ? new Date(isoDate).toLocaleDateString('fr-CA') : '—'

const fmtMoney = (n) =>
  Number(n || 0).toLocaleString('fr-CA', { style: 'currency', currency: 'CAD' })

export default function Admin() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')

  // Data states
  const [stats, setStats]               = useState(null)
  const [restaurants, setRestaurants]   = useState([])
  const [users, setUsers]               = useState([])
  const [plans, setPlans]               = useState([])

  // UI states
  const [loading, setLoading]           = useState(true)
  const [usersLoaded, setUsersLoaded]   = useState(false)
  const [plansLoaded, setPlansLoaded]   = useState(false)
  const [actionLoading, setActionLoading] = useState(null)
  const [error, setError]               = useState('')
  const [searchTerm, setSearchTerm]     = useState('')
  const [userSearch, setUserSearch]     = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Invite modal state
  const [showInviteModal, setShowInviteModal]   = useState(false)
  const [inviteEmail, setInviteEmail]           = useState('')
  const [inviteRestName, setInviteRestName]     = useState('')
  const [inviteSending, setInviteSending]       = useState(false)
  const [inviteSuccess, setInviteSuccess]       = useState('')
  const [inviteError, setInviteError]           = useState('')

  // Guard: Super Admin only
  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  // Initial load: stats + restaurants
  useEffect(() => {
    loadData()
  }, [])

  // Lazy load users when tab switches
  useEffect(() => {
    if (activeTab === 'users' && !usersLoaded) loadUsers()
    if (activeTab === 'subscriptions' && !plansLoaded) loadPlans()
  }, [activeTab])

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [statsRes, restaurantsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRestaurants()
      ])
      setStats(statsRes.stats)
      setRestaurants(restaurantsRes.restaurants || [])
    } catch (err) {
      setError('Impossible de charger les données.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const loadUsers = async () => {
    try {
      const res = await adminAPI.getUsers()
      setUsers(res.users || [])
      setUsersLoaded(true)
    } catch (err) {
      console.error('Load users error:', err)
    }
  }

  const loadPlans = async () => {
    try {
      const res = await adminAPI.getPlans()
      setPlans(res.plans || [])
      setPlansLoaded(true)
    } catch (err) {
      console.error('Load plans error:', err)
    }
  }

  const handleSuspend = async (restaurantId) => {
    setActionLoading(restaurantId)
    try {
      await adminAPI.suspendRestaurant(restaurantId)
      setRestaurants(prev => prev.map(r =>
        r.id === restaurantId ? { ...r, status: 'suspended' } : r
      ))
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleActivate = async (restaurantId) => {
    setActionLoading(restaurantId)
    try {
      await adminAPI.activateRestaurant(restaurantId)
      setRestaurants(prev => prev.map(r =>
        r.id === restaurantId ? { ...r, status: 'active' } : r
      ))
    } catch (err) {
      setError(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  const handleInviteRestaurant = async (e) => {
    e.preventDefault()
    setInviteError('')
    setInviteSuccess('')
    setInviteSending(true)
    try {
      await adminAPI.inviteRestaurant(inviteEmail, inviteRestName)
      setInviteSuccess(`Invitation envoyée à ${inviteEmail} !`)
      setInviteEmail('')
      setInviteRestName('')
      setTimeout(() => {
        setShowInviteModal(false)
        setInviteSuccess('')
      }, 2500)
    } catch (err) {
      setInviteError(err.message || 'Erreur lors de l\'envoi')
    } finally {
      setInviteSending(false)
    }
  }

  const filteredRestaurants = restaurants.filter(r => {
    const q = searchTerm.toLowerCase()
    const matchSearch = (r.name || '').toLowerCase().includes(q) ||
                        (r.owner || '').toLowerCase().includes(q) ||
                        (r.email || '').toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || r.status === filterStatus
    return matchSearch && matchStatus
  })

  const filteredUsers = users.filter(u => {
    const q = userSearch.toLowerCase()
    return (u.email || '').toLowerCase().includes(q) ||
           (u.firstName || '').toLowerCase().includes(q) ||
           (u.lastName || '').toLowerCase().includes(q)
  })

  const planColor = { starter: 'slate', pro: 'blue', enterprise: 'purple' }
  const statusColor = {
    active: { bg: 'bg-green-500/15', text: 'text-green-400', icon: <CheckCircle size={12} /> },
    trial:  { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: <Clock size={12} /> },
    suspended: { bg: 'bg-red-500/15', text: 'text-red-400', icon: <XCircle size={12} /> },
    cancelled: { bg: 'bg-slate-500/15', text: 'text-slate-400', icon: <XCircle size={12} /> }
  }

  const StatusBadge = ({ status }) => {
    const s = statusColor[status] || statusColor.trial
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${s.bg} ${s.text}`}>
        {s.icon} {status}
      </span>
    )
  }

  const PlanBadge = ({ plan }) => {
    const c = planColor[plan] || 'slate'
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${c}-500/15 text-${c}-400 capitalize`}>
        {plan || 'starter'}
      </span>
    )
  }

  const tabs = [
    { id: 'overview',       label: 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'restaurants',    label: 'Restaurants',     icon: Building2 },
    { id: 'subscriptions',  label: 'Abonnements',     icon: CreditCard },
    { id: 'users',          label: 'Utilisateurs',    icon: Users }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Shield size={20} className="text-purple-400" />
            <h1 className="text-2xl font-bold text-white">Super Admin</h1>
          </div>
          <p className="text-slate-400 text-sm">Panneau de contrôle global — {restaurants.length} restaurant(s)</p>
        </div>
        <button onClick={loadData} className="btn bg-slate-700 hover:bg-slate-600 text-white self-start sm:self-auto">
          <RefreshCw size={18} />
          Actualiser
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: '8px',
        paddingTop: '4px',
        marginBottom: '8px',
        scrollbarWidth: 'none'
      }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '14px',
              fontSize: '14px',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              cursor: 'pointer',
              border: 'none',
              transition: 'all 0.2s',
              flexShrink: 0,
              background: activeTab === tab.id
                ? 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)'
                : 'rgba(30,41,59,0.8)',
              color: activeTab === tab.id ? 'white' : '#94a3b8',
              boxShadow: activeTab === tab.id
                ? '0 4px 16px rgba(99,102,241,0.35)'
                : 'none',
              border: activeTab === tab.id
                ? '1px solid transparent'
                : '1px solid rgba(51,65,85,0.6)'
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ══════════════ OVERVIEW ══════════════ */}
      {activeTab === 'overview' && stats && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { label: 'Restaurants', value: stats.totalRestaurants, icon: Building2, color: 'blue' },
              { label: 'Abonnés actifs', value: stats.activeSubscriptions, icon: CheckCircle, color: 'green' },
              { label: 'En essai', value: stats.trialUsers, icon: Clock, color: 'amber' },
              { label: 'Revenus mensuels', value: fmtMoney(stats.monthlyRevenue), icon: DollarSign, color: 'purple' },
              { label: 'Utilisateurs', value: stats.totalUsers, icon: Users, color: 'cyan' },
              { label: 'Rapports ce mois', value: stats.reportsThisMonth, icon: TrendingUp, color: 'pink' }
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card">
                <div className="flex items-center gap-4">
                  <div className={`p-3.5 bg-${color}-500/20 rounded-xl shrink-0`}>
                    <Icon className={`text-${color}-400`} size={22} />
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm mb-1">{label}</p>
                    <p className="text-2xl font-bold text-white">{value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Restaurants */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <Activity size={18} className="text-blue-400" />
              Derniers restaurants enregistrés
            </h3>
            {restaurants.length === 0 ? (
              <p className="text-slate-500 text-sm">Aucun restaurant.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {restaurants.slice(0, 6).map(r => (
                  <div key={r.id} className="flex items-center justify-between py-3 border-b border-slate-700/40 last:border-0">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-slate-700 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 size={16} className="text-slate-400" />
                      </div>
                      <div>
                        <p className="text-white font-medium text-sm">{r.name}</p>
                        <p className="text-slate-500 text-xs">{r.owner} · {r.employees} employé(s)</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={r.status} />
                      <span className="text-slate-600 text-xs hidden sm:block">{fmt(r.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════ INVITE MODAL ══════════════ */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-7 py-5 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Send size={18} className="text-amber-400" />
                <h2 className="text-white font-semibold">Inviter un restaurant</h2>
              </div>
              <button onClick={() => { setShowInviteModal(false); setInviteError(''); setInviteSuccess('') }}
                className="p-2 hover:bg-slate-700 rounded-xl transition-colors">
                <X size={18} className="text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleInviteRestaurant} className="px-7 py-6" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <p className="text-slate-400 text-sm leading-relaxed">
                L'invité recevra un email avec un lien pour créer son compte Manager et configurer son restaurant.
              </p>

              {inviteError && (
                <div className="flex items-center gap-2 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
                  <AlertCircle size={14} /> {inviteError}
                </div>
              )}
              {inviteSuccess && (
                <div className="flex items-center gap-2 p-3.5 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm">
                  <CheckCircle size={14} /> {inviteSuccess}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2.5">
                  Email du gestionnaire
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="manager@restaurant.com"
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2.5">
                  Nom du restaurant
                </label>
                <input
                  type="text"
                  value={inviteRestName}
                  onChange={(e) => setInviteRestName(e.target.value)}
                  placeholder="Ex: Jimmies Pizza"
                  required
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-600 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none text-sm"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowInviteModal(false)}
                  className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors text-sm"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={inviteSending}
                  className="flex-1 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                >
                  {inviteSending
                    ? <><Loader size={15} className="animate-spin" /> Envoi...</>
                    : <><Send size={15} /> Envoyer l'invitation</>
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════ RESTAURANTS ══════════════ */}
      {activeTab === 'restaurants' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowInviteModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition-colors text-sm shrink-0"
            >
              <Plus size={16} /> Inviter un restaurant
            </button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher (nom, propriétaire, email)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="trial">Essai</option>
                <option value="suspended">Suspendu</option>
                <option value="cancelled">Annulé</option>
              </select>
              <ChevronDown size={14} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>

          <p className="text-slate-500 text-xs">{filteredRestaurants.length} résultat(s)</p>

          {/* Table */}
          <div className="card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700 bg-slate-800/60">
                    <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider">Restaurant</th>
                    <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider">Plan</th>
                    <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider">Statut</th>
                    <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Employés</th>
                    <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Rapports/mois</th>
                    <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Créé le</th>
                    <th className="text-right py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Building2 size={32} className="mx-auto mb-2 opacity-30" />
                        Aucun restaurant trouvé
                      </td>
                    </tr>
                  ) : filteredRestaurants.map(r => {
                    const acting = actionLoading === r.id
                    return (
                      <tr key={r.id} className="border-b border-slate-700/40 hover:bg-slate-800/40 transition-colors">
                        <td className="py-4 px-5">
                          <p className="text-white font-medium text-sm">{r.name}</p>
                          <p className="text-slate-500 text-xs mt-0.5">{r.email}</p>
                          <p className="text-slate-600 text-xs">{r.owner}</p>
                        </td>
                        <td className="py-4 px-5"><PlanBadge plan={r.plan} /></td>
                        <td className="py-4 px-5"><StatusBadge status={r.status} /></td>
                        <td className="py-4 px-5 text-slate-300 text-sm hidden md:table-cell">{r.employees}</td>
                        <td className="py-4 px-5 text-slate-300 text-sm hidden md:table-cell">{r.monthlyReports}</td>
                        <td className="py-4 px-5 text-slate-500 text-xs hidden lg:table-cell">{fmt(r.createdAt)}</td>
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-end gap-1">
                            <a href={`mailto:${r.email}`} className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors" title="Email">
                              <Mail size={15} className="text-slate-400" />
                            </a>
                            {r.status === 'suspended' ? (
                              <button
                                onClick={() => handleActivate(r.id)}
                                disabled={acting}
                                className="p-1.5 hover:bg-green-500/20 rounded-lg transition-colors"
                                title="Réactiver"
                              >
                                {acting ? <Loader size={15} className="animate-spin text-green-400" /> : <CheckSquare size={15} className="text-green-400" />}
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSuspend(r.id)}
                                disabled={acting}
                                className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors"
                                title="Suspendre"
                              >
                                {acting ? <Loader size={15} className="animate-spin text-red-400" /> : <Ban size={15} className="text-red-400" />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ SUBSCRIPTIONS ══════════════ */}
      {activeTab === 'subscriptions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Revenue Summary */}
          <div className="card" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(34,211,238,0.1))', borderColor: 'rgba(99,102,241,0.3)' }}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-slate-400 text-sm">Revenus mensuels récurrents (MRR)</p>
                <p className="text-4xl font-bold text-white mt-1">{stats ? fmtMoney(stats.monthlyRevenue) : '...'}</p>
              </div>
              <div className="flex gap-6">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-400">{stats?.activeSubscriptions || 0}</p>
                  <p className="text-xs text-slate-400">Actifs</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-400">{stats?.trialUsers || 0}</p>
                  <p className="text-xs text-slate-400">Essai</p>
                </div>
              </div>
            </div>
          </div>

          {/* Plans */}
          {!plansLoaded ? (
            <div className="flex justify-center py-8"><Loader className="animate-spin text-blue-500" size={28} /></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {plans.map((plan, i) => {
                const colors = ['slate', 'blue', 'purple']
                const c = colors[i] || 'slate'
                const isPopular = plan.name === 'pro'
                return (
                  <div key={plan.id} className={`card relative ${isPopular ? 'border-blue-500/50' : ''}`}>
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="flex items-center gap-1 px-3 py-0.5 bg-blue-500 text-white text-xs rounded-full font-semibold">
                          <Star size={10} fill="white" /> Populaire
                        </span>
                      </div>
                    )}
                    <h4 className={`text-lg font-bold text-${c}-300 mb-2`}>{plan.displayName}</h4>
                    <div className="flex items-baseline gap-1 mb-1">
                      <span className="text-3xl font-bold text-white">{fmtMoney(plan.price)}</span>
                      <span className="text-slate-400 text-sm">/mois</span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">
                      {plan.maxEmployees === -1 ? 'Employés illimités' : `Jusqu'à ${plan.maxEmployees} employés`}
                    </p>
                    {plan.features && Array.isArray(plan.features) && plan.features.length > 0 && (
                      <div className="border-t border-slate-700 pt-3" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {plan.features.map(f => (
                          <div key={f} className="flex items-center gap-2 text-xs text-slate-400">
                            <CheckCircle size={12} className="text-green-400 shrink-0" />
                            {f.replace(/_/g, ' ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {/* Restaurants par statut */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-6">Répartition des restaurants</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {['active', 'trial', 'suspended', 'cancelled'].map(status => {
                const count = restaurants.filter(r => r.status === status).length
                const pct = restaurants.length ? Math.round((count / restaurants.length) * 100) : 0
                const s = statusColor[status]
                return (
                  <div key={status} className="flex items-center gap-3">
                    <div className="w-20 text-xs capitalize text-slate-400">{status}</div>
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${s.bg.replace('/15', '')}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="w-8 text-right text-sm font-medium text-white">{count}</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ USERS ══════════════ */}
      {activeTab === 'users' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              placeholder="Rechercher un utilisateur..."
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          {!usersLoaded ? (
            <div className="flex justify-center py-12"><Loader className="animate-spin text-blue-500" size={28} /></div>
          ) : (
            <>
              <p className="text-slate-500 text-xs">{filteredUsers.length} utilisateur(s)</p>
              <div className="card overflow-hidden p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-700 bg-slate-800/60">
                        <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider">Utilisateur</th>
                        <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider">Rôle</th>
                        <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider hidden md:table-cell">Restaurants</th>
                        <th className="text-left py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider hidden lg:table-cell">Inscrit le</th>
                        <th className="text-right py-4 px-5 text-slate-400 font-medium text-xs uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-500">
                            <Users size={32} className="mx-auto mb-2 opacity-30" />
                            Aucun utilisateur trouvé
                          </td>
                        </tr>
                      ) : filteredUsers.map(u => {
                        const roleColors = {
                          superadmin: 'text-purple-400 bg-purple-500/15',
                          manager: 'text-blue-400 bg-blue-500/15',
                          server: 'text-slate-400 bg-slate-500/15'
                        }
                        const rc = roleColors[u.role] || roleColors.server
                        return (
                          <tr key={u.id} className="border-b border-slate-700/40 hover:bg-slate-800/40 transition-colors">
                            <td className="py-4 px-5">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 bg-slate-700 rounded-full flex items-center justify-center shrink-0 text-xs font-bold text-white">
                                  {(u.firstName?.[0] || u.email?.[0] || '?').toUpperCase()}
                                </div>
                                <div>
                                  <p className="text-white font-medium text-sm">
                                    {u.firstName && u.lastName ? `${u.firstName} ${u.lastName}` : u.email}
                                  </p>
                                  <p className="text-slate-500 text-xs mt-0.5">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-5">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${rc}`}>
                                {u.role}
                              </span>
                            </td>
                            <td className="py-4 px-5 hidden md:table-cell">
                              {u.restaurants?.length === 0 ? (
                                <span className="text-slate-600 text-xs">Aucun</span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {u.restaurants?.slice(0, 2).map(r => (
                                    <span key={r.id} className="px-2 py-0.5 bg-slate-700 text-slate-300 text-xs rounded">
                                      {r.name}
                                    </span>
                                  ))}
                                  {u.restaurants?.length > 2 && (
                                    <span className="text-slate-500 text-xs">+{u.restaurants.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </td>
                            <td className="py-4 px-5 text-slate-500 text-xs hidden lg:table-cell">{fmt(u.createdAt)}</td>
                            <td className="py-4 px-5 text-right">
                              <a
                                href={`mailto:${u.email}`}
                                className="p-1.5 hover:bg-slate-700 rounded-lg transition-colors inline-flex"
                                title="Envoyer un email"
                              >
                                <Mail size={15} className="text-slate-400" />
                              </a>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
