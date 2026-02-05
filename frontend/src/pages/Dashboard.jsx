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
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 md:p-8">
        {/* Background decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/4" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-blue-200 text-sm mb-2">
              <Calendar size={14} />
              <span className="capitalize">{today}</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {t('dashboard.welcome')}, {user?.firstName} !
            </h1>
            <p className="text-blue-200 flex items-center gap-2">
              <Sparkles size={16} />
              {currentRestaurant?.name || 'Votre restaurant'}
            </p>
          </div>

          <Link
            to="/cash-out"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
          >
            <Calculator size={20} />
            {t('dashboard.startCashOut')}
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card card-hover stat-card text-green-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard.totalSales')}</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-2">
                ${stats.totalSales.toFixed(2)}
              </p>
            </div>
            <div className="icon-container icon-container-md bg-green-500/10">
              <DollarSign className="text-green-400" size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-green-400 text-sm">
            <TrendingUp size={14} />
            <span>+12.5% vs hier</span>
          </div>
        </div>

        <div className="card card-hover stat-card text-blue-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard.totalTips')}</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-2">
                ${stats.totalTips.toFixed(2)}
              </p>
            </div>
            <div className="icon-container icon-container-md bg-blue-500/10">
              <TrendingUp className="text-blue-400" size={22} />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-1 text-blue-400 text-sm">
            <TrendingUp size={14} />
            <span>+8.3% vs hier</span>
          </div>
        </div>

        <div className="card card-hover stat-card text-amber-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard.pendingReports')}</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-2">
                {stats.pendingReports}
              </p>
            </div>
            <div className="icon-container icon-container-md bg-amber-500/10">
              <Clock className="text-amber-400" size={22} />
            </div>
          </div>
          <div className="mt-4">
            <div className="progress-bar">
              <div
                className="progress-bar-fill bg-amber-500"
                style={{ width: `${(stats.pendingReports / (stats.pendingReports + stats.validatedReports)) * 100}%` }}
              />
            </div>
          </div>
        </div>

        <div className="card card-hover stat-card text-emerald-400">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm">{t('dashboard.validatedReports')}</p>
              <p className="text-2xl md:text-3xl font-bold text-white mt-2">
                {stats.validatedReports}
              </p>
            </div>
            <div className="icon-container icon-container-md bg-emerald-500/10">
              <CheckCircle className="text-emerald-400" size={22} />
            </div>
          </div>
          <div className="mt-4">
            <div className="progress-bar">
              <div
                className="progress-bar-fill bg-emerald-500"
                style={{ width: `${(stats.validatedReports / (stats.pendingReports + stats.validatedReports)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-1">
          <div className="card h-full">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Sparkles size={18} className="text-blue-400" />
              {t('dashboard.quickActions')}
            </h2>
            <div className="space-y-3">
              <Link
                to="/cash-out"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-500/10 to-transparent rounded-xl hover:from-blue-500/20 transition-all group border border-transparent hover:border-blue-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="icon-container icon-container-sm bg-blue-500/20">
                    <Calculator className="text-blue-400" size={18} />
                  </div>
                  <span className="text-white font-medium">{t('dashboard.startCashOut')}</span>
                </div>
                <ArrowRight className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" size={18} />
              </Link>

              <Link
                to="/reports"
                className="flex items-center justify-between p-4 bg-gradient-to-r from-green-500/10 to-transparent rounded-xl hover:from-green-500/20 transition-all group border border-transparent hover:border-green-500/30"
              >
                <div className="flex items-center gap-3">
                  <div className="icon-container icon-container-sm bg-green-500/20">
                    <FileText className="text-green-400" size={18} />
                  </div>
                  <span className="text-white font-medium">{t('dashboard.viewReports')}</span>
                </div>
                <ArrowRight className="text-slate-500 group-hover:text-green-400 group-hover:translate-x-1 transition-all" size={18} />
              </Link>

              {isManager && (
                <Link
                  to="/team"
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-500/10 to-transparent rounded-xl hover:from-purple-500/20 transition-all group border border-transparent hover:border-purple-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="icon-container icon-container-sm bg-purple-500/20">
                      <Users className="text-purple-400" size={18} />
                    </div>
                    <span className="text-white font-medium">{t('nav.team')}</span>
                  </div>
                  <ArrowRight className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" size={18} />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock size={18} className="text-slate-400" />
                {t('dashboard.recentActivity')}
              </h2>
              <Link to="/reports" className="text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1">
                Voir tout
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="space-y-3">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                      activity.color === 'green' ? 'bg-green-500/20' : 'bg-blue-500/20'
                    }`}>
                      <span className={`text-sm font-bold ${
                        activity.color === 'green' ? 'text-green-400' : 'text-blue-400'
                      }`}>
                        {activity.user.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{activity.user}</p>
                      <p className="text-sm text-slate-400">{activity.action}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-semibold">${activity.amount.toFixed(2)}</p>
                    <p className="text-sm text-slate-500">{activity.time}</p>
                  </div>
                </div>
              ))}

              {recentActivity.length === 0 && (
                <div className="empty-state py-8">
                  <Clock size={40} className="text-slate-600 mb-3" />
                  <p className="text-slate-400">Aucune activité récente</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
