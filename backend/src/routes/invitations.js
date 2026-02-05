import { Router } from 'express'
import { verifyToken, requireRole, requireRestaurantAccess } from '../middleware/auth.js'
import {
  sendInvitation,
  acceptInvitation,
  getInvitationInfo,
  getPendingInvitations,
  cancelInvitation
} from '../controllers/inviteController.js'

const router = Router()

// Public route - get invitation info for preview
router.get('/info/:token', getInvitationInfo)

// Protected routes
router.use(verifyToken)

// Accept invitation
router.post('/accept/:token', acceptInvitation)

// Send invitation (Manager only)
router.post('/:restaurantId', requireRestaurantAccess, requireRole('manager'), sendInvitation)

// Get pending invitations (Manager only)
router.get('/:restaurantId', requireRestaurantAccess, requireRole('manager'), getPendingInvitations)

// Cancel invitation (Manager only)
router.delete('/:invitationId', requireRole('manager'), cancelInvitation)

export default router
