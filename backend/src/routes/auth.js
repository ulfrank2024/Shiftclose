import { Router } from 'express'
import { verifyToken, requireRole } from '../middleware/auth.js'
import {
  register,
  registerEmployee,
  login,
  getProfile,
  updateProfile,
  changePassword,
  getAllUsers
} from '../controllers/authController.js'

const router = Router()

// Public routes
router.post('/register', register)
router.post('/register-employee', registerEmployee)
router.post('/login', login)

// Protected routes
router.get('/profile', verifyToken, getProfile)
router.put('/profile', verifyToken, updateProfile)
router.put('/password', verifyToken, changePassword)

// Super Admin routes
router.get('/users', verifyToken, requireRole('superadmin'), getAllUsers)

export default router
