import { Request, Response, NextFunction } from 'express';

/**
 * Maintenance mode middleware
 * Returns 503 Service Unavailable for public endpoints when maintenance is enabled
 * Allows health checks and auth endpoints to function
 */
export const maintenanceMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (maintenanceMode) {
    // Allow health checks to pass through
    if (_req.path.startsWith('/health')) {
      return next();
    }

    // Allow auth endpoints to pass through
    if (_req.path.startsWith('/api/auth')) {
      return next();
    }

    // Block all other public endpoints with 503
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'The server is currently undergoing maintenance. Please try again later.',
      timestamp: new Date().toISOString(),
    });
  }

  next();
};
