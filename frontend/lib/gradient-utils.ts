/**
 * Gradient utility functions for generating random gradients
 */

export interface GradientColors {
  from: string
  to: string
  className: string
}

// Predefined color gradient combinations
const GRADIENT_COMBINATIONS: GradientColors[] = [
  { from: '#FF6B6B', to: '#FFA500', className: 'from-red-500 to-orange-500' },
  { from: '#FF8C42', to: '#FF6348', className: 'from-orange-500 to-red-500' },
  { from: '#A8E6CF', to: '#56AB2F', className: 'from-emerald-400 to-green-600' },
  { from: '#FFD93D', to: '#FF8B61', className: 'from-yellow-400 to-orange-500' },
  { from: '#6BCB77', to: '#4D96FF', className: 'from-green-500 to-blue-500' },
  { from: '#4D96FF', to: '#6BCB77', className: 'from-blue-500 to-green-500' },
  { from: '#FF61D2', to: '#FE5196', className: 'from-pink-500 to-rose-500' },
  { from: '#667EEA', to: '#764BA2', className: 'from-indigo-500 to-purple-600' },
  { from: '#764BA2', to: '#667EEA', className: 'from-purple-600 to-indigo-500' },
  { from: '#FA8BFF', to: '#2BD2FF', className: 'from-pink-500 to-cyan-400' },
  { from: '#2BD2FF', to: '#2BFF88', className: 'from-cyan-400 to-emerald-400' },
  { from: '#F12711', to: '#F5AF19', className: 'from-red-600 to-amber-400' },
  { from: '#00B4DB', to: '#0083B0', className: 'from-cyan-500 to-blue-700' },
  { from: '#FF69B4', to: '#FF1493', className: 'from-pink-500 to-pink-600' },
  { from: '#00D2D3', to: '#928DAB', className: 'from-cyan-500 to-purple-400' },
]

/**
 * Get a random gradient by seed (generates consistent gradient for same seed)
 * @param seed - String seed value (e.g., user slug or ID)
 * @returns Gradient colors and tailwind className
 */
export function getGradientBySeed(seed: string): GradientColors {
  // Generate a consistent index based on seed
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32bit integer
  }

  const index = Math.abs(hash) % GRADIENT_COMBINATIONS.length
  return GRADIENT_COMBINATIONS[index]
}

/**
 * Generate a random gradient
 * @returns Random gradient colors and tailwind className
 */
export function getRandomGradient(): GradientColors {
  const index = Math.floor(Math.random() * GRADIENT_COMBINATIONS.length)
  return GRADIENT_COMBINATIONS[index]
}

/**
 * Convert hex to RGB for inline styles
 * @param hex - Hex color string
 * @returns RGB values as string
 */
export function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0, 0, 0'
  return `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
}
