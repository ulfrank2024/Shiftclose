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

      if (!token) {
        setLoading(false)
        return
      }

      // Vérifie le token avec 2 tentatives (Vercel cold start < 2s)
      // Délais : 2s, puis abandon
      const tryGetProfile = async (attempt = 0) => {
        try {
          const { user: userData } = await authAPI.getProfile()
          return { userData, error: null }
        } catch (err) {
          const isNetworkError = !err.message || err.message === 'Failed to fetch' ||
            err.message.includes('NetworkError') || err.message.includes('network') ||
            err.message.includes('fetch') || err.message.includes('ECONNREFUSED')
          if (isNetworkError && attempt === 0) {
            await new Promise(resolve => setTimeout(resolve, 2000))
            return tryGetProfile(1)
          }
          return { userData: null, error: err }
        }
      }

      const { userData, error } = await tryGetProfile()

      if (userData) {
        setUser(userData)
        // Restore saved restaurant or set first one
        if (savedRestaurant) {
          try {
            const restaurant = JSON.parse(savedRestaurant)
            if (userData.restaurants?.some(r => r.id === restaurant.id)) {
              setCurrentRestaurant(restaurant)
            } else if (userData.restaurants?.length > 0) {
              setCurrentRestaurant(userData.restaurants[0])
              localStorage.setItem('currentRestaurant', JSON.stringify(userData.restaurants[0]))
            }
          } catch (_) {
            if (userData.restaurants?.length > 0) {
              setCurrentRestaurant(userData.restaurants[0])
              localStorage.setItem('currentRestaurant', JSON.stringify(userData.restaurants[0]))
            }
          }
        } else if (userData.restaurants?.length > 0) {
          setCurrentRestaurant(userData.restaurants[0])
          localStorage.setItem('currentRestaurant', JSON.stringify(userData.restaurants[0]))
        }
      } else if (error) {
        console.error('Auth init error:', error)
        // Seulement effacer le token pour les vraies erreurs d'authentification
        // (token invalide / expiré), PAS pour les erreurs réseau/serveur
        const msg = error.message || ''
        const isAuthError = msg.includes('Token') || msg.includes('expiré') ||
          msg.includes('invalide') || msg.includes('Non authentifié') ||
          msg.includes('Utilisateur non trouvé')
        if (isAuthError) {
          localStorage.removeItem('token')
          localStorage.removeItem('currentRestaurant')
        }
        // Pour les erreurs réseau : on garde le token, l'utilisateur verra
        // le spinner puis le dashboard une fois le backend disponible
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
