import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware to handle maintenance mode
 * 
 * Redirects all requests to /maintenance when MAINTENANCE_MODE=true
 * Whitelists:
 * - Static assets (_next, public files)
 * - Maintenance page itself
 * - API routes (for backend calls)
 * - Health check endpoint
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
