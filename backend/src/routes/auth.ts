/**
 * Authentication Routes
 * POST /register - User registration
 * POST /login - User login
 * POST /refresh - Refresh access token
 * POST /logout - User logout
 */

import { Router, Response, Router as ExpressRouter } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../services/auth.service.js'
import { validate } from '../middleware/validate.js'
import {
  registerSchema,
  loginSchema,
} from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router: ExpressRouter = Router()
const db = new PrismaClient()
const authService = new AuthService(db)

/**
 * POST /register
 * Register new user with email and password
 */
router.post('/register', validate(registerSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password, fullName } = req.body
    const result = await authService.register(email, password, fullName)

    // Set refresh token as httpOnly cookie
    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    res.status(201).json({
      user: result.user,
      token: result.token,
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Registration failed'
    res.status(status).json({ error: message })
  }
})

/**
 * POST /login
 * Authenticate user with email and password
 */
router.post('/login', validate(loginSchema), async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)

    res.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    })

    res.json({
      user: result.user,
      token: result.token,
    })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Login failed'
    res.status(status).json({ error: message })
  }
})

/**
 * POST /refresh
 * Get new access token using refresh token from cookie
 */
router.post('/refresh', async (req: AuthRequest, res: Response) => {
  try {
    const refreshToken =
      req.body.refreshToken || req.cookies.refreshToken

    if (!refreshToken) {
      res.status(401).json({ error: 'Refresh token not provided' })
      return
    }

    const result = await authService.refreshAccessToken(refreshToken)
    res.json({ token: result.token })
  } catch (error: any) {
    const status = error.status || 500
    const message = error.message || 'Token refresh failed'
    res.status(status).json({ error: message })
  }
})

/**
 * POST /logout
 * Clear refresh token cookie
 */
router.post('/logout', async (_req: AuthRequest, res: Response) => {
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  })
  res.json({ message: 'Logged out successfully' })
})

/**
 * GET /check-username/:username
 * Check if username is available
 */
router.get('/check-username/:username', async (req: AuthRequest, res: Response) => {
  try {
    const { username } = req.params

    // Validate username format (alphanumeric, dash, underscore only)
    const usernameRegex = /^[a-z0-9_-]+$/
    if (!usernameRegex.test(username)) {
      res.status(400).json({
        error: 'Username hanya boleh mengandung huruf kecil, angka, dash (-) dan underscore (_)',
        available: false
      })
      return
    }

    // Check if username length is valid (3-30 characters)
    if (username.length < 3 || username.length > 30) {
      res.status(400).json({
        error: 'Username harus antara 3-30 karakter',
        available: false
      })
      return
    }

    // Check if username exists in database
    const existingUser = await db.user.findUnique({
      where: { slug: username },
      select: { id: true, slug: true }
    })

    if (existingUser) {
      res.json({
        available: false,
        message: `Username "${username}" sudah digunakan`,
        username: username
      })
    } else {
      res.json({
        available: true,
        message: `Username "${username}" tersedia!`,
        username: username
      })
    }
  } catch (error: any) {
    res.status(500).json({
      error: 'Gagal memeriksa username',
      available: false
    })
  }
})

export default router
