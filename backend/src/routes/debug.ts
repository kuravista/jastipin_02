import { Router, Request, Response } from 'express';

const router: Router = Router();

/**
 * Debug endpoint to check detected IP
 * GET /api/debug/ip
 */
router.get('/ip', (req: Request, res: Response) => {
  const xForwardedFor = req.headers['x-forwarded-for'] as string;
  const cfConnectingIp = req.headers['cf-connecting-ip'] as string;
  const clientIP = cfConnectingIp || 
                   xForwardedFor?.split(',')[0]?.trim() || 
                   req.socket.remoteAddress || 
                   req.ip;
  
  const bypassIPs = process.env.MAINTENANCE_BYPASS_IPS?.split(',').map(ip => ip.trim()) || [];
  const isWhitelisted = bypassIPs.includes(clientIP || '');

  res.json({
    detectedIP: clientIP,
    cfConnectingIp: cfConnectingIp || null,
    xForwardedFor: xForwardedFor || null,
    socketRemoteAddress: req.socket.remoteAddress || null,
    reqIp: req.ip || null,
    whitelistIPs: bypassIPs,
    isWhitelisted,
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true',
    headers: {
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'cf-connecting-ip': req.headers['cf-connecting-ip'],
      'x-real-ip': req.headers['x-real-ip'],
    }
  });
});

export default router;
