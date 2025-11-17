/**
 * Authentication Routes
 * POST /register - User registration
 * POST /login - User login
 * POST /refresh - Refresh access token
 * POST /logout - User logout
 */

import { Router, Response } from 'express'
import { PrismaClient } from '@prisma/client'
import { AuthService } from '../services/auth.service.js'
import { validate } from '../middleware/validate.js'
import {
  registerSchema,
  loginSchema,
} from '../utils/validators.js'
import { AuthRequest } from '../types/index.js'

const router = Router()
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
      sameSite: 'strict',
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
      sameSite: 'strict',
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
    sameSite: 'strict',
  })
  res.json({ message: 'Logged out successfully' })
})

export default router
