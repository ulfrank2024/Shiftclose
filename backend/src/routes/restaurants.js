import { Router } from 'express'
import { verifyToken, requireRole, requireRestaurantAccess } from '../middleware/auth.js'
import {
  getMyRestaurants,
  getRestaurant,
  createRestaurant,
  updateRestaurant,
  getTeamMembers,
  getAllRestaurants,
  removeTeamMember,
  updateTeamMemberRole,
  updateCashoutPermission
} from '../controllers/restaurantController.js'
import {
  getPendingDeletionRequests,
  approveDeletion,
  rejectDeletion
} from '../controllers/deletionController.js'

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

// Get team members (tous les membres du restaurant — le serveur en a besoin pour les distributions)
router.get('/:restaurantId/team', requireRestaurantAccess, getTeamMembers)

// Remove team member (Manager only)
router.delete('/:restaurantId/team/:userId', requireRestaurantAccess, requireRole('manager'), removeTeamMember)

// Update team member role (Manager only)
router.put('/:restaurantId/team/:userId/role', requireRestaurantAccess, requireRole('manager'), updateTeamMemberRole)

// Update cashout permission (Manager only)
router.put('/:restaurantId/team/:userId/cashout', requireRestaurantAccess, requireRole('manager'), updateCashoutPermission)

// Deletion requests (Manager side)
router.get('/:restaurantId/deletion-requests', requireRestaurantAccess, requireRole('manager'), getPendingDeletionRequests)
router.put('/:restaurantId/deletion-requests/:requestId/approve', requireRestaurantAccess, requireRole('manager'), approveDeletion)
router.put('/:restaurantId/deletion-requests/:requestId/reject', requireRestaurantAccess, requireRole('manager'), rejectDeletion)

export default router
