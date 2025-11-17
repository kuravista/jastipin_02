/**
 * Social media platform configurations
 */

import {
  Instagram,
  Youtube,
  Music,
  ShoppingCart,
  MessageCircle,
  Briefcase,
  Twitter,
  Facebook,
  Send,
  MessageSquare,
  Play,
  Cloud,
  Link,
} from 'lucide-react'

export interface SocialMediaConfig {
  icon: any
  color: string
  label: string
}

export const socialMediaConfigs: Record<string, SocialMediaConfig> = {
  INSTAGRAM: {
    icon: Instagram,
    color: 'text-pink-600',
    label: 'Instagram',
  },
  YOUTUBE: {
    icon: Youtube,
    color: 'text-red-600',
    label: 'YouTube',
  },
  TIKTOK: {
    icon: Music,
    color: 'text-black dark:text-white',
    label: 'TikTok',
  },
  SHOPEE: {
    icon: ShoppingCart,
    color: 'text-orange-600',
    label: 'Shopee',
  },
  WHATSAPP: {
    icon: MessageCircle,
    color: 'text-green-600',
    label: 'WhatsApp',
  },
  LINKEDIN: {
    icon: Briefcase,
    color: 'text-blue-600',
    label: 'LinkedIn',
  },
  TWITTER: {
    icon: Twitter,
    color: 'text-blue-400',
    label: 'Twitter',
  },
  FACEBOOK: {
    icon: Facebook,
    color: 'text-blue-600',
    label: 'Facebook',
  },
  TELEGRAM: {
    icon: Send,
    color: 'text-blue-500',
    label: 'Telegram',
  },
  DISCORD: {
    icon: MessageSquare,
    color: 'text-indigo-600',
    label: 'Discord',
  },
  TWITCH: {
    icon: Play,
    color: 'text-purple-600',
    label: 'Twitch',
  },
  THREADS: {
    icon: MessageSquare,
    color: 'text-black dark:text-white',
    label: 'Threads',
  },
  BLUESKY: {
    icon: Cloud,
    color: 'text-blue-500',
    label: 'Bluesky',
  },
}

/**
 * Get configuration for a social media platform
 */
export function getSocialMediaConfig(platform: string): SocialMediaConfig {
  return socialMediaConfigs[platform] || { icon: Link, color: 'text-gray-600', label: platform }
}
