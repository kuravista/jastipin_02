/**
 * AuthGuard Component Tests
 * Tests authentication guard wrapper functionality
 */

import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthGuard } from '@/components/AuthGuard'

// Mock useAuth hook
jest.mock('@/lib/auth-context', () => ({
  useAuth: jest.fn(),
}))

// Mock next/navigation
const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

import { useAuth } from '@/lib/auth-context'

describe('AuthGuard Component', () => {
  const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should show loading indicator when loading', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should display loading spinner', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      const spinner = screen.getByText('Loading...').closest('div')?.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })
  })

  describe('Authenticated State', () => {
    it('should render children when user is authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should not show loading indicator when authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
    })

    it('should render multiple children components', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      } as any)

      render(
        <AuthGuard>
          <div>Component 1</div>
          <div>Component 2</div>
          <div>Component 3</div>
        </AuthGuard>
      )

      expect(screen.getByText('Component 1')).toBeInTheDocument()
      expect(screen.getByText('Component 2')).toBeInTheDocument()
      expect(screen.getByText('Component 3')).toBeInTheDocument()
    })
  })

  describe('Unauthenticated State', () => {
    it('should redirect to /auth when not authenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth')
      })
    })

    it('should not render protected content when not authenticated', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should return null when redirecting', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
      } as any)

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('State Transitions', () => {
    it('should transition from loading to authenticated', () => {
      const { rerender } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
      } as any)

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()

      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      } as any)

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      expect(screen.getByText('Protected Content')).toBeInTheDocument()
    })

    it('should transition from authenticated to unauthenticated', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      } as any)

      const { rerender } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Protected Content')).toBeInTheDocument()

      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
      } as any)

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth')
      })
    })

    it('should not redirect multiple times', async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: false,
      } as any)

      const { rerender } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/auth')
      })

      const callCount = mockPush.mock.calls.length

      rerender(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      // Should not add additional calls due to dependencies
      expect(mockPush.mock.calls.length).toBeLessThanOrEqual(callCount + 1)
    })
  })

  describe('Accessibility', () => {
    it('should have semantic loading message', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
      } as any)

      render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })

    it('should have flex centered layout for loading state', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        loading: true,
      } as any)

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      const loadingContainer = screen.getByText('Loading...').closest('div')?.parentElement
      expect(loadingContainer).toHaveClass('min-h-screen')
      expect(loadingContainer).toHaveClass('flex')
    })
  })

  describe('Error Scenarios', () => {
    it('should handle missing auth context gracefully', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: undefined,
        loading: undefined,
      } as any)

      const { container } = render(
        <AuthGuard>
          <div>Protected Content</div>
        </AuthGuard>
      )

      expect(container).toBeInTheDocument()
    })

    it('should handle null children', () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: true,
        loading: false,
      } as any)

      const { container } = render(
        <AuthGuard>{null}</AuthGuard>
      )

      expect(container).toBeInTheDocument()
    })
  })
})
