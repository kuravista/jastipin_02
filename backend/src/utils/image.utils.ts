/**
 * Image utility functions
 */

// List of available trip images in public folder
export const TRIP_IMAGES = [
  '/img/trips/trip-1.svg',
  '/img/trips/trip-2.svg',
  '/img/trips/trip-3.svg',
  '/img/trips/trip-4.svg',
  '/img/trips/trip-5.svg',
  '/img/trips/trip-6.svg',
]

// List of available avatar images in public folder
export const AVATAR_IMAGES = [
  '/img/avatars/avatar-1.svg',
  '/img/avatars/avatar-2.svg',
  '/img/avatars/avatar-3.svg',
  '/img/avatars/avatar-4.svg',
  '/img/avatars/avatar-5.svg',
  '/img/avatars/avatar-6.svg',
  '/img/avatars/avatar-7.svg',
  '/img/avatars/avatar-8.svg',
  '/img/avatars/avatar-9.svg',
  '/img/avatars/avatar-10.svg',
]

/**
 * Get random trip image URL
 * @returns Random image path from TRIP_IMAGES array
 */
export function getRandomTripImage(): string {
  const randomIndex = Math.floor(Math.random() * TRIP_IMAGES.length)
  return TRIP_IMAGES[randomIndex]
}

/**
 * Get random avatar image URL
 * @returns Random image path from AVATAR_IMAGES array
 */
export function getRandomAvatar(): string {
  const randomIndex = Math.floor(Math.random() * AVATAR_IMAGES.length)
  return AVATAR_IMAGES[randomIndex]
}

/**
 * Generate slug from full name
 * - Convert to lowercase
 * - Remove extra spaces
 * - Replace spaces with hyphens
 * - Take first 2 words if more than 2
 * @param fullName - User full name
 * @returns Generated slug
 */
export function generateSlugFromName(fullName: string): string {
  return fullName
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join('-')
}
