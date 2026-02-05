import { Router } from 'express'
import { verifyToken, requireRole } from '../middleware/auth.js'
import {
  getStats,
  getAllRestaurants,
  getAllUsers,
  suspendRestaurant,
  activateRestaurant,
  getPlans
} from '../controllers/adminController.js'

const router = Router()

// All routes require superadmin
router.use(verifyToken)
router.use(requireRole('superadmin'))

// Dashboard stats
router.get('/stats', getStats)

// Restaurants management
router.get('/restaurants', getAllRestaurants)
router.put('/restaurants/:restaurantId/suspend', suspendRestaurant)
router.put('/restaurants/:restaurantId/activate', activateRestaurant)

// Users management
router.get('/users', getAllUsers)

// Plans
router.get('/plans', getPlans)

export default router
