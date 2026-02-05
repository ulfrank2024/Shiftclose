import jwt from 'jsonwebtoken'
import { supabase } from '../config/supabase.js'

const JWT_SECRET = process.env.JWT_SECRET || 'shiftclose-secret-key-change-in-production'

// Generate JWT Token
export const generateToken = (userId) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' })
}

// Verify JWT Token Middleware
export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Token manquant' })
    }

    const token = authHeader.split('Bearer ')[1]

    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET)

    // Get user data from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', decoded.userId)
      .single()

    if (error || !user) {
      return res.status(404).json({ error: 'Utilisateur non trouvé' })
    }

    // Get user's restaurants
    const { data: userRestaurants } = await supabase
      .from('user_restaurants')
      .select(`
        restaurant_id,
        role,
        restaurants (
          id,
          name
        )
      `)
      .eq('user_id', user.id)

    // Format restaurants array
    user.restaurants = userRestaurants?.map(ur => ({
      id: ur.restaurant_id,
      name: ur.restaurants?.name,
      role: ur.role
    })) || []

    req.user = user

    next()
  } catch (error) {
    console.error('Auth error:', error.message)
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expiré' })
    }
    return res.status(401).json({ error: 'Token invalide' })
  }
}

// Check if user has required role
export const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Non authentifié' })
    }

    // Super admin has access to everything
    if (req.user.role === 'superadmin') {
      return next()
    }

    // Check if user has required role in current restaurant
    const restaurantId = req.params.restaurantId || req.body.restaurantId || req.query.restaurantId

    if (restaurantId) {
      const userRestaurant = req.user.restaurants?.find(r => r.id === restaurantId)
      if (userRestaurant && roles.includes(userRestaurant.role)) {
        req.currentRestaurant = userRestaurant
        return next()
      }
    }

    // Check global role
    if (roles.includes(req.user.role)) {
      return next()
    }

    return res.status(403).json({ error: 'Accès non autorisé' })
  }
}

// Check if user belongs to restaurant
export const requireRestaurantAccess = async (req, res, next) => {
  try {
    const restaurantId = req.params.restaurantId || req.body.restaurantId || req.query.restaurantId

    if (!restaurantId) {
      return res.status(400).json({ error: 'Restaurant ID requis' })
    }

    // Super admin has access to all restaurants
    if (req.user.role === 'superadmin') {
      return next()
    }

    const hasAccess = req.user.restaurants?.some(r => r.id === restaurantId)

    if (!hasAccess) {
      return res.status(403).json({ error: 'Accès au restaurant non autorisé' })
    }

    next()
  } catch (error) {
    console.error('Restaurant access error:', error)
    return res.status(500).json({ error: 'Erreur serveur' })
  }
}
