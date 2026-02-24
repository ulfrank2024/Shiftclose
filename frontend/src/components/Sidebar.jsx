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
    <aside style={{
      display: 'none',
      flexDirection: 'column',
      backgroundColor: '#1e293b',
      borderRight: '1px solid #334155',
      transition: 'all 0.3s',
      width: collapsed ? '96px' : '288px',
      minHeight: '100vh'
    }} className="md:flex">
      {/* Logo Header */}
      <div style={{
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        borderBottom: '1px solid #334155',
        justifyContent: collapsed ? 'center' : 'space-between',
        padding: collapsed ? '16px' : '0 24px'
      }}>
        <div className={`flex items-center gap-4 ${collapsed ? 'justify-center' : ''}`}>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${
            isSuperAdmin ? 'bg-amber-500' : 'bg-blue-500'
          }`}>
            {isSuperAdmin ? (
              <Shield className="text-white" size={24} />
            ) : (
              <span className="text-white font-bold text-xl">S</span>
            )}
          </div>
          {!collapsed && (
            <div className="overflow-hidden">
              <span className="text-white font-semibold text-lg block leading-tight">ShiftClose</span>
              {isSuperAdmin && (
                <span className="text-amber-400 text-xs">Administration</span>
              )}
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="p-2.5 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white flex-shrink-0"
          >
            <ChevronLeft size={20} />
          </button>
        )}
      </div>

      {/* Expand button when collapsed */}
      {collapsed && (
        <div className="flex justify-center py-4">
          <button
            onClick={() => setCollapsed(false)}
            className="p-2.5 hover:bg-slate-700 rounded-xl transition-colors text-slate-400 hover:text-white"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      )}

      {/* Restaurant Selector (for non-admin) */}
      {!isSuperAdmin && currentRestaurant && !collapsed && (
        <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '16px',
            backgroundColor: 'rgba(51, 65, 85, 0.5)',
            borderRadius: '12px'
          }}>
            <Building2 size={20} className="text-blue-400 flex-shrink-0" />
            <div className="overflow-hidden flex-1">
              <p className="text-white text-sm font-medium truncate">{currentRestaurant.name}</p>
              <p className="text-slate-400 text-xs capitalize">{currentRestaurant.role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav style={{
        flex: 1,
        padding: collapsed ? '24px 12px' : '28px 20px',
        overflowY: 'auto'
      }}>
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/admin' || item.path === '/dashboard'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: collapsed ? '13px 12px' : '13px 18px',
              borderRadius: '14px',
              transition: 'all 0.2s',
              marginBottom: '6px',
              justifyContent: collapsed ? 'center' : 'flex-start',
              backgroundColor: isActive
                ? (isSuperAdmin ? 'rgba(245, 158, 11, 0.2)' : 'rgba(59, 130, 246, 0.2)')
                : 'transparent',
              color: isActive
                ? (isSuperAdmin ? '#fbbf24' : '#60a5fa')
                : '#94a3b8',
              textDecoration: 'none',
              fontWeight: isActive ? 600 : 400
            })}
          >
            <item.icon size={22} style={{ flexShrink: 0 }} />
            {!collapsed && (
              <span style={{ fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User Section */}
      <div style={{
        padding: collapsed ? '20px 12px' : '20px',
        borderTop: '1px solid #334155'
      }}>
        {!collapsed ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            padding: '12px 16px',
            marginBottom: '16px',
            backgroundColor: 'rgba(51, 65, 85, 0.3)',
            borderRadius: '12px'
          }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
              backgroundColor: isSuperAdmin ? '#f59e0b' : '#3b82f6'
            }}>
              <span style={{ color: 'white', fontWeight: 500, fontSize: '18px' }}>
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <p style={{ color: 'white', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.firstName} {user?.lastName}
              </p>
              <p style={{ color: '#94a3b8', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</p>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isSuperAdmin ? '#f59e0b' : '#3b82f6'
            }}>
              <span style={{ color: 'white', fontWeight: 500, fontSize: '18px' }}>
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={logout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            width: '100%',
            padding: collapsed ? '14px 12px' : '14px 16px',
            borderRadius: '12px',
            color: '#f87171',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition: 'background-color 0.2s'
          }}
        >
          <LogOut size={22} />
          {!collapsed && <span style={{ fontWeight: 500 }}>{t('auth.logout')}</span>}
        </button>
      </div>
    </aside>
  )
}
