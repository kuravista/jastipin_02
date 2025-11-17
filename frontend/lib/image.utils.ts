/**
 * Image utility functions
 */

// List of available product images
export const PRODUCT_IMAGES = [
  '/img/products/product-1.svg',
  '/img/products/product-2.svg',
  '/img/products/product-3.svg',
  '/img/products/product-4.svg',
  '/img/products/product-5.svg',
  '/img/products/product-6.svg',
]

/**
 * Get random product image URL
 * @returns Random image path from PRODUCT_IMAGES array
 */
export function getRandomProductImage(): string {
  const randomIndex = Math.floor(Math.random() * PRODUCT_IMAGES.length)
  return PRODUCT_IMAGES[randomIndex]
}
