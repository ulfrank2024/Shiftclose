import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentRestaurant, setCurrentRestaurant] = useState(null)

  // Check for saved session on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('token')
      const savedRestaurant = localStorage.getItem('currentRestaurant')

      if (token) {
        try {
          const { user: userData } = await authAPI.getProfile()
          setUser(userData)

          // Restore saved restaurant or set first one
          if (savedRestaurant) {
            const restaurant = JSON.parse(savedRestaurant)
            // Verify user still has access to this restaurant
            if (userData.restaurants?.some(r => r.id === restaurant.id)) {
              setCurrentRestaurant(restaurant)
            } else if (userData.restaurants?.length > 0) {
              setCurrentRestaurant(userData.restaurants[0])
              localStorage.setItem('currentRestaurant', JSON.stringify(userData.restaurants[0]))
            }
          } else if (userData.restaurants?.length > 0) {
            setCurrentRestaurant(userData.restaurants[0])
            localStorage.setItem('currentRestaurant', JSON.stringify(userData.restaurants[0]))
          }
        } catch (error) {
          console.error('Auth init error:', error)
          // Token invalid, clear storage
          localStorage.removeItem('token')
          localStorage.removeItem('currentRestaurant')
        }
      }

      setLoading(false)
    }

    initAuth()
  }, [])

  const login = async (email, password) => {
    const { token, user: userData } = await authAPI.login({ email, password })

    localStorage.setItem('token', token)
    setUser(userData)

    // Set default restaurant (only for non-superadmin)
    if (userData.role !== 'superadmin' && userData.restaurants?.length > 0) {
      setCurrentRestaurant(userData.restaurants[0])
      localStorage.setItem('currentRestaurant', JSON.stringify(userData.restaurants[0]))
    }

    console.log('Login successful, user role:', userData.role) // Debug log

    return userData
  }

  const register = async (userData) => {
    const { token, user: newUser } = await authAPI.register(userData)

    localStorage.setItem('token', token)
    setUser(newUser)

    // Set default restaurant if created
    if (newUser.restaurants?.length > 0) {
      setCurrentRestaurant(newUser.restaurants[0])
      localStorage.setItem('currentRestaurant', JSON.stringify(newUser.restaurants[0]))
    }

    return newUser
  }

  const logout = () => {
    setUser(null)
    setCurrentRestaurant(null)
    localStorage.removeItem('token')
    localStorage.removeItem('currentRestaurant')
  }

  const switchRestaurant = (restaurant) => {
    setCurrentRestaurant(restaurant)
    localStorage.setItem('currentRestaurant', JSON.stringify(restaurant))
  }

  const refreshUser = useCallback(async () => {
    try {
      const { user: userData } = await authAPI.getProfile()
      setUser(userData)
      // Mettre à jour currentRestaurant avec canDoCashout frais
      setCurrentRestaurant(prev => {
        if (!prev) return prev
        const fresh = userData.restaurants?.find(r => r.id === prev.id)
        if (fresh) {
          const updated = { ...prev, ...fresh }
          localStorage.setItem('currentRestaurant', JSON.stringify(updated))
          return updated
        }
        return prev
      })
      return userData
    } catch (error) {
      console.error('Refresh user error:', error)
      logout()
    }
  }, []) // eslint-disable-line

  // ── Rafraîchissement automatique des permissions ──────────
  // Sur focus de fenêtre (retour sur l'onglet)
  useEffect(() => {
    if (!user) return
    const handleFocus = () => { refreshUser() }
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [user, refreshUser])

  // Toutes les 60 secondes en arrière-plan
  useEffect(() => {
    if (!user) return
    const interval = setInterval(() => { refreshUser() }, 60_000)
    return () => clearInterval(interval)
  }, [user, refreshUser])

  const updateProfile = async (data) => {
    await authAPI.updateProfile(data)
    await refreshUser()
  }

  const value = {
    user,
    loading,
    currentRestaurant,
    login,
    register,
    logout,
    switchRestaurant,
    refreshUser,
    updateProfile,
    isAuthenticated: !!user,
    isManager: user?.role === 'manager' || user?.role === 'superadmin' || currentRestaurant?.role === 'manager',
    isSuperAdmin: user?.role === 'superadmin'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
