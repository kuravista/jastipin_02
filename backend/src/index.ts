/**
 * Express App Entry Point
 * Initializes Express server with middleware and routes
 */

import 'dotenv/config'
import express, { Express } from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import profileRoutes from './routes/profile.js'
import tripRoutes from './routes/trips.js'
import productRoutes from './routes/products.js'
import participantRoutes from './routes/participants.js'
import orderRoutes from './routes/orders.js'
import socialMediaRoutes from './routes/social-media.js'
import shippingRoutes from './routes/shipping.js'
import healthRoutes from './routes/health.js'
import debugRoutes from './routes/debug.js'
import { errorHandler } from './middleware/errorHandler.js'
import { maintenanceMiddleware } from './middleware/maintenance.js'

const app: Express = express()
const PORT = process.env.API_PORT || 4000

// Middleware
app.use(
  express.json({
    limit: '10mb',
  })
)

// Parse CORS origins from comma-separated env var
const corsOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(url => url.trim())

app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)

// Maintenance mode middleware (check before routes)
app.use(maintenanceMiddleware)

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Root endpoint
app.get('/', (_req, res) => {
  res.json({
    message: 'Jastipin.me Backend API',
    version: '1.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    health: '/health',
    health_status: '/health/status',
    docs: 'See README.md for API documentation',
  })
})

// Health routes
app.use('/health', healthRoutes)

// API routes
app.use('/api/auth', authRoutes)
app.use('/api/debug', debugRoutes)
app.use('/api', profileRoutes)
app.use('/api', tripRoutes)
app.use('/api', productRoutes)
app.use('/api', participantRoutes)
app.use('/api', orderRoutes)
app.use('/api', socialMediaRoutes)
app.use('/api', shippingRoutes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: _req.path,
    method: _req.method,
  })
})

// Error handler (must be last)
app.use(errorHandler)

// Start server
const server = app.listen(PORT, () => {
  console.log(
    `Server running on port ${PORT} in ${process.env.NODE_ENV} mode`
  )
})

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  server.close(() => {
    console.log('Server closed')
    process.exit(0)
  })
})

export default app
