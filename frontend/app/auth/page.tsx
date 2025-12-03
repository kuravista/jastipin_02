"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { getApiUrl } from "@/lib/config"
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
      const response = await fetch(`${getApiUrl()}/auth/check-username/${username}`)
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
    <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center px-4 py-12 font-sans">
      <div className="w-full max-w-[480px]">
        {/* Header Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 transition-transform hover:scale-105">
            <div className="w-10 h-10 bg-orange-500 rounded-xl shadow-lg shadow-orange-200 flex items-center justify-center text-white font-bold text-xl">
              J
            </div>
            <span className="font-bold text-2xl text-gray-900 tracking-tight">Jastipin.me</span>
          </Link>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-black/5 border border-gray-100 overflow-hidden">
          {/* Username Availability Banner - Integrated Top Section */}
          {(checkingUsername || usernameCheck) && (
            <div className={`px-6 py-5 border-b ${
              checkingUsername
                ? 'bg-blue-50/50 border-blue-100'
                : usernameCheck?.available
                ? 'bg-green-50/50 border-green-100'
                : 'bg-red-50/50 border-red-100'
            }`}>
              <div className="flex items-start gap-3">
                {checkingUsername ? (
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin mt-0.5 shrink-0" />
                ) : usernameCheck?.available ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 space-y-3">
                  <p className={`text-sm font-medium ${
                    checkingUsername
                      ? 'text-blue-900'
                      : usernameCheck?.available
                      ? 'text-green-900'
                      : 'text-red-900'
                  }`}>
                    {checkingUsername ? 'Memeriksa ketersediaan...' : usernameCheck?.message}
                  </p>
                  
                  <div className="space-y-1.5">
                    <Label htmlFor="username-search" className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                      {usernameCheck?.available ? 'Username Terpilih' : 'Cari Username Lain'}
                    </Label>
                    <div className={`flex items-center bg-white rounded-lg border px-3 py-2 gap-2 shadow-sm transition-all ${
                      checkingUsername
                        ? 'border-blue-200 ring-2 ring-blue-50'
                        : usernameCheck?.available
                        ? 'border-green-200 ring-2 ring-green-50'
                        : 'border-red-200 ring-2 ring-red-50'
                    }`}>
                      <span className="text-gray-400 text-sm font-medium select-none">jastipin.me/</span>
                      <Input
                        id="username-search"
                        type="text"
                        value={editingUsername}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder="username"
                        className="border-0 h-auto p-0 focus-visible:ring-0 text-sm font-medium text-gray-900 placeholder:text-gray-300"
                        autoFocus
                      />
                    </div>
                    {usernameCheck?.available && (
                      <p className="text-xs text-green-700 font-medium animate-in fade-in slide-in-from-top-1">
                        ✓ Username ini tersedia untuk Anda!
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {isLogin ? "Selamat Datang!" : "Buat Akun Baru"}
              </h1>
              <p className="text-gray-500 text-sm">
                {isLogin ? "Masuk untuk mengelola jastip Anda" : "Bergabunglah dengan ribuan jastiper lainnya"}
              </p>
            </div>

            {/* Tabs */}
            <div className="grid grid-cols-2 gap-1 p-1 bg-gray-50 rounded-xl mb-8">
              <button
                onClick={() => {
                  setIsLogin(true)
                  setFieldErrors({})
                }}
                className={`text-sm font-medium py-2.5 rounded-lg transition-all duration-200 ${
                  isLogin
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                }`}
              >
                Login
              </button>
              <button
                onClick={() => {
                  setIsLogin(false)
                  setFieldErrors({})
                }}
                className={`text-sm font-medium py-2.5 rounded-lg transition-all duration-200 ${
                  !isLogin
                    ? "bg-white text-gray-900 shadow-sm ring-1 ring-black/5"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/50"
                }`}
              >
                Daftar
              </button>
            </div>

            {/* Google Login - Prominent Placement */}
            <div className="mb-8">
              <GoogleLoginButton />
              <div className="relative mt-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-4 text-gray-400 font-medium tracking-wider">atau dengan email</span>
                </div>
              </div>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-gray-700 font-medium text-sm">Nama Lengkap</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="Contoh: Budi Santoso"
                    className={`h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${fieldErrors.fullName ? "border-red-500 focus:ring-red-200" : "focus:border-orange-500 focus:ring-orange-100"}`}
                    value={fullName}
                    onChange={(e) => handleFieldChange("fullName", e.target.value)}
                    disabled={loading}
                  />
                  {fieldErrors.fullName && (
                    <p className="text-red-600 text-xs flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3" /> {fieldErrors.fullName}
                    </p>
                  )}
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email</Label>
                <Input
                  id="email"
                  type="text"
                  placeholder="nama@email.com"
                  className={`h-11 bg-gray-50 border-gray-200 focus:bg-white transition-colors ${fieldErrors.email ? "border-red-500 focus:ring-red-200" : "focus:border-orange-500 focus:ring-orange-100"}`}
                  value={email}
                  onChange={(e) => handleFieldChange("email", e.target.value)}
                  disabled={loading}
                />
                {fieldErrors.email && (
                  <p className="text-red-600 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.email}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="password" className="text-gray-700 font-medium text-sm">Password</Label>
                  {isLogin && (
                    <Link href="#" className="text-xs font-medium text-orange-600 hover:text-orange-700 hover:underline">
                      Lupa password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    className={`h-11 bg-gray-50 border-gray-200 pr-10 focus:bg-white transition-colors ${fieldErrors.password ? "border-red-500 focus:ring-red-200" : "focus:border-orange-500 focus:ring-orange-100"}`}
                    value={password}
                    onChange={(e) => handleFieldChange("password", e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-red-600 text-xs flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3 h-3" /> {fieldErrors.password}
                  </p>
                )}
              </div>

              {!isLogin && (
                <div className="flex items-start gap-2 text-sm">
                  <input type="checkbox" id="terms" className="w-4 h-4 mt-0.5 rounded border-gray-300 accent-orange-500" />
                  <label htmlFor="terms" className="text-gray-600 text-xs leading-relaxed">
                    Saya setuju dengan{" "}
                    <Link href="#" className="text-orange-600 hover:underline font-medium">
                      Syarat & Ketentuan
                    </Link>{" "}
                    dan{" "}
                    <Link href="#" className="text-orange-600 hover:underline font-medium">
                      Kebijakan Privasi
                    </Link>
                  </label>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 hover:-translate-y-0.5"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> {isLogin ? "Masuk..." : "Mendaftar..."}
                  </span>
                ) : (
                  isLogin ? "Masuk Sekarang" : "Daftar Gratis"
                )}
              </Button>
            </form>
          </div>

          <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
            <p className="text-sm text-gray-600">
              {isLogin ? "Belum punya akun? " : "Sudah punya akun? "}
              <button 
                onClick={() => {
                  setIsLogin(!isLogin)
                  setFieldErrors({})
                }} 
                className="text-orange-600 font-bold hover:text-orange-700 hover:underline"
              >
                {isLogin ? "Buat Akun" : "Login"}
              </button>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors inline-flex items-center gap-1">
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
