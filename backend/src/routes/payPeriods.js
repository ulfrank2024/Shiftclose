import { Router } from 'express'
import { verifyToken, requireRole, requireRestaurantAccess } from '../middleware/auth.js'
import {
  getCurrentPeriod,
  createPeriod,
  listPeriods,
  updatePeriod,
  closePeriod,
  launchPeriod,
  getPeriodSummary,
  recalculatePeriod
} from '../controllers/payPeriodController.js'

const router = Router()

// Toutes les routes nécessitent une authentification
router.use(verifyToken)

// GET  /api/pay-periods/:restaurantId/current  → Période active
router.get('/:restaurantId/current', requireRestaurantAccess, getCurrentPeriod)

// GET  /api/pay-periods/:restaurantId          → Liste toutes les périodes
router.get('/:restaurantId', requireRestaurantAccess, listPeriods)

// POST /api/pay-periods/:restaurantId          → Créer une période (manager)
router.post('/:restaurantId', requireRole('manager'), createPeriod)

// GET  /api/pay-periods/:restaurantId/:periodId/summary → Résumé (manager)
router.get('/:restaurantId/:periodId/summary', requireRole('manager'), getPeriodSummary)

// PUT  /api/pay-periods/:restaurantId/recalculate       → Recalculer la période active (manager)
router.put('/:restaurantId/recalculate', requireRole('manager'), recalculatePeriod)

// PUT  /api/pay-periods/:restaurantId/:periodId/launch  → Lancer une période planifiée (manager)
router.put('/:restaurantId/:periodId/launch', requireRole('manager'), launchPeriod)

// PUT  /api/pay-periods/:restaurantId/:periodId/close   → Clôturer (manager)
router.put('/:restaurantId/:periodId/close', requireRole('manager'), closePeriod)

// PUT  /api/pay-periods/:restaurantId/:periodId          → Ajuster les dates (manager)
router.put('/:restaurantId/:periodId', requireRole('manager'), updatePeriod)

export default router
