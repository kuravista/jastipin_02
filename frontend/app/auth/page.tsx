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
      } else if (path.includes("fullname") || path.includes("full_name") || path.includes("name")) {
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

            <div className="mt-4 grid grid-cols-2 gap-3">
              <Button variant="outline" className="h-11 border-gray-200 hover:bg-gray-50 bg-transparent">
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Google
              </Button>
              <Button variant="outline" className="h-11 border-gray-200 hover:bg-gray-50 bg-transparent">
                <svg className="w-5 h-5 mr-2" fill="#25D366" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                </svg>
                WhatsApp
              </Button>
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
