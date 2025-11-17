/**
 * Runtime Configuration
 * Gets API URL from window location or falls back to environment variable
 */

export function getApiUrl(): string {
  // In production, use the same domain as the current page
  if (typeof window !== "undefined") {
    const protocol = window.location.protocol
    const host = window.location.host
    // Use the same domain, accessing /api proxy on Nginx
    return `${protocol}//${host}/api`
  }

  // Fallback for SSR/build time
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api"
}
