import { Router } from 'express'
import { verifyToken, requireRole } from '../middleware/auth.js'
import {
  getProfile,
  updateProfile,
  createUser,
  getAllUsers
} from '../controllers/authController.js'

const router = Router()

// Public route - create user after Firebase signup
router.post('/users', createUser)

// Protected routes
router.get('/profile', verifyToken, getProfile)
router.put('/profile', verifyToken, updateProfile)

// Super Admin routes
router.get('/users', verifyToken, requireRole('superadmin'), getAllUsers)

export default router
