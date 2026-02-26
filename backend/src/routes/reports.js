import { Router } from 'express'
import { verifyToken, requireRole, requireRestaurantAccess } from '../middleware/auth.js'
import {
  createReport,
  getReports,
  getReport,
  validateReport,
  getDashboardStats,
  getMyReceivedTips
} from '../controllers/reportController.js'

const router = Router()

// All routes require authentication
router.use(verifyToken)

// Dashboard stats
router.get('/:restaurantId/stats', requireRestaurantAccess, getDashboardStats)

// Get my received tips (for commis, bartenders, etc.)
router.get('/:restaurantId/my-tips', requireRestaurantAccess, getMyReceivedTips)

// Get reports for restaurant
router.get('/:restaurantId', requireRestaurantAccess, getReports)

// Create new report
router.post('/:restaurantId', requireRestaurantAccess, createReport)

// Get single report
router.get('/detail/:reportId', getReport)

// Validate/reject report (Manager only)
router.put('/:reportId/validate', requireRole('manager'), validateReport)

export default router
