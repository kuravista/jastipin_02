/**
 * Onboarding Error Parser
 * Converts API error responses to form field errors
 */

interface ApiErrorDetail {
  path: string
  message: string
}

interface ApiErrorResponse {
  error?: string
  details?: ApiErrorDetail[]
  fullError?: {
    error?: string
    details?: ApiErrorDetail[]
  }
}

/**
 * Parse API error response and map to form field errors
 * @param error - Error response from API
 * @returns Object with fieldErrors (field -> message) and generalError (for banner)
 */
export function parseOnboardingError(error: any): {
  fieldErrors: Record<string, string>
  generalError: string
} {
  const fieldErrors: Record<string, string> = {}
  let generalError = ''

  try {
    // Handle different error response formats
    const errorData = error?.response?.data || error || {}
    const actualError = errorData.fullError || errorData

    // If there's a validation details array
    if (actualError.details && Array.isArray(actualError.details)) {
      const errorMessages: string[] = []
      
      actualError.details.forEach((detail: ApiErrorDetail) => {
        if (detail.path && detail.message) {
          // Map field paths to form field names
          fieldErrors[detail.path] = detail.message
          // Collect error messages for banner
          errorMessages.push(detail.message)
        }
      })
      
      // Show first error message (or all if multiple)
      if (errorMessages.length > 0) {
        generalError = errorMessages.length === 1 
          ? errorMessages[0] 
          : errorMessages.join(' | ')
      }
    } else {
      // If no validation details, use general error
      generalError = actualError.error || error?.message || 'Gagal menyimpan profil'
    }
  } catch (parseError) {
    // If parsing fails, use generic error
    generalError = error?.message || 'Terjadi kesalahan saat menyimpan profil'
  }

  return { fieldErrors, generalError }
}
