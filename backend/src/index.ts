/**
 * Express App Entry Point
 * Initializes Express server with middleware and routes
 */

import 'dotenv/config'
import express, { Express } from 'express'
import cors from 'cors'
import helmet from 'helmet'

import authRoutes from './routes/auth.js'
import passwordRoutes from './routes/password.js'
import profileRoutes from './routes/profile.js'
import onboardingRoutes from './routes/onboarding.js'
import bankAccountsRoutes from './routes/bank-accounts.js'
import tripRoutes from './routes/trips.js'
import productRoutes from './routes/products.js'
import participantRoutes from './routes/participants.js'
import orderRoutes from './routes/orders.js'
import socialMediaRoutes from './routes/social-media.js'
import shippingRoutes from './routes/shipping.js'
import healthRoutes from './routes/health.js'
import debugRoutes from './routes/debug.js'
import locationsRoutes from './routes/locations.js'
import checkoutRoutes from './routes/checkout.js'
import monitoringRoutes from './routes/monitoring.js'
import webhooksRoutes from './routes/webhooks.js'
import workersRoutes from './routes/workers.js'
import uploadRoutes from './routes/upload.js'
import imagesRoutes from './routes/images.js'
import analyticsRoutes from './routes/analytics.js'
import { errorHandler } from './middleware/errorHandler.js'
import { maintenanceMiddleware } from './middleware/maintenance.js'

const app: Express = express()
const PORT = process.env.API_PORT || 4000

// Middleware
// Parse JSON for most routes
app.use((req, res, next) => {
  // Skip body parsing ONLY for multipart file upload endpoints (with CUID orderId format)
  // Allow JSON parsing for /api/upload/validate and /api/upload/verify
  if (req.path.includes('/api/images/upload') || req.path.match(/\/api\/upload\/cm[a-z0-9]{23}$/)) {
    return next()
  }
  express.json({ limit: '10mb' })(req, res, next)
})

// Serve uploaded files (static)
app.use('/uploads', express.static('uploads'))

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

// Security headers with helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
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
app.use('/api/auth', passwordRoutes)
app.use('/api/debug', debugRoutes)
app.use('/api/locations', locationsRoutes)
app.use('/api/checkout', checkoutRoutes)
app.use('/api/monitoring', monitoringRoutes)
app.use('/api/webhooks', webhooksRoutes)
app.use('/api/workers', workersRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/images', imagesRoutes)
app.use('/api/analytics', analyticsRoutes)
app.use('/api', profileRoutes)
app.use('/api', onboardingRoutes)
app.use('/api', bankAccountsRoutes)
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
