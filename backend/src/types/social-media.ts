/**
 * Social Media types and utilities
 */

export enum SocialMediaPlatform {
  INSTAGRAM = 'INSTAGRAM',
  YOUTUBE = 'YOUTUBE',
  TIKTOK = 'TIKTOK',
  SHOPEE = 'SHOPEE',
  WHATSAPP = 'WHATSAPP',
  LINKEDIN = 'LINKEDIN',
  TWITTER = 'TWITTER',
  FACEBOOK = 'FACEBOOK',
  TELEGRAM = 'TELEGRAM',
  DISCORD = 'DISCORD',
  TWITCH = 'TWITCH',
  THREADS = 'THREADS',
  BLUESKY = 'BLUESKY',
}

export interface SocialMediaDTO {
  id: string
  platform: string
  handle: string
  url?: string
  createdAt: Date
  updatedAt: Date
}

/**
 * Generate URL for social media platform
 * @param platform - Social media platform
 * @param handle - Username or identifier
 * @returns Full URL for the profile
 */
export function generateSocialMediaUrl(
  platform: string,
  handle: string
): string {
  const urlGenerators: Record<string, (h: string) => string> = {
    [SocialMediaPlatform.INSTAGRAM]: (h) => `https://instagram.com/${h}`,
    [SocialMediaPlatform.YOUTUBE]: (h) =>
      `https://youtube.com/${h.startsWith('@') ? h : '@' + h}`,
    [SocialMediaPlatform.TIKTOK]: (h) => `https://tiktok.com/@${h}`,
    [SocialMediaPlatform.SHOPEE]: (h) => `https://shopee.co.id/${h}`,
    [SocialMediaPlatform.WHATSAPP]: (h) => `https://wa.me/${h.replace(/\D/g, '')}`,
    [SocialMediaPlatform.LINKEDIN]: (h) => `https://linkedin.com/in/${h}`,
    [SocialMediaPlatform.TWITTER]: (h) => `https://twitter.com/${h}`,
    [SocialMediaPlatform.FACEBOOK]: (h) => `https://facebook.com/${h}`,
    [SocialMediaPlatform.TELEGRAM]: (h) => `https://t.me/${h}`,
    [SocialMediaPlatform.DISCORD]: (h) => h,
    [SocialMediaPlatform.TWITCH]: (h) => `https://twitch.tv/${h}`,
    [SocialMediaPlatform.THREADS]: (h) => `https://threads.net/@${h}`,
    [SocialMediaPlatform.BLUESKY]: (h) => `https://bsky.app/profile/${h}`,
  }

  return urlGenerators[platform]?.(handle) || handle
}

/**
 * Get platform icon name for frontend
 */
export function getPlatformIcon(platform: string): string {
  const icons: Record<string, string> = {
    [SocialMediaPlatform.INSTAGRAM]: 'Instagram',
    [SocialMediaPlatform.YOUTUBE]: 'Youtube',
    [SocialMediaPlatform.TIKTOK]: 'Music',
    [SocialMediaPlatform.SHOPEE]: 'ShoppingCart',
    [SocialMediaPlatform.WHATSAPP]: 'MessageCircle',
    [SocialMediaPlatform.LINKEDIN]: 'Briefcase',
    [SocialMediaPlatform.TWITTER]: 'Twitter',
    [SocialMediaPlatform.FACEBOOK]: 'Facebook',
    [SocialMediaPlatform.TELEGRAM]: 'Send',
    [SocialMediaPlatform.DISCORD]: 'MessageSquare',
    [SocialMediaPlatform.TWITCH]: 'Play',
    [SocialMediaPlatform.THREADS]: 'MessageCircle',
    [SocialMediaPlatform.BLUESKY]: 'Cloud',
  }
  return icons[platform] || 'Link'
}

/**
 * Get platform color for styling
 */
export function getPlatformColor(platform: string): string {
  const colors: Record<string, string> = {
    [SocialMediaPlatform.INSTAGRAM]: 'text-pink-600',
    [SocialMediaPlatform.YOUTUBE]: 'text-red-600',
    [SocialMediaPlatform.TIKTOK]: 'text-black dark:text-white',
    [SocialMediaPlatform.SHOPEE]: 'text-orange-600',
    [SocialMediaPlatform.WHATSAPP]: 'text-green-600',
    [SocialMediaPlatform.LINKEDIN]: 'text-blue-600',
    [SocialMediaPlatform.TWITTER]: 'text-blue-400',
    [SocialMediaPlatform.FACEBOOK]: 'text-blue-600',
    [SocialMediaPlatform.TELEGRAM]: 'text-blue-500',
    [SocialMediaPlatform.DISCORD]: 'text-indigo-600',
    [SocialMediaPlatform.TWITCH]: 'text-purple-600',
    [SocialMediaPlatform.THREADS]: 'text-black dark:text-white',
    [SocialMediaPlatform.BLUESKY]: 'text-blue-500',
  }
  return colors[platform] || 'text-gray-600'
}
