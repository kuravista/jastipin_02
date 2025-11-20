"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { apiPost } from "@/lib/api-client"
import { Eye, EyeOff, Check, X } from "lucide-react"

interface ChangePasswordDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface PasswordStrength {
  score: number
  label: string
  color: string
}

function evaluatePasswordStrength(password: string): PasswordStrength {
  let score = 0
  
  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++

  if (score <= 2) return { score, label: "Lemah", color: "bg-red-500" }
  if (score <= 3) return { score, label: "Sedang", color: "bg-yellow-500" }
  return { score, label: "Kuat", color: "bg-green-500" }
}

function checkPasswordRequirements(password: string) {
  return {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  }
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })

  const strength = evaluatePasswordStrength(newPassword)
  const requirements = checkPasswordRequirements(newPassword)
  const allRequirementsMet = Object.values(requirements).every(v => v)
  const passwordsMatch = newPassword && confirmPassword && newPassword === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Semua field harus diisi",
      })
      return
    }

    if (!passwordsMatch) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Password baru dan konfirmasi tidak cocok",
      })
      return
    }

    if (!allRequirementsMet) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Password tidak memenuhi persyaratan keamanan",
      })
      return
    }

    setLoading(true)
    try {
      await apiPost("/profile/change-password", {
        currentPassword,
        newPassword,
      })

      toast({
        title: "Berhasil",
        description: "Password berhasil diubah",
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      onOpenChange(false)
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Terjadi kesalahan saat mengubah password",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle>Ubah Password</SheetTitle>
          <SheetDescription>
            Pastikan password baru aman dan tidak mudah ditebak
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4 pb-6">
          {/* Current Password */}
          <div className="space-y-2">
            <Label htmlFor="current-password">Password Saat Ini</Label>
            <div className="relative">
              <Input
                id="current-password"
                type={showPasswords.current ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Masukkan password saat ini"
                disabled={loading}
                className="mt-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showPasswords.new ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Masukkan password baru"
                disabled={loading}
                className="mt-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Strength Meter */}
            {newPassword && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${strength.color}`}
                      style={{ width: `${(strength.score / 5) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-semibold ${
                    strength.score <= 2 ? "text-red-600" :
                    strength.score <= 3 ? "text-yellow-600" :
                    "text-green-600"
                  }`}>
                    {strength.label}
                  </span>
                </div>

                {/* Requirements */}
                <div className="grid grid-cols-2 gap-1.5 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    {requirements.length ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-300" />
                    )}
                    <span className={requirements.length ? "text-green-700" : "text-gray-500"}>
                      Min 8 karakter
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {requirements.uppercase ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-300" />
                    )}
                    <span className={requirements.uppercase ? "text-green-700" : "text-gray-500"}>
                      Huruf besar (A-Z)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {requirements.lowercase ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-300" />
                    )}
                    <span className={requirements.lowercase ? "text-green-700" : "text-gray-500"}>
                      Huruf kecil (a-z)
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {requirements.number ? (
                      <Check className="w-3.5 h-3.5 text-green-600" />
                    ) : (
                      <X className="w-3.5 h-3.5 text-gray-300" />
                    )}
                    <span className={requirements.number ? "text-green-700" : "text-gray-500"}>
                      Angka (0-9)
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password</Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showPasswords.confirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ketik ulang password baru"
                disabled={loading}
                className="mt-1 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPasswords.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-600">Password tidak cocok</p>
            )}
            {confirmPassword && passwordsMatch && (
              <p className="text-xs text-green-600">Password cocok</p>
            )}
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-12 font-semibold" 
            disabled={loading || !allRequirementsMet || !passwordsMatch}
          >
            {loading ? "Menyimpan..." : "Ubah Password"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
