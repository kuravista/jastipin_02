"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { apiPatch, apiGet } from "@/lib/api-client"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ProfileFormData {
  profileName: string
  profileBio: string
}

interface ProfileData {
  profileName: string
  profileBio?: string
  avatar?: string
  coverImage?: string
}

/**
 * Dialog component for editing user profile
 * @param open - Whether dialog is open
 * @param onOpenChange - Callback to change open state
 * @param onSuccess - Callback when profile is successfully updated
 */
export function EditProfileDialog({ open, onOpenChange, onSuccess }: EditProfileDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    profileName: "",
    profileBio: "",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (open) {
      fetchProfile()
    }
  }, [open])

  const fetchProfile = async () => {
    try {
      const data = await apiGet<ProfileData>("/profile")
      setFormData({
        profileName: data.profileName || "",
        profileBio: data.profileBio || "",
      })
    } catch (err) {
      console.error("Failed to fetch profile", err)
    }
  }

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await apiPatch("/profile", formData)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6">
        <SheetHeader>
          <SheetTitle>Edit Halaman Profil</SheetTitle>
          <SheetDescription>Ubah informasi profil Anda</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div>
            <Label htmlFor="profile-name">Nama Profil</Label>
            <Input
              id="profile-name"
              placeholder="Masukkan nama profil Anda"
              value={formData.profileName}
              onChange={(e) => handleInputChange("profileName", e.target.value)}
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="profile-bio">Bio / Deskripsi</Label>
            <textarea
              id="profile-bio"
              placeholder="Tuliskan bio Anda di sini..."
              value={formData.profileBio}
              onChange={(e) => handleInputChange("profileBio", e.target.value)}
              disabled={loading}
              className="mt-2 w-full h-24 rounded-lg border border-gray-300 px-3 py-2 resize-none"
            />
          </div>

          <Button type="submit" className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-12 font-semibold" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
