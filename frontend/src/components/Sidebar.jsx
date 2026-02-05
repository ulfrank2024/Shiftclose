import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Users,
  Settings,
  Shield,
  Building2,
  CreditCard,
  BarChart3,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'

export default function Sidebar() {
  const { t } = useTranslation()
  const { user, logout, currentRestaurant } = useAuth()
  const [collapsed, setCollapsed] = useState(false)

  const isSuperAdmin = user?.role === 'superadmin'
  const isManager = user?.role === 'manager' || currentRestaurant?.role === 'manager'

  // Navigation items based on role
  const getNavItems = () => {
    if (isSuperAdmin) {
      return [
        { path: '/admin', icon: BarChart3, label: 'Vue d\'ensemble' },
        { path: '/admin/restaurants', icon: Building2, label: 'Restaurants' },
        { path: '/admin/subscriptions', icon: CreditCard, label: 'Abonnements' },
        { path: '/admin/users', icon: Users, label: 'Utilisateurs' },
        { path: '/settings', icon: Settings, label: t('nav.settings') },
      ]
    }

    return [
      { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      { path: '/cash-out', icon: Calculator, label: t('nav.cashOut') },
      { path: '/reports', icon: FileText, label: t('nav.reports') },
      ...(isManager ? [{ path: '/team', icon: Users, label: t('nav.team') }] : []),
      { path: '/settings', icon: Settings, label: t('nav.settings') },
    ]
  }

  const navItems = getNavItems()

  return (
    <aside className={`hidden md:flex flex-col bg-slate-800 border-r border-slate-700 transition-all duration-300 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Logo */}
      <div className={`h-16 flex items-center border-b border-slate-700 ${
        collapsed ? 'justify-center px-2' : 'justify-between px-4'
      }`}>
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isSuperAdmin ? 'bg-amber-500' : 'bg-blue-500'
          }`}>
            {isSuperAdmin ? (
              <Shield className="text-white" size={22} />
            ) : (
              <span className="text-white font-bold text-lg">S</span>
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-white font-semibold text-lg block leading-tight truncate">ShiftClose</span>
              {isSuperAdmin && (
                <span className="text-amber-400 text-xs">Administration</span>
              )}
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white flex-shrink-0"
          >
            <ChevronLeft size={18} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="mx-auto mt-2 p-2 hover:bg-slate-700 rounded-lg transition-colors text-slate-400 hover:text-white"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {/* Restaurant Selector (for non-admin) */}
      {!isSuperAdmin && currentRestaurant && !collapsed && (
        <div className="px-3 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3 px-4 py-3 bg-slate-700/50 rounded-xl">
            <Building2 size={18} className="text-blue-400 flex-shrink-0" />
            <div className="overflow-hidden flex-1">
              <p className="text-white text-sm font-medium truncate">{currentRestaurant.name}</p>
              <p className="text-slate-400 text-xs capitalize">{currentRestaurant.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/dashboard'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? isSuperAdmin
                    ? 'bg-amber-500/20 text-amber-400'
                    : 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
          >
            <item.icon size={20} className="flex-shrink-0" />
            {!collapsed && (
              <span className="font-medium truncate">{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div className="px-3 py-4 border-t border-slate-700">
        {!collapsed ? (
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              isSuperAdmin ? 'bg-amber-500' : 'bg-blue-500'
            }`}>
              <span className="text-white font-medium">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div className="overflow-hidden flex-1">
              <p className="text-white font-medium truncate">
                {user?.firstName} {user?.lastName}
              </p>
              <p className="text-slate-400 text-xs truncate">{user?.email}</p>
            </div>
          </div>
        ) : (
          <div className="flex justify-center mb-3">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isSuperAdmin ? 'bg-amber-500' : 'bg-blue-500'
            }`}>
              <span className="text-white font-medium">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <LogOut size={20} />
          {!collapsed && <span className="font-medium">{t('auth.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
