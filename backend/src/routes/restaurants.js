import { Router } from 'express'
import { verifyToken, requireRole, requireRestaurantAccess } from '../middleware/auth.js'
import {
  getMyRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  getTeamMembers,
  getAllRestaurants
} from '../controllers/restaurantController.js'

const router = Router()

// All routes require authentication
router.use(verifyToken)

// Get user's restaurants
router.get('/my', getMyRestaurants)

// Super Admin - get all restaurants
router.get('/all', requireRole('superadmin'), getAllRestaurants)

// Create restaurant (Super Admin or Manager)
router.post('/', requireRole('superadmin', 'manager'), createRestaurant)

// Get specific restaurant
router.get('/:restaurantId', requireRestaurantAccess, getRestaurant)

// Update restaurant (Manager only)
router.put('/:restaurantId', requireRestaurantAccess, requireRole('manager'), updateRestaurant)

// Get team members (Manager only)
router.get('/:restaurantId/team', requireRestaurantAccess, requireRole('manager'), getTeamMembers)

export default router
