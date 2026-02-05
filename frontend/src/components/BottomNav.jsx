import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import {
  LayoutDashboard,
  Calculator,
  FileText,
  Users,
  Settings,
  Shield
} from 'lucide-react'

export default function BottomNav() {
  const { t } = useTranslation()
  const { isManager, user } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
    // Super Admin sees Admin panel instead of Cash Out
    ...(isSuperAdmin
      ? [{ path: '/admin', icon: Shield, label: t('nav.admin') }]
      : [{ path: '/cash-out', icon: Calculator, label: t('nav.cashOut') }]
    ),
    { path: '/reports', icon: FileText, label: t('nav.reports') },
    ...(isManager && !isSuperAdmin ? [{ path: '/team', icon: Users, label: t('nav.team') }] : []),
    { path: '/settings', icon: Settings, label: t('nav.settings') }
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 md:hidden safe-area-bottom z-50">
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-2 rounded-lg transition-colors ${
                isActive
                  ? 'text-blue-400 bg-blue-500/10'
                  : 'text-slate-400 hover:text-white'
              }`
            }
          >
            <item.icon size={22} />
            <span className="text-xs mt-1 truncate max-w-[60px]">{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
