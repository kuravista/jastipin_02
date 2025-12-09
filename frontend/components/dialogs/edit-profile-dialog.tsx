"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { apiPost, apiPatch, apiGet } from "@/lib/api-client"
import { uploadImage, getUserIdFromToken } from "@/lib/image-upload"
import { Upload, Trash2, Camera, Layout, Palette } from "lucide-react"
import { SocialMediaManager } from "@/components/profile/social-media-manager"
import { LAYOUT_OPTIONS, THEME_OPTIONS } from "@/lib/design-config"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface EditProfileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ProfileFormData {
  profileName: string
  profileBio: string
  slug: string
  avatar?: string
  coverImage?: string
  coverPosition?: number
  design?: {
    layoutId: string
    themeId: string
  }
}

interface ProfileData {
  profileName: string
  profileBio?: string
  slug: string
  avatar?: string
  coverImage?: string
  coverPosition?: number
  profileDesign?: {
    layoutId: string
    themeId: string
  }
}

export function EditProfileDialog({ open, onOpenChange, onSuccess }: EditProfileDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ProfileFormData>({
    profileName: "",
    profileBio: "",
    slug: "",
    coverPosition: 50,
    design: {
      layoutId: "classic",
      themeId: "jastip"
    }
  })
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [coverPreview, setCoverPreview] = useState<string | null>(null)
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
        slug: data.slug || "",
        coverPosition: data.coverPosition || 50,
        design: {
          layoutId: data.profileDesign?.layoutId || "classic",
          themeId: data.profileDesign?.themeId || "jastip"
        }
      })
      setAvatarPreview(data.avatar || null)
      setCoverPreview(data.coverImage || null)
    } catch (err) {
      console.error("Failed to fetch profile", err)
    }
  }

  const handleInputChange = (field: keyof ProfileFormData, value: string) => {
    setFormData((prev: ProfileFormData) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleDesignChange = (type: 'layoutId' | 'themeId', value: string) => {
    setFormData((prev) => ({
      ...prev,
      design: {
        ...prev.design!,
        [type]: value
      }
    }))
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'coverImage') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file terlalu besar (Maksimal 5MB)")
      return
    }

    if (!file.type.startsWith('image/')) {
      setError("Format file tidak didukung. Gunakan JPG/PNG.")
      return
    }

    setLoading(true)
    setError(null)

    try {
      const userId = getUserIdFromToken()
      const type = field === 'avatar' ? 'avatars' : 'covers'
      const { url } = await uploadImage(file, type, userId)

      if (field === 'avatar') {
        setAvatarPreview(url)
      } else {
        setCoverPreview(url)
      }

      setFormData((prev: ProfileFormData) => ({ ...prev, [field]: url }))
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload gambar')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload: any = { ...formData }
      if (avatarPreview) payload.avatar = avatarPreview
      if (coverPreview) payload.coverImage = coverPreview

      await apiPatch("/profile", payload)
      onOpenChange(false)
      onSuccess?.()
      
      // Reload page to reflect changes immediately since auth context might need update
      window.location.reload()
    } catch (err: any) {
      setError(err.message || "Failed to update profile")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Profil</SheetTitle>
          <SheetDescription>Ubah informasi publik Anda</SheetDescription>
        </SheetHeader>
        
        <Tabs defaultValue="profile" className="mt-6">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="profile">Profil</TabsTrigger>
            <TabsTrigger value="design">Tampilan</TabsTrigger>
            <TabsTrigger value="social">Social Media</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <form className="mt-4 space-y-4 pb-6" onSubmit={handleSubmit}>
              {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          {/* Cover Image */}
          <div>
            <Label>Foto Sampul</Label>
            <div className="mt-2 relative h-32 rounded-lg bg-gray-100 overflow-hidden border border-gray-200 group">
              {coverPreview ? (
                <img 
                  src={coverPreview} 
                  alt="Cover" 
                  className="w-full h-full object-cover"
                  style={{ objectPosition: `center ${formData.coverPosition}%` }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                  Belum ada foto sampul
                </div>
              )}
              
              {coverPreview && (
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex flex-col justify-center items-center opacity-0 group-hover:opacity-100">
                  <Label className="text-white text-xs mb-2 drop-shadow-md cursor-pointer">Geser Posisi Vertikal</Label>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={formData.coverPosition || 50} 
                    onChange={(e) => setFormData(prev => ({ ...prev, coverPosition: parseInt(e.target.value) }))}
                    className="w-3/4 h-1 bg-white/50 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              )}

              <label className="absolute top-2 right-2 bg-white/90 p-1.5 rounded-full cursor-pointer shadow-sm hover:bg-white transition-colors z-20">
                <Camera className="w-4 h-4 text-gray-600" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'coverImage')} />
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Rekomendasi: 1200 x 400 px (Rasio 3:1). Format JPG/PNG max 5MB.
            </p>
          </div>

          {/* Avatar */}
          <div className="flex justify-center -mt-12 relative z-10">
            <div className="relative">
              <div className="w-24 h-24 rounded-full bg-white p-1 shadow-md">
                <div className="w-full h-full rounded-full bg-gray-100 overflow-hidden">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-pink-200 to-purple-200 text-2xl font-bold text-white">
                      {formData.profileName.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <label className="absolute bottom-0 right-0 bg-white p-1.5 rounded-full cursor-pointer shadow-sm border border-gray-200 hover:bg-gray-50 transition-colors">
                <Camera className="w-4 h-4 text-gray-600" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageChange(e, 'avatar')} />
              </label>
            </div>
          </div>

          <div>
            <Label htmlFor="profile-name">Nama Profil</Label>
            <Input
              id="profile-name"
              value={formData.profileName}
              onChange={(e) => handleInputChange("profileName", e.target.value)}
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="slug">Username / Link Profil</Label>
            <div className="flex mt-2">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                jastipin.me/
              </span>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleInputChange("slug", e.target.value)}
                disabled={loading}
                className="rounded-l-none"
                placeholder="username"
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">Hanya huruf kecil, angka, dan tanda strip (-)</p>
          </div>

          <div>
            <Label htmlFor="profile-bio">Bio</Label>
            <textarea
              id="profile-bio"
              placeholder="Tuliskan bio singkat..."
              value={formData.profileBio}
              onChange={(e) => handleInputChange("profileBio", e.target.value)}
              disabled={loading}
              className="mt-2 w-full h-24 rounded-lg border border-gray-300 px-3 py-2 resize-none text-sm"
            />
          </div>

              <Button type="submit" className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-12 font-semibold" disabled={loading}>
                {loading ? "Menyimpan..." : "Simpan Perubahan"}
              </Button>
            </form>
          </TabsContent>

          {/* Design Tab */}
          <TabsContent value="design">
            <form className="mt-4 space-y-8 pb-6" onSubmit={handleSubmit}>
              {/* Layout Selector */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Layout className="w-4 h-4" />
                    Pilih Layout
                  </h3>
                </div>
                
                <Select
                  value={formData.design?.layoutId}
                  onValueChange={(val) => handleDesignChange('layoutId', val)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih layout" />
                  </SelectTrigger>
                  <SelectContent>
                    {LAYOUT_OPTIONS.map((layout) => (
                      <SelectItem key={layout.id} value={layout.id}>
                        <div className="flex flex-col items-start text-left">
                          <span className="font-medium">{layout.name}</span>
                          <span className="text-xs text-muted-foreground line-clamp-1">{layout.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Theme Selector */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Tema Warna
                  </h3>
                  <span className="text-xs text-muted-foreground">{THEME_OPTIONS.find(t => t.id === formData.design?.themeId)?.name}</span>
                </div>
                
                <div className="grid grid-cols-5 gap-3">
                  {THEME_OPTIONS.map((theme) => (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => handleDesignChange('themeId', theme.id)}
                      className={`group relative w-full aspect-square rounded-full flex items-center justify-center transition-all ${
                        formData.design?.themeId === theme.id 
                          ? 'ring-2 ring-offset-2 ring-orange-500 scale-110' 
                          : 'hover:scale-105'
                      }`}
                      style={{ background: `linear-gradient(135deg, ${theme.colors.primary} 50%, ${theme.colors.secondary} 50%)` }}
                      title={theme.name}
                    >
                      {formData.design?.themeId === theme.id && (
                        <div className="bg-white rounded-full p-1 shadow-sm">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Button type="submit" className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-12 font-semibold" disabled={loading}>
                {loading ? "Menyimpan..." : "Terapkan Tampilan"}
              </Button>
            </form>
          </TabsContent>

          {/* Social Media Tab */}
          <TabsContent value="social">
            <div className="mt-4 pb-6">
              <SocialMediaManager />
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
