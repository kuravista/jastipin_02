"use client"

import { Suspense } from "react"
import { useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Eye, EyeOff, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiUrl } from "@/lib/config"

type PasswordResetStep = "validating" | "form" | "success" | "error"

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [step, setStep] = useState<PasswordResetStep>("validating")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Validate token on mount
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setStep("error")
        setError("Reset token tidak ditemukan. Silakan minta link baru.")
        return
      }

      try {
        const response = await fetch(
          `${getApiUrl()}/auth/reset-password/validate?token=${token}`,
          { method: 'GET' }
        )

        if (!response.ok) {
          const data = await response.json()
          throw new Error(data.error || 'Token tidak valid atau telah kadaluarsa')
        }

        setStep("form")
      } catch (err: any) {
        setStep("error")
        setError(err.message || 'Token tidak valid atau telah kadaluarsa')
      }
    }

    validateToken()
  }, [token])

  const validatePassword = (): string | null => {
    if (!password) return "Password tidak boleh kosong"
    if (password.length < 8) return "Password minimal 8 karakter"
    if (password !== confirmPassword) return "Password tidak cocok"
    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const passwordError = validatePassword()
    if (passwordError) {
      setError(passwordError)
      return
    }

    if (!token) {
      setError("Token tidak ditemukan")
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          newPassword: password
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Gagal mereset password')
      }

      setStep("success")
    } catch (err: any) {
      setError(err.message || 'Gagal mereset password. Silakan coba lagi.')
    } finally {
      setLoading(false)
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
          <div className="p-8">
            {step === "validating" && (
              <div className="text-center space-y-4">
                <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
                <h1 className="text-xl font-bold text-gray-900">Memverifikasi Link...</h1>
                <p className="text-gray-500 text-sm">Tunggu sebentar</p>
              </div>
            )}

            {step === "form" && (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                  <p className="text-gray-500 text-sm">Buat password baru untuk akun Anda</p>
                </div>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                    <p className="text-red-800 text-sm font-medium">{error}</p>
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-gray-700 font-medium text-sm">
                      Password Baru
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value)
                          if (error) setError(null)
                        }}
                        disabled={loading}
                        className={`h-11 bg-gray-50 border-gray-200 pr-10 focus:bg-white transition-colors ${
                          error && password ? 'border-red-500 focus:ring-red-200' : 'focus:border-orange-500 focus:ring-orange-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-gray-500 text-xs mt-1">Minimal 8 karakter</p>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="confirm-password" className="text-gray-700 font-medium text-sm">
                      Konfirmasi Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="confirm-password"
                        type={showConfirmPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value)
                          if (error) setError(null)
                        }}
                        disabled={loading}
                        className={`h-11 bg-gray-50 border-gray-200 pr-10 focus:bg-white transition-colors ${
                          error && confirmPassword ? 'border-red-500 focus:ring-red-200' : 'focus:border-orange-500 focus:ring-orange-100'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100 transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    <p className="font-medium mb-2">💡 Tips Password Aman:</p>
                    <ul className="space-y-1 text-xs">
                      <li>✓ Gunakan kombinasi huruf besar dan kecil</li>
                      <li>✓ Tambahkan angka dan simbol (!@#$%)</li>
                      <li>✓ Jangan gunakan nama atau tanggal lahir</li>
                    </ul>
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || !password || !confirmPassword}
                    className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Reset Password
                      </span>
                    ) : (
                      "Reset Password"
                    )}
                  </Button>
                </form>
              </>
            )}

            {step === "success" && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-green-100 rounded-full p-4">
                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">Password Berhasil Direset!</h1>

                <p className="text-gray-600">
                  Password akun Anda telah diperbarui. Silakan login dengan password baru.
                </p>

                <Link href="/auth">
                  <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
                    Masuk Sekarang
                  </Button>
                </Link>
              </div>
            )}

            {step === "error" && (
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className="bg-red-100 rounded-full p-4">
                    <AlertCircle className="w-8 h-8 text-red-600" />
                  </div>
                </div>

                <h1 className="text-2xl font-bold text-gray-900">Link Tidak Valid</h1>

                <p className="text-gray-600 text-sm">
                  {error || "Link reset password sudah kadaluarsa atau tidak valid."}
                </p>

                <p className="text-gray-500 text-xs">
                  Link berlaku hanya 1 jam. Silakan minta link baru.
                </p>

                <Link href="/auth">
                  <Button className="w-full h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl">
                    Kembali ke Login
                  </Button>
                </Link>
              </div>
            )}
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 text-orange-500 animate-spin mx-auto" />
          <h1 className="text-xl font-bold text-gray-900">Memuat...</h1>
        </div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
