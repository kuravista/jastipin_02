/**
 * Cart Event Utilities
 * Handles cross-component cart state synchronization using localStorage and custom events
 */

export const CART_UPDATED_EVENT = 'jastipin-cart-updated'

export interface CartProduct {
  id: string
  title: string
  price: number
  image?: string
  tripId: string
  slug?: string
  type?: string
  unit?: string
}

export interface CartItem {
  product: CartProduct
  quantity: number
}

export interface CartUpdateDetail {
  tripId: string
  items: CartItem[]
}

/**
 * Dispatch cart update event and save to localStorage
 * @param tripId - Trip ID for the cart
 * @param items - Cart items array
 */
export function dispatchCartUpdate(tripId: string, items: CartItem[]): void {
  localStorage.setItem(`cart_${tripId}`, JSON.stringify(items))
  window.dispatchEvent(
    new CustomEvent<CartUpdateDetail>(CART_UPDATED_EVENT, {
      detail: { tripId, items },
    })
  )
}

/**
 * Get cart items from localStorage
 * @param tripId - Trip ID for the cart
 * @returns Cart items array
 */
export function getCartItems(tripId: string): CartItem[] {
  if (typeof window === 'undefined') return []
  const stored = localStorage.getItem(`cart_${tripId}`)
  return stored ? JSON.parse(stored) : []
}

/**
 * Add item to cart and dispatch update event
 * @param tripId - Trip ID for the cart
 * @param product - Product to add
 * @returns Updated cart items
 */
export function addToCartItem(tripId: string, product: CartProduct): CartItem[] {
  const items = getCartItems(tripId)
  const existing = items.find((item) => item.product.id === product.id)

  if (existing) {
    existing.quantity += 1
  } else {
    items.push({ product, quantity: 1 })
  }

  dispatchCartUpdate(tripId, items)
  return items
}

/**
 * Remove item from cart
 * @param tripId - Trip ID for the cart
 * @param productId - Product ID to remove
 * @returns Updated cart items
 */
export function removeFromCartItem(tripId: string, productId: string): CartItem[] {
  const items = getCartItems(tripId).filter((item) => item.product.id !== productId)
  dispatchCartUpdate(tripId, items)
  return items
}

/**
 * Update item quantity in cart
 * @param tripId - Trip ID for the cart
 * @param productId - Product ID to update
 * @param quantity - New quantity
 * @returns Updated cart items
 */
export function updateCartItemQuantity(
  tripId: string,
  productId: string,
  quantity: number
): CartItem[] {
  if (quantity <= 0) {
    return removeFromCartItem(tripId, productId)
  }

  const items = getCartItems(tripId).map((item) =>
    item.product.id === productId ? { ...item, quantity } : item
  )
  dispatchCartUpdate(tripId, items)
  return items
}
