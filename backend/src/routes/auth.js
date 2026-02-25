import { Router } from 'express'
import multer from 'multer'
import { verifyToken, requireRole } from '../middleware/auth.js'
import {
  register,
  registerEmployee,
  login,
  getProfile,
  updateProfile,
  changePassword,
  uploadPhoto,
  getAllUsers,
  forgotPassword,
  resetPassword,
  setupSuperAdmin
} from '../controllers/authController.js'

const router = Router()

// Multer: memory storage, images only, max 5MB
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Seules les images sont autorisées'))
  }
})

// Public routes
router.post('/register', register)
router.post('/register-employee', registerEmployee)
router.post('/login', login)
router.post('/forgot-password', forgotPassword)
router.post('/reset-password', resetPassword)
router.post('/setup', setupSuperAdmin)

// Protected routes
router.get('/profile', verifyToken, getProfile)
router.put('/profile', verifyToken, updateProfile)
router.put('/password', verifyToken, changePassword)
router.post('/photo', verifyToken, upload.single('photo'), uploadPhoto)

// Super Admin routes
router.get('/users', verifyToken, requireRole('superadmin'), getAllUsers)

export default router
