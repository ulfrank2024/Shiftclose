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

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}))
app.use(morgan('dev'))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

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

// Start server
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

export default app
