/**
 * Custom hook for auth notifications using Radix UI toast
 */

'use client'

import { useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'
import { parseAuthError } from '@/lib/auth-errors'

interface UseAuthNotificationsReturn {
  showError: (error: any) => void
  showValidationError: (message: string) => void
  showSuccess: (message?: string) => void
  showInfo: (message: string) => void
}

export function useAuthNotifications(): UseAuthNotificationsReturn {
  const { toast } = useToast()

  /**
   * Show error notification
   */
  const showError = useCallback(
    (error: any) => {
      const authError = parseAuthError(error)

      toast({
        title: 'Error',
        description: authError.message,
        variant: 'destructive',
      })
    },
    [toast]
  )

  /**
   * Show validation error
   */
  const showValidationError = useCallback(
    (message: string) => {
      toast({
        title: 'Validation Error',
        description: message,
        variant: 'destructive',
      })
    },
    [toast]
  )

  /**
   * Show success notification
   */
  const showSuccess = useCallback(
    (message: string = 'Berhasil!') => {
      toast({
        title: 'Success',
        description: message,
        variant: 'default',
      })
    },
    [toast]
  )

  /**
   * Show info notification
   */
  const showInfo = useCallback(
    (message: string) => {
      toast({
        title: 'Info',
        description: message,
        variant: 'default',
      })
    },
    [toast]
  )

  return {
    showError,
    showValidationError,
    showSuccess,
    showInfo,
  }
}
