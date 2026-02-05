import { createContext, useContext, useState, useEffect } from 'react'
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

  const refreshUser = async () => {
    try {
      const { user: userData } = await authAPI.getProfile()
      setUser(userData)
      return userData
    } catch (error) {
      console.error('Refresh user error:', error)
      logout()
    }
  }

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
