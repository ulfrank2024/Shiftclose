import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { adminAPI } from '../services/api'
import { Navigate } from 'react-router-dom'
import {
  Building2, Users, CreditCard, BarChart3, Activity,
  Search, Filter, MoreVertical, CheckCircle, XCircle,
  Clock, TrendingUp, DollarSign, Loader2, RefreshCw,
  Eye, Ban, Mail, Calendar, CheckSquare
} from 'lucide-react'

export default function Admin() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('overview')
  const [restaurants, setRestaurants] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // Check if user is superadmin
  if (user?.role !== 'superadmin') {
    return <Navigate to="/dashboard" replace />
  }

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [statsRes, restaurantsRes] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getRestaurants()
      ])
      setStats(statsRes.stats)
      setRestaurants(restaurantsRes.restaurants)
    } catch (error) {
      console.error('Error loading admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSuspend = async (restaurantId) => {
    try {
      await adminAPI.suspendRestaurant(restaurantId)
      loadData()
    } catch (error) {
      console.error('Suspend error:', error)
    }
  }

  const handleActivate = async (restaurantId) => {
    try {
      await adminAPI.activateRestaurant(restaurantId)
      loadData()
    } catch (error) {
      console.error('Activate error:', error)
    }
  }

  const filteredRestaurants = restaurants.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.owner.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus
    return matchesSearch && matchesFilter
  })

  const getPlanBadge = (plan) => {
    const styles = {
      starter: 'bg-slate-500/20 text-slate-400',
      pro: 'bg-blue-500/20 text-blue-400',
      enterprise: 'bg-purple-500/20 text-purple-400'
    }
    return styles[plan] || styles.starter
  }

  const getStatusBadge = (status) => {
    const styles = {
      active: 'bg-green-500/20 text-green-400',
      trial: 'bg-amber-500/20 text-amber-400',
      suspended: 'bg-red-500/20 text-red-400',
      cancelled: 'bg-slate-500/20 text-slate-400'
    }
    return styles[status] || styles.active
  }

  const tabs = [
    { id: 'overview', label: t('admin.overview') || 'Vue d\'ensemble', icon: BarChart3 },
    { id: 'restaurants', label: t('admin.allRestaurants'), icon: Building2 },
    { id: 'subscriptions', label: t('admin.subscriptions'), icon: CreditCard },
    { id: 'users', label: t('admin.users'), icon: Users }
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t('admin.title')}</h1>
          <p className="text-slate-400 text-sm mt-1">
            Panneau de contrôle Super Admin
          </p>
        </div>
        <button
          onClick={loadData}
          className="btn bg-slate-700 hover:bg-slate-600 text-white self-start sm:self-auto"
        >
          <RefreshCw size={18} />
          Actualiser
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-500 text-white'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-500/20 rounded-xl">
                  <Building2 className="text-blue-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Restaurants</p>
                  <p className="text-2xl font-bold text-white">{stats.totalRestaurants}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/20 rounded-xl">
                  <CheckCircle className="text-green-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Abonnés actifs</p>
                  <p className="text-2xl font-bold text-white">{stats.activeSubscriptions}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 rounded-xl">
                  <Clock className="text-amber-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">En essai</p>
                  <p className="text-2xl font-bold text-white">{stats.trialUsers}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-500/20 rounded-xl">
                  <DollarSign className="text-purple-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Revenus mensuels</p>
                  <p className="text-2xl font-bold text-white">${stats.monthlyRevenue}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-cyan-500/20 rounded-xl">
                  <Users className="text-cyan-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Utilisateurs totaux</p>
                  <p className="text-2xl font-bold text-white">{stats.totalUsers}</p>
                </div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-pink-500/20 rounded-xl">
                  <TrendingUp className="text-pink-400" size={24} />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Rapports ce mois</p>
                  <p className="text-2xl font-bold text-white">{stats.reportsThisMonth}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Activity size={20} className="text-blue-400" />
              Activité récente
            </h3>
            <div className="space-y-3">
              {restaurants.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-slate-700/50 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <Building2 size={18} className="text-slate-400" />
                    </div>
                    <div>
                      <p className="text-white font-medium">{r.name}</p>
                      <p className="text-slate-400 text-sm">{r.owner}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(r.status)}`}>
                      {r.status}
                    </span>
                    <p className="text-slate-500 text-xs mt-1">{r.lastActivity}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Restaurants Tab */}
      {activeTab === 'restaurants' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Rechercher un restaurant..."
                className="w-full pl-10 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="trial">Essai</option>
              <option value="suspended">Suspendu</option>
              <option value="cancelled">Annulé</option>
            </select>
          </div>

          {/* Restaurants List */}
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-700">
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Restaurant</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Plan</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Statut</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Employés</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Rapports/mois</th>
                    <th className="text-left py-3 px-4 text-slate-400 font-medium text-sm">Créé le</th>
                    <th className="text-right py-3 px-4 text-slate-400 font-medium text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRestaurants.map(r => (
                    <tr key={r.id} className="border-b border-slate-700/50 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div>
                          <p className="text-white font-medium">{r.name}</p>
                          <p className="text-slate-400 text-sm">{r.email}</p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${getPlanBadge(r.plan)}`}>
                          {r.plan}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded-full text-xs capitalize ${getStatusBadge(r.status)}`}>
                          {r.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-300">{r.employees}</td>
                      <td className="py-3 px-4 text-slate-300">{r.monthlyReports}</td>
                      <td className="py-3 px-4 text-slate-400 text-sm">{r.createdAt}</td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Voir">
                            <Eye size={16} className="text-slate-400" />
                          </button>
                          <a href={`mailto:${r.email}`} className="p-2 hover:bg-slate-700 rounded-lg transition-colors" title="Email">
                            <Mail size={16} className="text-slate-400" />
                          </a>
                          {r.status === 'suspended' ? (
                            <button
                              onClick={() => handleActivate(r.id)}
                              className="p-2 hover:bg-green-500/20 rounded-lg transition-colors"
                              title="Activer"
                            >
                              <CheckSquare size={16} className="text-green-400" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleSuspend(r.id)}
                              className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                              title="Suspendre"
                            >
                              <Ban size={16} className="text-red-400" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Subscriptions Tab */}
      {activeTab === 'subscriptions' && (
        <div className="space-y-6">
          {/* Plans Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card border-slate-600">
              <h4 className="text-lg font-semibold text-white mb-2">Starter</h4>
              <p className="text-3xl font-bold text-white mb-1">$49<span className="text-lg text-slate-400">/mois</span></p>
              <p className="text-slate-400 text-sm mb-4">Jusqu'à 5 employés</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Abonnés</span>
                <span className="text-white font-medium">8</span>
              </div>
            </div>

            <div className="card border-blue-500/50">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-semibold text-white">Pro</h4>
                <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">Populaire</span>
              </div>
              <p className="text-3xl font-bold text-white mb-1">$99<span className="text-lg text-slate-400">/mois</span></p>
              <p className="text-slate-400 text-sm mb-4">Jusqu'à 20 employés</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Abonnés</span>
                <span className="text-white font-medium">14</span>
              </div>
            </div>

            <div className="card border-purple-500/50">
              <h4 className="text-lg font-semibold text-white mb-2">Enterprise</h4>
              <p className="text-3xl font-bold text-white mb-1">$199<span className="text-lg text-slate-400">/mois</span></p>
              <p className="text-slate-400 text-sm mb-4">Employés illimités</p>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Abonnés</span>
                <span className="text-white font-medium">2</span>
              </div>
            </div>
          </div>

          {/* Revenue Chart Placeholder */}
          <div className="card">
            <h3 className="text-lg font-semibold text-white mb-4">Revenus mensuels</h3>
            <div className="h-48 bg-slate-800/50 rounded-lg flex items-center justify-center">
              <p className="text-slate-500">Graphique des revenus (à implémenter)</p>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="card">
          <h3 className="text-lg font-semibold text-white mb-4">Tous les utilisateurs</h3>
          <p className="text-slate-400">Liste de tous les utilisateurs de la plateforme (à implémenter)</p>
        </div>
      )}
    </div>
  )
}
