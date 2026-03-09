import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'
// Load environment variables
dotenv.config()

// Import routes
import authRoutes from './routes/auth.js'
import restaurantRoutes from './routes/restaurants.js'
import reportRoutes from './routes/reports.js'
import invitationRoutes from './routes/invitations.js'
import adminRoutes from './routes/admin.js'
import payPeriodRoutes from './routes/payPeriods.js'

const app = express()
const PORT = process.env.PORT || 5000

// ── CORS — doit être configuré AVANT helmet et tout le reste ──
// Supporte plusieurs URLs séparées par des virgules dans FRONTEND_URL
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://cheftips.app',
  'https://www.cheftips.app',
  ...(process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map(u => u.trim()).filter(Boolean)
    : [])
].filter((v, i, a) => v && a.indexOf(v) === i) // déduplique

const corsOptions = {
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (apps mobiles, PWA, curl)
    if (!origin) return callback(null, true)
    if (allowedOrigins.includes(origin)) return callback(null, true)
    // En dev, tout autoriser
    if (process.env.NODE_ENV === 'development') return callback(null, true)
    console.warn('CORS blocked:', origin)
    return callback(null, false) // retourner false au lieu d'une Error
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200 // certains navigateurs (IE11) n'acceptent pas 204
}

// Répondre aux preflight OPTIONS sur TOUTES les routes
app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

// Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'ShiftClose API'
  })
})

// API Routes
app.use('/api/auth', authRoutes)
app.use('/api/restaurants', restaurantRoutes)
app.use('/api/reports', reportRoutes)
app.use('/api/invitations', invitationRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/pay-periods', payPeriodRoutes)

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route non trouvée' })
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Erreur serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Start server seulement en développement local (pas sur Vercel serverless)
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════╗
  ║                                           ║
  ║   ShiftClose API Server                   ║
  ║   Running on http://localhost:${PORT}        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
  ║                                           ║
  ╚═══════════════════════════════════════════╝
  `)
  })
}

export default app
