import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle maintenance mode
 * 
 * Redirects all requests to /maintenance when MAINTENANCE_MODE=true
 * Supports IP whitelist bypass for development/admin access
 * Whitelists:
 * - Static assets (_next, public files)
 * - Maintenance page itself
 * - API routes (for backend calls)
 * - Health check endpoint
 * - Whitelisted IPs (bypass maintenance)
 */
export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip static assets and internal Next.js routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api/') ||
    pathname.includes('.') || // Files like favicon.ico
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next();
  }

  // Skip maintenance page itself
  if (pathname === '/maintenance') {
    return NextResponse.next();
  }

  // Check maintenance mode from environment
  // Note: Using NEXT_PUBLIC_ prefix because middleware runs at edge (needs build-time access)
  const maintenanceMode = process.env.NEXT_PUBLIC_MAINTENANCE_MODE === 'true';

  if (maintenanceMode) {
    // Check if IP is whitelisted for bypass
    const cfConnectingIp = request.headers.get('cf-connecting-ip');
    const xForwardedFor = request.headers.get('x-forwarded-for');
    const clientIP = cfConnectingIp || 
                     xForwardedFor?.split(',')[0]?.trim() || 
                     request.ip;
    
    const bypassIPs = process.env.NEXT_PUBLIC_BYPASS_IPS?.split(',').map(ip => ip.trim()) || [];
    
    // Debug log (will appear in build logs, not runtime)
    console.log('[FRONTEND MAINTENANCE] Detected IP:', clientIP);
    console.log('[FRONTEND MAINTENANCE] CF-Connecting-IP:', cfConnectingIp);
    console.log('[FRONTEND MAINTENANCE] Whitelist:', bypassIPs);
    
    if (bypassIPs.length > 0 && clientIP && bypassIPs.includes(clientIP)) {
      console.log('[FRONTEND MAINTENANCE] IP BYPASS: Allowed for', clientIP);
      return NextResponse.next(); // Bypass maintenance for whitelisted IP
    }

    // Redirect to maintenance page
    return NextResponse.rewrite(
      new URL('/maintenance', request.url)
    );
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
