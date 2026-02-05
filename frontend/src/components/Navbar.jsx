import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useLanguage } from '../contexts/LanguageContext'
import {
  Menu,
  X,
  LogOut,
  User,
  Building2,
  ChevronDown,
  Globe
} from 'lucide-react'

export default function Navbar() {
  const { t } = useTranslation()
  const { user, currentRestaurant, logout, switchRestaurant, isSuperAdmin } = useAuth()
  const { language, toggleLanguage } = useLanguage()
  const [showRestaurantMenu, setShowRestaurantMenu] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)

  const handleLogout = () => {
    logout()
    setShowUserMenu(false)
  }

  return (
    <nav className="bg-slate-800 border-b border-slate-700 sticky top-0 z-50 safe-area-top">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-white font-semibold text-lg hidden sm:block">
              ShiftClose
            </span>
          </Link>

          {/* Restaurant Selector (Center) */}
          {currentRestaurant && (
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowRestaurantMenu(!showRestaurantMenu)}
                className="flex items-center gap-2 px-4 py-2 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors"
              >
                <Building2 size={18} className="text-blue-400" />
                <span className="text-white">{currentRestaurant.name}</span>
                <ChevronDown size={16} className="text-slate-400" />
              </button>

              {showRestaurantMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-slate-700 rounded-lg shadow-xl border border-slate-600 py-2 animate-fade-in">
                  <div className="px-4 py-2 text-sm text-slate-400 border-b border-slate-600">
                    {t('restaurants.myRestaurants')}
                  </div>
                  {user?.restaurants?.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      onClick={() => {
                        switchRestaurant(restaurant)
                        setShowRestaurantMenu(false)
                      }}
                      className={`w-full text-left px-4 py-3 hover:bg-slate-600 transition-colors ${
                        currentRestaurant.id === restaurant.id ? 'bg-slate-600' : ''
                      }`}
                    >
                      <div className="text-white">{restaurant.name}</div>
                      <div className="text-sm text-slate-400 capitalize">{restaurant.role}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Right Side */}
          <div className="flex items-center gap-2">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title={language === 'fr' ? 'Switch to English' : 'Passer en Français'}
            >
              <Globe size={18} />
              <span className="text-sm font-medium uppercase">{language}</span>
            </button>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 px-3 py-2 hover:bg-slate-700 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">
                    {user?.firstName?.charAt(0) || 'U'}
                  </span>
                </div>
                <ChevronDown size={16} className="text-slate-400 hidden sm:block" />
              </button>

              {showUserMenu && (
                <div className="absolute top-full right-0 mt-2 w-56 bg-slate-700 rounded-lg shadow-xl border border-slate-600 py-2 animate-fade-in">
                  <div className="px-4 py-3 border-b border-slate-600">
                    <div className="text-white font-medium">
                      {user?.firstName} {user?.lastName}
                    </div>
                    <div className="text-sm text-slate-400">{user?.email}</div>
                    {isSuperAdmin && (
                      <span className="inline-block mt-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded">
                        Super Admin
                      </span>
                    )}
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-slate-600 transition-colors"
                  >
                    <User size={18} className="text-slate-400" />
                    <span className="text-white">{t('nav.profile')}</span>
                  </Link>

                  {isSuperAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center gap-3 px-4 py-3 hover:bg-slate-600 transition-colors"
                    >
                      <Building2 size={18} className="text-slate-400" />
                      <span className="text-white">{t('nav.admin')}</span>
                    </Link>
                  )}

                  <div className="border-t border-slate-600 mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 px-4 py-3 w-full hover:bg-slate-600 transition-colors text-red-400"
                    >
                      <LogOut size={18} />
                      <span>{t('auth.logout')}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
