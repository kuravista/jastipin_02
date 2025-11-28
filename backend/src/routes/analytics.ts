/**
 * Analytics Routes
 * GET /analytics/dashboard - Get dashboard analytics and alerts
 * GET /analytics/monthly - Get monthly analytics
 * GET /analytics/alerts - Get dashboard alerts
 */

import { Router, Response } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { AuthRequest } from '../types/index.js';
import { analyticsService } from '../services/analytics.service.js';

const router = Router();

/**
 * GET /analytics/dashboard
 * Get complete dashboard data (analytics + alerts)
 */
router.get('/dashboard', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const data = await analyticsService.getDashboardData(userId);

    res.json({
      success: true,
      data
    });
  } catch (error: any) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard analytics',
      message: error.message
    });
  }
});

/**
 * GET /analytics/monthly
 * Get monthly analytics only
 */
router.get('/monthly', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const analytics = await analyticsService.getMonthlyAnalytics(userId);

    res.json({
      success: true,
      data: analytics
    });
  } catch (error: any) {
    console.error('Error fetching monthly analytics:', error);
    res.status(500).json({
      error: 'Failed to fetch monthly analytics',
      message: error.message
    });
  }
});

/**
 * GET /analytics/alerts
 * Get dashboard alerts only
 */
router.get('/alerts', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const alerts = await analyticsService.getDashboardAlerts(userId);

    res.json({
      success: true,
      data: alerts
    });
  } catch (error: any) {
    console.error('Error fetching dashboard alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard alerts',
      message: error.message
    });
  }
});

export default router;
