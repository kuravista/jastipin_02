"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import {
  validateEmail,
  validatePassword,
  validateFullName,
  parseAuthError,
} from "@/lib/auth-errors"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Eye, EyeOff, AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { GoogleLoginButton } from "@/components/auth/google-login-button"

interface FieldErrors {
  email?: string
  password?: string
  fullName?: string
}

/**
 * Extract field-level errors from API error response and parse to user-friendly messages
 */
function getFieldErrorsFromAPI(error: any): FieldErrors {
  const errors: FieldErrors = {}

  // Check fullError property (from api-client)
  const errorObj = error?.fullError || error
  const details = errorObj?.details || []

  if (Array.isArray(details)) {
    details.forEach((err: any) => {
      const path = String(err?.path || "").toLowerCase()
      const fieldError = { path: err?.path, message: err?.message }
      
      // Parse the error to get user-friendly message
      const parsed = parseAuthError(fieldError)

      if (path.includes("email")) {
        errors.email = parsed.message
      } else if (path.includes("password")) {
        errors.password = parsed.message
      } else if (path.includes("fullname") || path.includes("full_name") || path.includes("name") || path.includes("slug")) {
        // Map slug errors to fullName field
        errors.fullName = parsed.message
      }
    })
  }

  return errors
}

interface UsernameCheckResult {
  available: boolean
  message: string
  username: string
  error?: string
}

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [usernameCheck, setUsernameCheck] = useState<UsernameCheckResult | null>(null)
  const [checkingUsername, setCheckingUsername] = useState(false)
  const [editingUsername, setEditingUsername] = useState("")
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { login, register, loading } = useAuth()

  // Check username availability when component mounts
  useEffect(() => {
    const username = searchParams.get('username')
    if (username) {
      setEditingUsername(username)
      checkUsernameAvailability(username)
    }
  }, [searchParams])

  const checkUsernameAvailability = async (username: string) => {
    setCheckingUsername(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/check-username/${username}`)
      const data = await response.json()

      if (response.ok) {
        setUsernameCheck(data)
      } else {
        setUsernameCheck({
          available: false,
          message: data.error || 'Gagal memeriksa username',
          username: username,
          error: data.error
        })
      }
    } catch (error) {
      setUsernameCheck({
        available: false,
        message: 'Gagal memeriksa username',
        username: username,
        error: 'Network error'
      })
    } finally {
      setCheckingUsername(false)
    }
  }

  const handleUsernameChange = (value: string) => {
    // Sanitize input: only allow lowercase letters, numbers, dash, underscore
    const sanitized = value.toLowerCase().replace(/[^a-z0-9_-]/g, "")
    setEditingUsername(sanitized)

    // Clear previous timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout)
    }

    // Set new timeout to check username after user stops typing
    if (sanitized.length >= 3) {
      const timeout = setTimeout(() => {
        checkUsernameAvailability(sanitized)
      }, 500) // Wait 500ms after user stops typing
      setTypingTimeout(timeout)
    } else if (sanitized.length > 0) {
      // Show error for too short username
      setUsernameCheck({
        available: false,
        message: 'Username minimal 3 karakter',
        username: sanitized,
        error: 'Too short'
      })
    }
  }

  /**
   * Validate a single field
   */
  const validateField = (
    field: "email" | "password" | "fullName",
    value: string,
  ): string | undefined => {
    if (field === "email") {
      const result = validateEmail(value)
      return result.error
    }
    if (field === "password") {
      const result = validatePassword(value)
      return result.error
    }
    if (field === "fullName") {
      const result = validateFullName(value)
      return result.error
    }
  }

  /**
   * Handle field change with real-time validation
   */
  const handleFieldChange = (
    field: "email" | "password" | "fullName",
    value: string,
  ) => {
    if (field === "email") setEmail(value)
    if (field === "password") setPassword(value)
    if (field === "fullName") setFullName(value)

    // Clear error for this field when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  /**
   * Validate all fields before submission
   */
  const validateAllFields = (): boolean => {
    const errors: FieldErrors = {}

    const emailError = validateField("email", email)
    if (emailError) errors.email = emailError

    const passwordError = validateField("password", password)
    if (passwordError) errors.password = passwordError

    if (!isLogin) {
      const nameError = validateField("fullName", fullName)
      if (nameError) errors.fullName = nameError
    }

    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate before submission
    if (!validateAllFields()) {
      return
    }

    try {
      if (isLogin) {
        await login(email, password)
      } else {
        await register(email, password, fullName)
      }

      setTimeout(() => {
        router.push("/dashboard")
      }, 500)
    } catch (err: any) {
      // Extract field errors from API response
      const apiErrors = getFieldErrorsFromAPI(err)
      if (Object.keys(apiErrors).length > 0) {
        setFieldErrors(apiErrors)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-violet-50 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
              J
            </div>
            <span className="font-bold text-2xl">Jastipin.me</span>
          </Link>

          {/* Username Availability Banner */}
          {(checkingUsername || usernameCheck) && (
            <div className={`mb-4 p-4 border rounded-lg transition-all ${
              checkingUsername
                ? 'bg-blue-50 border-blue-200'
                : usernameCheck?.available
                ? 'bg-green-50 border-green-200'
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-center gap-3 mb-3">
                {checkingUsername ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin shrink-0" />
                ) : usernameCheck?.available ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                )}
                <div className="text-left flex-1">
                  <p className={`text-sm font-medium ${
                    checkingUsername
                      ? 'text-blue-900'
                      : usernameCheck?.available
                      ? 'text-green-900'
                      : 'text-red-900'
                  }`}>
                    {checkingUsername ? 'Memeriksa username...' : usernameCheck?.message}
                  </p>
                </div>
              </div>

              {/* Always show input field when username check is initiated */}
              <div className="space-y-2">
                <Label htmlFor="username-search" className={`text-xs ${
                  usernameCheck?.available ? 'text-green-700' : 'text-gray-700'
                }`}>
                  {usernameCheck?.available ? 'Username Anda:' : 'Coba username lain:'}
                </Label>
                <div className={`flex items-center bg-white rounded-lg border px-3 py-2 gap-2 transition-colors ${
                  checkingUsername
                    ? 'border-blue-300'
                    : usernameCheck?.available
                    ? 'border-green-300 focus-within:border-green-400'
                    : 'border-red-300 focus-within:border-red-400'
                }`}>
                  <span className="text-gray-500 text-sm shrink-0">jastipin.me/</span>
                  <Input
                    id="username-search"
                    type="text"
                    value={editingUsername}
                    onChange={(e) => handleUsernameChange(e.target.value)}
                    placeholder="username-anda"
                    className="border-0 h-8 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
                    autoFocus
                  />
                  {checkingUsername ? (
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin shrink-0" />
                  ) : usernameCheck?.available ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                </div>
                <p className={`text-xs ${
                  usernameCheck?.available ? 'text-green-700 font-medium' : 'text-gray-600'
                }`}>
                  {usernameCheck?.available
                    ? '✓ Username ini tersedia untuk Anda!'
                    : 'Username akan otomatis dicek saat Anda mengetik'}
                </p>
              </div>
            </div>
          )}

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? "Selamat Datang Kembali!" : "Mulai Gratis Hari Ini"}
          </h1>
          <p className="text-gray-600">
            {isLogin ? "Login untuk kelola jastip dengan mudah" : "Buat akun dan otomatisasi pesanan WhatsApp"}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
          <div className="flex gap-2 mb-6">
            <Button
              variant={isLogin ? "default" : "outline"}
              onClick={() => {
                setIsLogin(true)
                setFieldErrors({})
              }}
              className={
                isLogin
                  ? "flex-1 bg-orange-500 hover:bg-orange-600"
                  : "flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
              }
            >
              Login
            </Button>
            <Button
              variant={!isLogin ? "default" : "outline"}
              onClick={() => {
                setIsLogin(false)
                setFieldErrors({})
              }}
              className={
                !isLogin
                  ? "flex-1 bg-orange-500 hover:bg-orange-600"
                  : "flex-1 border-gray-200 text-gray-600 hover:bg-gray-50"
              }
            >
              Daftar
            </Button>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nama Lengkap</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Masukkan nama lengkap"
                  className={`h-11 ${fieldErrors.fullName ? "border-red-500 focus:border-red-500" : ""}`}
                  value={fullName}
                  onChange={(e) => handleFieldChange("fullName", e.target.value)}
                  disabled={loading}
                  aria-invalid={!!fieldErrors.fullName}
                />
                {fieldErrors.fullName && (
                  <div className="flex items-center gap-2 text-red-600 text-sm">
                    <AlertCircle className="w-4 h-4" />
                    <span>{fieldErrors.fullName}</span>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="text"
                placeholder="email@example.com atau 08123456789"
                className={`h-11 ${fieldErrors.email ? "border-red-500 focus:border-red-500" : ""}`}
                value={email}
                onChange={(e) => handleFieldChange("email", e.target.value)}
                disabled={loading}
                aria-invalid={!!fieldErrors.email}
              />
              {fieldErrors.email && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{fieldErrors.email}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Minimal 8 karakter"
                  className={`h-11 pr-10 ${fieldErrors.password ? "border-red-500 focus:border-red-500" : ""}`}
                  value={password}
                  onChange={(e) => handleFieldChange("password", e.target.value)}
                  disabled={loading}
                  aria-invalid={!!fieldErrors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {fieldErrors.password && (
                <div className="flex items-center gap-2 text-red-600 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  <span>{fieldErrors.password}</span>
                </div>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300 accent-orange-500" />
                  <span className="text-gray-600">Ingat saya</span>
                </label>
                <Link href="#" className="text-violet-600 hover:underline">
                  Lupa password?
                </Link>
              </div>
            )}

            {!isLogin && (
              <div className="flex items-start gap-2 text-sm">
                <input type="checkbox" className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-orange-500" />
                <span className="text-gray-600">
                  Saya setuju dengan{" "}
                  <Link href="#" className="text-violet-600 hover:underline">
                    Syarat & Ketentuan
                  </Link>{" "}
                  dan{" "}
                  <Link href="#" className="text-violet-600 hover:underline">
                    Kebijakan Privasi
                  </Link>
                </span>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {loading ? (isLogin ? "Masuk..." : "Mendaftar...") : isLogin ? "Masuk Sekarang" : "Daftar Gratis"}
            </Button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">atau lanjutkan dengan</span>
              </div>
            </div>

            <div className="mt-4">
              <GoogleLoginButton />
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-orange-500 font-semibold hover:underline">
              {isLogin ? "Daftar Gratis" : "Login"}
            </button>
          </p>
        </div>

        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-gray-600 hover:text-orange-500">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
