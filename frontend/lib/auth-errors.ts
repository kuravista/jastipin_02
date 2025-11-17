/**
 * Authentication Error Handler
 * Maps API errors and validation errors to user-friendly messages
 */

export type AuthErrorCode =
  | 'INVALID_EMAIL'
  | 'INVALID_PASSWORD'
  | 'PASSWORD_TOO_SHORT'
  | 'PASSWORD_COMPLEXITY'
  | 'EMAIL_EXISTS'
  | 'USER_NOT_FOUND'
  | 'INVALID_CREDENTIALS'
  | 'VALIDATION_ERROR'
  | 'NETWORK_ERROR'
  | 'UNKNOWN_ERROR'

export interface AuthError {
  code: AuthErrorCode
  message: string
  details?: string
}

/**
 * Parse error from API response or exception
 * Returns user-friendly error message
 * Handles both simple message errors and Zod validation errors
 */
export function parseAuthError(error: any): AuthError {
  // Handle fullError from API client (contains full response object)
  if (error?.fullError) {
    const fullError = error.fullError
    if (fullError?.details && Array.isArray(fullError.details)) {
      const firstError = fullError.details[0]
      if (firstError?.path && firstError?.message) {
        return parseValidationError(firstError.path, firstError.message)
      }
    }
  }

  // Handle error.details directly
  if (error?.details && Array.isArray(error.details)) {
    const firstError = error.details[0]
    if (firstError?.path && firstError?.message) {
      return parseValidationError(firstError.path, firstError.message)
    }
  }

  // Handle array of errors (Zod validation array)
  if (Array.isArray(error)) {
    const firstError = error[0]
    if (firstError?.path && firstError?.message) {
      return parseValidationError(firstError.path, firstError.message)
    }
  }

  // Handle single error object with path and message (Zod format)
  if (error?.path && error?.message) {
    return parseValidationError(error.path, error.message)
  }

  const errorMessage = error?.message || error?.error || String(error)
  const lowerMessage = errorMessage.toLowerCase()

  // Check for specific error patterns
  if (lowerMessage.includes('invalid credentials') || lowerMessage.includes('unauthorized')) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Email atau password salah. Silakan coba lagi.',
      details: 'Invalid credentials',
    }
  }

  if (lowerMessage.includes('user not found') || (lowerMessage.includes('email') && lowerMessage.includes('not found'))) {
    return {
      code: 'USER_NOT_FOUND',
      message: 'Email tidak ditemukan. Silakan cek atau daftar akun baru.',
      details: 'User not found',
    }
  }

  if (lowerMessage.includes('email')) {
    if (lowerMessage.includes('exists') || lowerMessage.includes('already')) {
      return {
        code: 'EMAIL_EXISTS',
        message: 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.',
        details: 'Email already in use',
      }
    }
    if (
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('format') ||
      lowerMessage.includes('valid email')
    ) {
      return {
        code: 'INVALID_EMAIL',
        message: 'Format email tidak valid. Gunakan email yang benar atau nomor WhatsApp.',
        details: 'Invalid email format',
      }
    }
  }

  if (lowerMessage.includes('password')) {
    if (lowerMessage.includes('short') || lowerMessage.includes('minimal')) {
      return {
        code: 'PASSWORD_TOO_SHORT',
        message: 'Password minimal 8 karakter. Gunakan kombinasi huruf, angka, dan simbol.',
        details: 'Password too short',
      }
    }
    if (
      lowerMessage.includes('invalid') ||
      lowerMessage.includes('salah') ||
      lowerMessage.includes('incorrect')
    ) {
      return {
        code: 'INVALID_PASSWORD',
        message: 'Password salah. Silakan coba lagi atau reset password.',
        details: 'Invalid password',
      }
    }
  }

  if (lowerMessage.includes('network') || lowerMessage.includes('failed to fetch')) {
    return {
      code: 'NETWORK_ERROR',
      message: 'Gagal terhubung ke server. Periksa koneksi internet Anda.',
      details: 'Network error',
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: `Terjadi kesalahan: ${errorMessage}`,
    details: String(error),
  }
}

/**
 * Parse validation error with path and message (Zod format)
 */
function parseValidationError(path: string, message: string): AuthError {
  const lowerPath = String(path).toLowerCase()
  const lowerMessage = String(message).toLowerCase()

  if (lowerPath.includes('email')) {
    if (lowerMessage.includes('exists') || lowerMessage.includes('already')) {
      return {
        code: 'EMAIL_EXISTS',
        message: 'Email ini sudah terdaftar. Silakan login atau gunakan email lain.',
        details: message,
      }
    }
    if (lowerMessage.includes('invalid') || lowerMessage.includes('format')) {
      return {
        code: 'INVALID_EMAIL',
        message: 'Format email tidak valid. Gunakan email yang benar atau nomor WhatsApp.',
        details: message,
      }
    }
    if (lowerMessage.includes('required') || lowerMessage.includes('kosong')) {
      return {
        code: 'INVALID_EMAIL',
        message: 'Email tidak boleh kosong.',
        details: message,
      }
    }
  }

  if (lowerPath.includes('password')) {
    if (lowerMessage.includes('uppercase') || lowerMessage.includes('huruf besar')) {
      return {
        code: 'PASSWORD_COMPLEXITY',
        message: 'Password harus mengandung huruf besar (A-Z).',
        details: message,
      }
    }
    if (lowerMessage.includes('lowercase') || lowerMessage.includes('huruf kecil')) {
      return {
        code: 'PASSWORD_COMPLEXITY',
        message: 'Password harus mengandung huruf kecil (a-z).',
        details: message,
      }
    }
    if (lowerMessage.includes('number') || lowerMessage.includes('digit') || lowerMessage.includes('angka')) {
      return {
        code: 'PASSWORD_COMPLEXITY',
        message: 'Password harus mengandung angka (0-9).',
        details: message,
      }
    }
    if (lowerMessage.includes('special') || lowerMessage.includes('simbol')) {
      return {
        code: 'PASSWORD_COMPLEXITY',
        message: 'Password harus mengandung simbol spesial (!@#$%^&*).',
        details: message,
      }
    }
    if (lowerMessage.includes('short') || lowerMessage.includes('minimal') || lowerMessage.includes('at least')) {
      return {
        code: 'PASSWORD_TOO_SHORT',
        message: 'Password minimal 8 karakter.',
        details: message,
      }
    }
    if (lowerMessage.includes('required') || lowerMessage.includes('kosong')) {
      return {
        code: 'INVALID_PASSWORD',
        message: 'Password tidak boleh kosong.',
        details: message,
      }
    }
  }

  if (lowerPath.includes('fullname') || lowerPath.includes('full_name') || lowerPath.includes('name')) {
    if (lowerMessage.includes('required') || lowerMessage.includes('kosong')) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Nama lengkap tidak boleh kosong.',
        details: message,
      }
    }
    if (lowerMessage.includes('short') || lowerMessage.includes('minimal')) {
      return {
        code: 'VALIDATION_ERROR',
        message: 'Nama minimal 3 karakter.',
        details: message,
      }
    }
  }

  // Generic validation error
  return {
    code: 'VALIDATION_ERROR',
    message: String(message),
    details: `Field: ${path}`,
  }
}

/**
 * Validate email format (basic client-side validation)
 */
export function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email.trim()) {
    return { valid: false, error: 'Email tidak boleh kosong' }
  }

  // Simple email regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email) && !email.match(/^\d{10,12}$/)) {
    // Allow WhatsApp number format (10-12 digits)
    return {
      valid: false,
      error: 'Format email tidak valid. Gunakan format: email@example.com atau nomor WhatsApp (08xxx)',
    }
  }

  return { valid: true }
}

/**
 * Validate password format
 */
export function validatePassword(password: string): { valid: boolean; error?: string } {
  if (!password.trim()) {
    return { valid: false, error: 'Password tidak boleh kosong' }
  }

  if (password.length < 8) {
    return {
      valid: false,
      error: 'Password minimal 8 karakter',
    }
  }

  return { valid: true }
}

/**
 * Validate full name
 */
export function validateFullName(name: string): { valid: boolean; error?: string } {
  if (!name.trim()) {
    return { valid: false, error: 'Nama lengkap tidak boleh kosong' }
  }

  if (name.trim().length < 3) {
    return {
      valid: false,
      error: 'Nama minimal 3 karakter',
    }
  }

  return { valid: true }
}
