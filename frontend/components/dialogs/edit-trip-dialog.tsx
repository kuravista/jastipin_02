"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { apiPatch, apiDelete } from "@/lib/api-client"
import { Upload, Trash2 } from "lucide-react"

interface EditTripDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  trip?: {
    id: string
    title: string
    description?: string
    url_img?: string
    startDate?: string | Date
    deadline?: string | Date
  }
}

interface TripFormData {
  title: string
  description: string
  startDate: string
  deadline: string
}

export function EditTripDialog({ open, onOpenChange, onSuccess, trip }: EditTripDialogProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState<TripFormData>({
    title: "",
    description: "",
    startDate: "",
    deadline: "",
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (trip && open) {
      setFormData({
        title: trip.title || "",
        description: trip.description || "",
        startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : "",
        deadline: trip.deadline ? new Date(trip.deadline).toISOString().split('T')[0] : "",
      })
      setPreviewImage(trip.url_img || null)
    }
  }, [trip, open])

  const handleInputChange = (field: keyof TripFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreviewImage(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!trip?.id) return

    setDeleting(true)
    setError(null)

    try {
      await apiDelete(`/trips/${trip.id}`)
      toast({
        title: "Trip Berhasil Dihapus!",
        description: `"${trip?.title}" telah dihapus.`,
        variant: "success",
      })
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || "Gagal menghapus trip"
      setError(errorMsg)
      toast({
        title: "Gagal Menghapus Trip",
        description: errorMsg,
        variant: "destructive",
      })
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trip?.id) return
    
    setLoading(true)
    setError(null)

    try {
      await apiPatch(`/trips/${trip.id}`, {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        deadline: formData.deadline,
      })
      toast({
        title: "Trip Berhasil Diperbarui!",
        description: `"${formData.title}" telah diperbarui.`,
        variant: "success",
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || "Gagal memperbarui trip"
      setError(errorMsg)
      toast({
        title: "Gagal Memperbarui Trip",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6">
        <SheetHeader>
          <SheetTitle>Edit Trip</SheetTitle>
          <SheetDescription>Ubah informasi trip Anda</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          {/* Image Upload Section */}
          <div>
            <Label>Gambar Trip</Label>
            {previewImage && (
              <div className="mt-2 relative">
                <img 
                  src={previewImage} 
                  alt="Preview"
                  className="w-full h-40 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={() => setPreviewImage(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <label className="mt-3 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-[#FB923C] hover:bg-orange-50 transition-colors">
              <Upload className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-600">
                {previewImage ? "Ubah Gambar" : "Upload Gambar"}
              </span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange}
                disabled={loading}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-1">*Fitur storage masih dalam pengembangan</p>
          </div>

          <div>
            <Label htmlFor="title">Judul Trip</Label>
            <Input
              id="title"
              placeholder="Jastip Jepang Mei 2025"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              placeholder="Deskripsi trip..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={loading}
              className="mt-2 w-full h-24 rounded-lg border border-gray-300 px-3 py-2 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={formData.startDate}
                onChange={(e) => handleInputChange("startDate", e.target.value)}
                disabled={loading}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="deadline">Tanggal Selesai</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => handleInputChange("deadline", e.target.value)}
                disabled={loading}
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button 
              type="submit" 
              className="flex-1 bg-[#FB923C] hover:bg-[#EA7C2C] h-11 font-semibold" 
              disabled={loading || deleting}
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Button 
              type="button"
              variant="destructive"
              className="px-4 h-11 font-semibold bg-red-600 hover:bg-red-700"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
            >
              {deleting ? "Menghapus..." : "Hapus"}
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Hapus Trip</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus trip "{trip?.title}"? Tindakan ini tidak dapat dibatalkan dan semua produk di trip ini akan dihapus.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Menghapus..." : "Hapus Trip"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}
