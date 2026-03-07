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
  Coins
} from 'lucide-react'

export default function BottomNav() {
  const { t } = useTranslation()
  const { isManager, user, currentRestaurant } = useAuth()
  const isSuperAdmin = user?.role === 'superadmin'
  const canDoCashout = currentRestaurant?.canDoCashout !== false

  // Navigation séparée selon le rôle
  const navItems = isSuperAdmin
    ? [
        // Super Admin : uniquement le panel admin et profil
        { path: '/admin',   icon: Shield,  label: 'Admin' },
        { path: '/profile', icon: Settings, label: 'Profil' }
      ]
    : [
        { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
        ...(canDoCashout
          ? [{ path: '/cash-out', icon: Calculator, label: t('nav.cashOut') }]
          : [{ path: '/my-tips', icon: Coins, label: 'Mes Tips' }]
        ),
        ...(canDoCashout
          ? [{ path: '/my-tips', icon: Coins, label: 'Tips Reçus' }]
          : []
        ),
        { path: '/reports',   icon: FileText,         label: t('nav.reports') },
        ...(isManager ? [{ path: '/team', icon: Users, label: t('nav.team') }] : []),
        { path: '/settings',  icon: Settings,         label: t('nav.settings') }
      ]

  return (
    <nav className="topbar-mobile" style={{
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
