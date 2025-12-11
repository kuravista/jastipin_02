"use client"

import { useState } from "react"
import { X, AlertCircle, CheckCircle2, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { getApiUrl } from "@/lib/config"

interface ForgotPasswordDialogProps {
  isOpen: boolean
  onClose: () => void
}

export function ForgotPasswordDialog({ isOpen, onClose }: ForgotPasswordDialogProps) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })

      if (!response.ok) {
        throw new Error('Failed to request password reset')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setEmail("")
    setSubmitted(false)
    setError(null)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-900">Lupa Password?</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {submitted ? (
            // Success state
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="bg-green-100 rounded-full p-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
              </div>

              <h3 className="text-lg font-bold text-gray-900">Email Terkirim!</h3>

              <p className="text-sm text-gray-600">
                Kami telah mengirimkan link reset password ke:
              </p>

              <p className="text-sm font-medium text-gray-900 break-all">{email}</p>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                <p className="font-medium mb-2">📧 Periksa email Anda:</p>
                <ul className="space-y-1 text-left">
                  <li>1. Buka email dari Jastipin</li>
                  <li>2. Klik tombol "Reset Password"</li>
                  <li>3. Buat password baru Anda</li>
                </ul>
              </div>

              <p className="text-xs text-gray-500">
                Link berlaku selama 1 jam. Periksa folder spam jika tidak menemukan email.
              </p>

              <Button
                onClick={handleClose}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg h-10"
              >
                Tutup
              </Button>
            </div>
          ) : (
            // Form state
            <>
              <p className="text-sm text-gray-600 mb-6">
                Masukkan email akun Anda dan kami akan mengirimkan link untuk reset password.
              </p>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
                  <p className="text-red-800 text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="forgot-email" className="text-gray-700 font-medium text-sm">
                    Email
                  </Label>
                  <Input
                    id="forgot-email"
                    type="email"
                    placeholder="nama@email.com"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError(null)
                    }}
                    disabled={loading}
                    required
                    className="h-11 bg-gray-50 border-gray-200 focus:bg-white focus:border-orange-500 focus:ring-orange-100 mt-2"
                  />
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-medium rounded-lg h-11 transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Mengirim...
                      </span>
                    ) : (
                      "Kirim Link Reset"
                    )}
                  </Button>

                  <Button
                    type="button"
                    onClick={handleClose}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium rounded-lg h-11"
                  >
                    Batal
                  </Button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
