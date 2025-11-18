import { Request, Response, NextFunction } from 'express';

/**
 * Maintenance mode middleware
 * Returns 503 Service Unavailable for public endpoints when maintenance is enabled
 * Allows health checks and auth endpoints to function
 * Supports IP whitelist bypass for development/admin access
 */
export const maintenanceMiddleware = (_req: Request, res: Response, next: NextFunction) => {
  const maintenanceMode = process.env.MAINTENANCE_MODE === 'true';

  if (maintenanceMode) {
    // Check if IP is whitelisted for bypass
    const xForwardedFor = _req.headers['x-forwarded-for'] as string;
    const cfConnectingIp = _req.headers['cf-connecting-ip'] as string;
    const clientIP = cfConnectingIp || 
                     xForwardedFor?.split(',')[0]?.trim() || 
                     _req.socket.remoteAddress || 
                     _req.ip;
    
    const bypassIPs = process.env.MAINTENANCE_BYPASS_IPS?.split(',').map(ip => ip.trim()) || [];
    
    // Debug log (temporary)
    console.log('[MAINTENANCE] Detected IP:', clientIP);
    console.log('[MAINTENANCE] CF-Connecting-IP:', cfConnectingIp);
    console.log('[MAINTENANCE] X-Forwarded-For:', xForwardedFor);
    console.log('[MAINTENANCE] Whitelist IPs:', bypassIPs);
    
    if (bypassIPs.length > 0 && clientIP && bypassIPs.includes(clientIP)) {
      console.log('[MAINTENANCE] IP BYPASS: Allowed for', clientIP);
      return next(); // Bypass maintenance for whitelisted IP
    }

    // Allow health checks to pass through
    if (_req.path.startsWith('/health')) {
      return next();
    }

    // Allow auth endpoints to pass through
    if (_req.path.startsWith('/api/auth')) {
      return next();
    }

    // Allow debug endpoints to pass through
    if (_req.path.startsWith('/api/debug')) {
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
