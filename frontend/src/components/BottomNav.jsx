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
    <nav className="md:hidden" style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: '#1e293b',
      borderTop: '1px solid #334155',
      zIndex: 50,
      paddingBottom: 'env(safe-area-inset-bottom, 0)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        height: '64px',
        padding: '0 8px'
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 1,
              padding: '8px',
              borderRadius: '8px',
              transition: 'all 0.2s',
              textDecoration: 'none',
              color: isActive ? '#60a5fa' : '#94a3b8',
              backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent'
            })}
          >
            <item.icon size={22} />
            <span style={{ fontSize: '12px', marginTop: '4px', maxWidth: '60px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
