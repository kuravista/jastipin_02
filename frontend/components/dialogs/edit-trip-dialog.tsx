"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { ImageIcon, Trash2, Calendar } from "lucide-react"

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
    paymentType?: 'full' | 'dp'
    dpPercentage?: number
    isActive?: boolean
  }
}

interface TripFormData {
  title: string
  description: string
  startDate: string
  deadline: string
  paymentType: 'full' | 'dp'
  dpPercentage?: number
  isActive: boolean
  isLifetime: boolean
}

export function EditTripDialog({ open, onOpenChange, onSuccess, trip }: EditTripDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [dpPercentage, setDpPercentage] = useState(30)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TripFormData>({
    title: "",
    description: "",
    startDate: "",
    deadline: "",
    paymentType: 'full',
    isActive: true,
    isLifetime: false
  })

  useEffect(() => {
    if (trip && open) {
      setFormData({
        title: trip.title || "",
        description: trip.description || "",
        startDate: trip.startDate ? new Date(trip.startDate).toISOString().split('T')[0] : "",
        deadline: trip.deadline ? new Date(trip.deadline).toISOString().split('T')[0] : "",
        paymentType: trip.paymentType || 'full',
        isActive: trip.isActive !== undefined ? trip.isActive : true,
        isLifetime: !trip.deadline
      })
      
      if (trip.dpPercentage) {
        setDpPercentage(trip.dpPercentage)
      }
      
      if (trip.url_img) {
        setImagePreview(trip.url_img)
      }
    }
  }, [trip, open])

  const handleInputChange = (field: keyof TripFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!trip?.id) return
    
    setDeleting(true)
    try {
      await apiDelete(`/trips/${trip.id}`)
      toast({
        title: "Trip berhasil dihapus",
        description: "Trip dan semua produknya telah dihapus",
      })
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal menghapus trip",
        description: error.message || "Terjadi kesalahan",
      })
    } finally {
      setDeleting(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trip?.id) return
    
    setLoading(true)
    try {
      const payload: any = {
        title: formData.title,
        description: formData.description,
        startDate: formData.isLifetime ? null : new Date(formData.startDate).toISOString(),
        deadline: formData.isLifetime ? null : new Date(formData.deadline).toISOString(),
        paymentType: formData.paymentType,
        dpPercentage: formData.paymentType === 'dp' ? dpPercentage : undefined,
        isActive: formData.isActive,
      }

      if (imagePreview && imagePreview !== trip.url_img) {
        payload.url_img = imagePreview
      }

      await apiPatch(`/trips/${trip.id}`, payload)
      
      toast({
        title: "Trip berhasil diperbarui",
        description: "Perubahan telah disimpan",
      })
      
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Gagal memperbarui trip",
        description: error.message || "Terjadi kesalahan",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-4 sm:px-6 max-h-[90vh] overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="text-lg font-bold">Edit Trip</SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Perbarui informasi trip Anda
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload - Compact */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Gambar Trip</Label>
            <div className="relative">
              {imagePreview ? (
                <div className="relative w-full h-32 rounded-lg overflow-hidden border border-gray-200">
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 h-7 w-7 p-0"
                    onClick={() => setImagePreview(null)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-1.5" />
                  <span className="text-xs text-gray-500">Klik untuk upload gambar</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Title & Description - Compact */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Nama Trip *
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              placeholder="Contoh: Trip Jepang November 2024"
              disabled={loading}
              className="h-9 text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Deskripsi
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Jelaskan trip Anda"
              disabled={loading}
              className="h-9 text-sm"
            />
          </div>
          {/* Dates in single row with Lifetime toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                Periode Trip
              </Label>
              <div className="flex items-center space-x-2">
                <Switch
                  id="lifetime"
                  checked={formData.isLifetime}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isLifetime: checked }))}
                  className="scale-75"
                />
                <Label htmlFor="lifetime" className="text-xs text-gray-500 font-normal cursor-pointer">
                  Tanpa Batas Waktu (Jasa)
                </Label>
              </div>
            </div>
            
            {!formData.isLifetime && (
              <div className="grid grid-cols-2 gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                <div>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => handleInputChange("startDate", e.target.value)}
                    disabled={loading}
                    className="h-9 text-sm"
                  />
                  <span className="text-[10px] text-gray-500">Mulai</span>
                </div>
                <div>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange("deadline", e.target.value)}
                    disabled={loading}
                    className="h-9 text-sm"
                  />
                  <span className="text-[10px] text-gray-500">Selesai</span>
                </div>
              </div>
            )}
            
            {formData.isLifetime && (
              <div className="bg-blue-50 border border-blue-100 rounded-md p-2.5 text-xs text-blue-700 animate-in fade-in slide-in-from-top-1 duration-200">
                Trip ini akan aktif selamanya sampai Anda menonaktifkannya secara manual. Cocok untuk layanan jasa titip reguler.
              </div>
            )}
          </div>

          {/* Streamlined Payment Type with Tabs */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Skema Pembayaran</Label>
            <Tabs value={formData.paymentType} onValueChange={(value) => setFormData(prev => ({ ...prev, paymentType: value as 'full' | 'dp' }))}>
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="full" className="text-xs sm:text-sm data-[state=active]:bg-[#FB923C] data-[state=active]:text-white">
                  Full Payment
                </TabsTrigger>
                <TabsTrigger value="dp" className="text-xs sm:text-sm data-[state=active]:bg-[#FB923C] data-[state=active]:text-white">
                  Down Payment
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Compact DP Percentage Slider */}
            {formData.paymentType === 'dp' && (
              <div className="p-3 border border-orange-200 rounded-lg bg-orange-50/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-medium text-gray-700">Persentase DP</span>
                  <span className="text-base font-bold text-[#FB923C]">{dpPercentage}%</span>
                </div>
                <Slider
                  value={[dpPercentage]}
                  onValueChange={(values) => setDpPercentage(values[0])}
                  min={10}
                  max={50}
                  step={5}
                  className="w-full"
                  disabled={loading}
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>Min: 10%</span>
                  <span>Max: 50%</span>
                </div>
                <p className="text-[10px] text-gray-500 mt-2 leading-relaxed">
                  Pembeli membayar {dpPercentage}% di awal, sisanya {100 - dpPercentage}% saat siap kirim
                </p>
              </div>
            )}
          </div>

          {/* Trip Active Switch - Compact */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex-1">
              <Label htmlFor="trip-active" className="text-sm font-medium">
                Status Trip
              </Label>
              <p className="text-[11px] text-gray-500 mt-0.5">
                Aktif = ditampilkan ke pembeli
              </p>
            </div>
            <Switch
              id="trip-active"
              checked={formData.isActive}
              onCheckedChange={(checked) =>
                setFormData((prev: TripFormData) => ({ ...prev, isActive: checked }))
              }
              disabled={loading}
              className="data-[state=checked]:bg-[#FB923C]"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button 
              type="submit" 
              className="flex-1 bg-[#FB923C] hover:bg-[#EA7C2C] h-10 font-semibold text-sm" 
              disabled={loading || deleting}
            >
              {loading ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
            <Button 
              type="button"
              variant="destructive"
              className="px-4 h-10 font-semibold text-sm"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              {deleting ? "..." : "Hapus"}
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
