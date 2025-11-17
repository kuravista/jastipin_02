/**
 * Frontend Test Utilities
 * Provides helper functions and mock providers for testing
 */

import React, { ReactElement } from 'react'
import { render, RenderOptions } from '@testing-library/react'

/**
 * Mock context provider for authentication
 */
interface MockAuthContextValue {
  isAuthenticated: boolean
  loading: boolean
  user?: any
  login?: (email: string, password: string) => Promise<void>
  logout?: () => Promise<void>
  register?: (email: string, password: string, name: string) => Promise<void>
}

export const createMockAuthContext = (
  overrides?: Partial<MockAuthContextValue>
): MockAuthContextValue => ({
  isAuthenticated: false,
  loading: false,
  user: null,
  ...overrides,
})

/**
 * Wrapper with all providers for testing
 */
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  return <>{children}</>
}

/**
 * Custom render function that includes providers
 */
export const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options })

export * from '@testing-library/react'
export { customRender as render }

/**
 * Mock localStorage
 */
export const mockLocalStorage = () => {
  const store: Record<string, string> = {}

  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString()
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key]
    }),
    clear: jest.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
  }
}

/**
 * Mock API responses
 */
export const mockApiResponses = {
  loginSuccess: {
    status: 200,
    data: {
      user: {
        id: '123',
        email: 'test@example.com',
        slug: 'test',
        profileName: 'Test User',
      },
      token: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  },
  loginFailure: {
    status: 401,
    data: { error: 'Invalid credentials' },
  },
  registerSuccess: {
    status: 201,
    data: {
      user: {
        id: '123',
        email: 'newuser@example.com',
        slug: 'newuser',
        profileName: 'New User',
      },
      token: 'mock-access-token',
      refreshToken: 'mock-refresh-token',
    },
  },
  getUserProfile: {
    status: 200,
    data: {
      id: '123',
      email: 'test@example.com',
      slug: 'test',
      profileName: 'Test User',
      profileBio: 'Test bio',
      avatar: 'https://example.com/avatar.jpg',
      coverImage: 'https://example.com/cover.jpg',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    },
  },
  getTrips: {
    status: 200,
    data: [
      {
        id: 'trip-1',
        slug: 'bali-trip',
        title: 'Bali Trip',
        description: 'Trip to Bali',
        jastiperId: '123',
        isActive: true,
        createdAt: '2025-01-01T00:00:00Z',
        _count: { participants: 5, products: 10, orders: 20 },
      },
    ],
  },
  getProducts: {
    status: 200,
    data: [
      {
        id: 'product-1',
        slug: 'shoes',
        name: 'Limited Edition Shoes',
        price: 150000,
        stock: 10,
        description: 'Awesome shoes',
        image: 'https://example.com/shoes.jpg',
        category: 'Fashion',
        tripId: 'trip-1',
        createdAt: '2025-01-01T00:00:00Z',
        _count: { orders: 5 },
      },
    ],
  },
  getOrders: {
    status: 200,
    data: [
      {
        id: 'order-1',
        participantId: 'participant-1',
        productId: 'product-1',
        quantity: 2,
        totalPrice: 300000,
        status: 'PENDING',
        notes: 'Test order',
        createdAt: '2025-01-01T00:00:00Z',
      },
    ],
  },
}

/**
 * Wait for async operations
 */
export const waitForAsync = () =>
  new Promise(resolve => setTimeout(resolve, 0))
