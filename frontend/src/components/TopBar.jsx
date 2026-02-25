import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import {
  Menu,
  X,
  Globe,
  User,
  LogOut,
  Building2,
  ChevronDown,
  Shield
} from 'lucide-react'

export default function TopBar() {
  const { t } = useTranslation()
  const { user, currentRestaurant, logout, switchRestaurant } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const [showMenu, setShowMenu] = useState(false)
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false)

  const isSuperAdmin = user?.role === 'superadmin'

  return (
    <header className="topbar-mobile" style={{
      backgroundColor: '#1e293b',
      borderBottom: '1px solid #334155',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '56px',
        padding: '0 16px'
      }}>
        {/* Logo */}
        <Link to={isSuperAdmin ? '/admin' : '/dashboard'} style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
          <div style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isSuperAdmin ? '#f59e0b' : '#3b82f6'
          }}>
            {isSuperAdmin ? (
              <Shield style={{ color: 'white' }} size={18} />
            ) : (
              <span style={{ color: 'white', fontWeight: 'bold' }}>S</span>
            )}
          </div>
          <span style={{ color: 'white', fontWeight: 600 }}>ShiftClose</span>
        </Link>

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Restaurant Selector */}
          {!isSuperAdmin && currentRestaurant && user?.restaurants?.length > 1 && (
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowRestaurantMenu(!showRestaurantMenu)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '6px 8px',
                  backgroundColor: '#334155',
                  borderRadius: '8px',
                  fontSize: '14px',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                <Building2 size={14} style={{ color: '#60a5fa' }} />
                <span style={{ color: 'white', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{currentRestaurant.name}</span>
                <ChevronDown size={14} style={{ color: '#94a3b8' }} />
              </button>

              {showRestaurantMenu && (
                <>
                  <div
                    style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                    onClick={() => setShowRestaurantMenu(false)}
                  />
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '224px',
                    backgroundColor: '#334155',
                    borderRadius: '12px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    border: '1px solid #475569',
                    padding: '8px 0',
                    zIndex: 50
                  }}>
                    {user?.restaurants?.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        onClick={() => {
                          switchRestaurant(restaurant)
                          setShowRestaurantMenu(false)
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '10px 16px',
                          backgroundColor: currentRestaurant.id === restaurant.id ? '#475569' : 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          transition: 'background-color 0.2s'
                        }}
                      >
                        <div style={{ color: 'white', fontSize: '14px' }}>{restaurant.name}</div>
                        <div style={{ color: '#94a3b8', fontSize: '12px', textTransform: 'capitalize' }}>{restaurant.role}</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            style={{
              padding: '8px',
              color: '#94a3b8',
              backgroundColor: 'transparent',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Globe size={18} />
          </button>

          {/* User Menu */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isSuperAdmin ? '#f59e0b' : '#3b82f6',
                border: '2px solid rgba(255,255,255,0.2)',
                cursor: 'pointer',
                overflow: 'hidden',
                padding: 0
              }}
            >
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ color: 'white', fontSize: '14px', fontWeight: 500 }}>
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              )}
            </button>

            {showMenu && (
              <>
                <div
                  style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                  onClick={() => setShowMenu(false)}
                />
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '8px',
                  width: '224px',
                  backgroundColor: '#334155',
                  borderRadius: '12px',
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #475569',
                  padding: '8px 0',
                  zIndex: 50
                }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #475569' }}>
                    <div style={{ color: 'white', fontWeight: 500 }}>
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div style={{ color: '#94a3b8', fontSize: '14px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                    {isSuperAdmin && (
                      <span style={{
                        display: 'inline-block',
                        marginTop: '4px',
                        padding: '2px 8px',
                        backgroundColor: 'rgba(245, 158, 11, 0.2)',
                        color: '#fbbf24',
                        fontSize: '12px',
                        borderRadius: '4px'
                      }}>
                        Super Admin
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowMenu(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '10px 16px',
                      textDecoration: 'none',
                      transition: 'background-color 0.2s'
                    }}
                  >
                    <User size={18} style={{ color: '#94a3b8' }} />
                    <span style={{ color: 'white' }}>{t('nav.profile')}</span>
                  </Link>

                  <div style={{ borderTop: '1px solid #475569', marginTop: '8px', paddingTop: '8px' }}>
                    <button
                      onClick={() => {
                        logout()
                        setShowMenu(false)
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        width: '100%',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#f87171',
                        transition: 'background-color 0.2s'
                      }}
                    >
                      <LogOut size={18} />
                      <span>{t('auth.logout')}</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
