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
  ChevronRight,
  ChevronDown,
  Check,
  Coins
} from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function Sidebar() {
  const { t } = useTranslation()
  const { user, logout, currentRestaurant, switchRestaurant } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false)
  const restaurantMenuRef = useRef(null)

  const isSuperAdmin = user?.role === 'superadmin'
  const isManager = user?.role === 'manager' || currentRestaurant?.role === 'manager'
  const canDoCashout = currentRestaurant?.canDoCashout !== false
  const hasMultipleRestaurants = (user?.restaurants?.length || 0) > 1

  // Fermer le menu si clic en dehors
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (restaurantMenuRef.current && !restaurantMenuRef.current.contains(e.target)) {
        setShowRestaurantMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Navigation items based on role
  const getNavItems = () => {
    if (isSuperAdmin) {
      // Super Admin : tout est dans /admin via les onglets internes
      return [
        { path: '/admin', icon: Shield,   label: 'Administration' },
        { path: '/profile', icon: Users,  label: 'Mon profil' },
      ]
    }

    return [
      { path: '/dashboard', icon: LayoutDashboard, label: t('nav.dashboard') },
      ...(canDoCashout
        ? [{ path: '/cash-out', icon: Calculator, label: t('nav.cashOut') }]
        : [{ path: '/my-tips', icon: Coins, label: 'Mes Tips' }]
      ),
      // Les managers peuvent aussi recevoir des tips (ex: hôte, host)
      ...(isManager && canDoCashout
        ? [{ path: '/my-tips', icon: Coins, label: 'Tips Reçus' }]
        : []
      ),
      { path: '/reports', icon: FileText, label: t('nav.reports') },
      ...(isManager ? [{ path: '/team', icon: Users, label: t('nav.team') }] : []),
      { path: '/settings', icon: Settings, label: t('nav.settings') },
    ]
  }

  const navItems = getNavItems()

  return (
    <aside className="sidebar-desktop" style={{
      flexDirection: 'column',
      backgroundColor: '#1e293b',
      borderRight: '1px solid #334155',
      transition: 'all 0.3s',
      width: collapsed ? '96px' : '288px',
      height: '100vh',
      position: 'sticky',
      top: 0,
      overflowY: 'auto',
      flexShrink: 0
    }}>
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
      {!isSuperAdmin && currentRestaurant && (
        <div style={{ padding: collapsed ? '12px' : '16px 20px', borderBottom: '1px solid #334155' }}>
          {collapsed ? (
            /* Mode réduit : juste l'icône */
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              padding: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(59, 130, 246, 0.2)'
            }}>
              <Building2 size={20} className="text-blue-400" />
            </div>
          ) : (
            /* Mode normal : dropdown complet */
            <div ref={restaurantMenuRef} style={{ position: 'relative' }}>
              <button
                onClick={() => hasMultipleRestaurants && setShowRestaurantMenu(!showRestaurantMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '12px 14px',
                  backgroundColor: 'rgba(51, 65, 85, 0.5)',
                  borderRadius: '12px',
                  border: showRestaurantMenu
                    ? '1px solid rgba(59, 130, 246, 0.5)'
                    : '1px solid rgba(51, 65, 85, 0.3)',
                  cursor: hasMultipleRestaurants ? 'pointer' : 'default',
                  transition: 'all 0.2s',
                  textAlign: 'left'
                }}
              >
                {/* Icône restaurant */}
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  backgroundColor: 'rgba(59, 130, 246, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Building2 size={17} className="text-blue-400" />
                </div>

                {/* Nom + rôle */}
                <div style={{ overflow: 'hidden', flex: 1 }}>
                  <p style={{
                    color: 'white',
                    fontSize: '13px',
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.3
                  }}>
                    {currentRestaurant.name}
                  </p>
                  <p style={{
                    color: currentRestaurant.role === 'manager' ? '#a78bfa' : '#60a5fa',
                    fontSize: '11px',
                    textTransform: 'capitalize',
                    marginTop: '2px'
                  }}>
                    {currentRestaurant.role === 'manager' ? 'Manager' : 'Serveur'}
                  </p>
                </div>

                {/* Chevron si plusieurs restaurants */}
                {hasMultipleRestaurants && (
                  <ChevronDown
                    size={15}
                    style={{
                      color: '#94a3b8',
                      flexShrink: 0,
                      transform: showRestaurantMenu ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }}
                  />
                )}
              </button>

              {/* Dropdown liste des restaurants */}
              {showRestaurantMenu && hasMultipleRestaurants && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  right: 0,
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '12px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
                  zIndex: 100,
                  overflow: 'hidden'
                }}>
                  {/* En-tête dropdown */}
                  <div style={{
                    padding: '10px 14px 8px',
                    borderBottom: '1px solid #334155'
                  }}>
                    <p style={{ color: '#64748b', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Mes restaurants
                    </p>
                  </div>

                  {/* Liste */}
                  <div style={{ padding: '6px' }}>
                    {user?.restaurants?.map((restaurant) => {
                      const isActive = restaurant.id === currentRestaurant.id
                      return (
                        <button
                          key={restaurant.id}
                          onClick={() => {
                            switchRestaurant(restaurant)
                            setShowRestaurantMenu(false)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            width: '100%',
                            padding: '10px 10px',
                            borderRadius: '8px',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.12)' : 'transparent',
                            transition: 'background-color 0.15s',
                            textAlign: 'left'
                          }}
                          onMouseEnter={e => {
                            if (!isActive) e.currentTarget.style.backgroundColor = 'rgba(51, 65, 85, 0.5)'
                          }}
                          onMouseLeave={e => {
                            if (!isActive) e.currentTarget.style.backgroundColor = 'transparent'
                          }}
                        >
                          {/* Icône */}
                          <div style={{
                            width: '30px',
                            height: '30px',
                            borderRadius: '7px',
                            backgroundColor: isActive ? 'rgba(59, 130, 246, 0.2)' : 'rgba(51, 65, 85, 0.6)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}>
                            <Building2 size={14} style={{ color: isActive ? '#60a5fa' : '#94a3b8' }} />
                          </div>

                          {/* Nom + rôle */}
                          <div style={{ overflow: 'hidden', flex: 1 }}>
                            <p style={{
                              color: isActive ? 'white' : '#cbd5e1',
                              fontSize: '13px',
                              fontWeight: isActive ? 600 : 400,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}>
                              {restaurant.name}
                            </p>
                            <p style={{
                              color: restaurant.role === 'manager' ? '#a78bfa' : '#64748b',
                              fontSize: '11px',
                              textTransform: 'capitalize',
                              marginTop: '1px'
                            }}>
                              {restaurant.role === 'manager' ? 'Manager' : 'Serveur'}
                            </p>
                          </div>

                          {/* Check si actif */}
                          {isActive && (
                            <Check size={14} style={{ color: '#60a5fa', flexShrink: 0 }} />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
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
              backgroundColor: isSuperAdmin ? '#f59e0b' : '#3b82f6',
              overflow: 'hidden'
            }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'white', fontWeight: 500, fontSize: '18px' }}>
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              )}
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
              backgroundColor: isSuperAdmin ? '#f59e0b' : '#3b82f6',
              overflow: 'hidden'
            }}>
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'white', fontWeight: 500, fontSize: '18px' }}>
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              )}
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
