import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentRestaurant, setCurrentRestaurant] = useState(null)

  useEffect(() => {
    // Check for saved session
    const savedUser = localStorage.getItem('user')
    const savedRestaurant = localStorage.getItem('currentRestaurant')

    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedRestaurant) {
      setCurrentRestaurant(JSON.parse(savedRestaurant))
    }
    setLoading(false)
  }, [])

  const login = async (email, password) => {
    // TODO: Implement Firebase auth
    // For now, simulate login
    const mockUser = {
      id: '1',
      email,
      firstName: 'Utilisateur',
      lastName: 'Test',
      role: email.includes('admin') ? 'superadmin' : email.includes('manager') ? 'manager' : 'server',
      restaurants: [
        { id: 'r1', name: 'Jimmies Pizza', role: 'manager' },
        { id: 'r2', name: 'Le Bistro', role: 'server' }
      ]
    }

    setUser(mockUser)
    localStorage.setItem('user', JSON.stringify(mockUser))

    // Set default restaurant
    if (mockUser.restaurants.length > 0) {
      setCurrentRestaurant(mockUser.restaurants[0])
      localStorage.setItem('currentRestaurant', JSON.stringify(mockUser.restaurants[0]))
    }

    return mockUser
  }

  const logout = () => {
    setUser(null)
    setCurrentRestaurant(null)
    localStorage.removeItem('user')
    localStorage.removeItem('currentRestaurant')
  }

  const switchRestaurant = (restaurant) => {
    setCurrentRestaurant(restaurant)
    localStorage.setItem('currentRestaurant', JSON.stringify(restaurant))
  }

  const value = {
    user,
    loading,
    currentRestaurant,
    login,
    logout,
    switchRestaurant,
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
