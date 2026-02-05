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
  Building2
} from 'lucide-react'

export default function Dashboard() {
  const { t } = useTranslation()
  const { user, currentRestaurant, isManager, isSuperAdmin } = useAuth()

  // Mock data
  const stats = {
    totalSales: 2450.75,
    totalTips: 387.50,
    pendingReports: 3,
    validatedReports: 12
  }

  const recentActivity = [
    { id: 1, user: 'Marie L.', action: 'Cash Out soumis', amount: 324.50, time: '14:30' },
    { id: 2, user: 'Jean P.', action: 'Rapport validé', amount: 512.00, time: '13:45' },
    { id: 3, user: 'Sophie M.', action: 'Cash Out soumis', amount: 287.25, time: '12:20' }
  ]

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {t('dashboard.welcome')}, {user?.firstName} !
          </h1>
          <p className="text-slate-400 flex items-center gap-2 mt-1">
            <Building2 size={16} />
            {currentRestaurant?.name}
          </p>
        </div>
        <Link
          to="/cash-out"
          className="btn btn-primary"
        >
          <Calculator size={20} />
          {t('dashboard.startCashOut')}
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <DollarSign className="text-green-400" size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-4">{t('dashboard.totalSales')}</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${stats.totalSales.toFixed(2)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <TrendingUp className="text-blue-400" size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-4">{t('dashboard.totalTips')}</p>
          <p className="text-2xl font-bold text-white mt-1">
            ${stats.totalTips.toFixed(2)}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Clock className="text-amber-400" size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-4">{t('dashboard.pendingReports')}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.pendingReports}
          </p>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <CheckCircle className="text-emerald-400" size={24} />
            </div>
          </div>
          <p className="text-slate-400 text-sm mt-4">{t('dashboard.validatedReports')}</p>
          <p className="text-2xl font-bold text-white mt-1">
            {stats.validatedReports}
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t('dashboard.quickActions')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <Link
            to="/cash-out"
            className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Calculator className="text-blue-400" size={20} />
              </div>
              <span className="text-white font-medium">{t('dashboard.startCashOut')}</span>
            </div>
            <ArrowRight className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" size={18} />
          </Link>

          <Link
            to="/reports"
            className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <FileText className="text-green-400" size={20} />
              </div>
              <span className="text-white font-medium">{t('dashboard.viewReports')}</span>
            </div>
            <ArrowRight className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" size={18} />
          </Link>

          {isManager && (
            <Link
              to="/team"
              className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Users className="text-purple-400" size={20} />
                </div>
                <span className="text-white font-medium">{t('nav.team')}</span>
              </div>
              <ArrowRight className="text-slate-400 group-hover:text-white group-hover:translate-x-1 transition-all" size={18} />
            </Link>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">
          {t('dashboard.recentActivity')}
        </h2>
        <div className="space-y-3">
          {recentActivity.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {activity.user.charAt(0)}
                  </span>
                </div>
                <div>
                  <p className="text-white font-medium">{activity.user}</p>
                  <p className="text-sm text-slate-400">{activity.action}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-medium">${activity.amount.toFixed(2)}</p>
                <p className="text-sm text-slate-400">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
