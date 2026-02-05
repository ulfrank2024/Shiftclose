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
    <header className="md:hidden bg-slate-800 border-b border-slate-700 sticky top-0 z-50 safe-area-top">
      <div className="flex items-center justify-between h-14 px-4">
        {/* Logo */}
        <Link to={isSuperAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
            isSuperAdmin ? 'bg-amber-500' : 'bg-blue-500'
          }`}>
            {isSuperAdmin ? (
              <Shield className="text-white" size={18} />
            ) : (
              <span className="text-white font-bold">S</span>
            )}
          </div>
          <span className="text-white font-semibold">ShiftClose</span>
        </Link>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Restaurant Selector */}
          {!isSuperAdmin && currentRestaurant && user?.restaurants?.length > 1 && (
            <div className="relative">
              <button
                onClick={() => setShowRestaurantMenu(!showRestaurantMenu)}
                className="flex items-center gap-1 px-2 py-1.5 bg-slate-700 rounded-lg text-sm"
              >
                <Building2 size={14} className="text-blue-400" />
                <span className="text-white max-w-[80px] truncate">{currentRestaurant.name}</span>
                <ChevronDown size={14} className="text-slate-400" />
              </button>

              {showRestaurantMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowRestaurantMenu(false)}
                  />
                  <div className="absolute top-full right-0 mt-2 w-56 bg-slate-700 rounded-xl shadow-xl border border-slate-600 py-2 z-50 animate-fade-in">
                    {user?.restaurants?.map((restaurant) => (
                      <button
                        key={restaurant.id}
                        onClick={() => {
                          switchRestaurant(restaurant)
                          setShowRestaurantMenu(false)
                        }}
                        className={`w-full text-left px-4 py-2.5 hover:bg-slate-600 transition-colors ${
                          currentRestaurant.id === restaurant.id ? 'bg-slate-600' : ''
                        }`}
                      >
                        <div className="text-white text-sm">{restaurant.name}</div>
                        <div className="text-slate-400 text-xs capitalize">{restaurant.role}</div>
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
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <Globe size={18} />
          </button>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                isSuperAdmin ? 'bg-amber-500' : 'bg-blue-500'
              }`}
            >
              <span className="text-white text-sm font-medium">
                {user?.firstName?.charAt(0) || 'U'}
              </span>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-700 rounded-xl shadow-xl border border-slate-600 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-600">
                    <div className="text-white font-medium">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-slate-400 text-sm truncate">{user?.email}</div>
                    {isSuperAdmin && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                        Super Admin
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowMenu(false)}
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-600 transition-colors"
                  >
                    <User size={18} className="text-slate-400" />
                    <span className="text-white">{t('nav.profile')}</span>
                  </Link>

                  <div className="border-t border-slate-600 mt-2 pt-2">
                    <button
                      onClick={() => {
                        logout()
                        setShowMenu(false)
                      }}
                      className="flex items-center gap-3 px-4 py-2.5 w-full hover:bg-slate-600 transition-colors text-red-400"
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
