"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { apiPost, apiGet } from "@/lib/api-client"
import { getRandomProductImage } from "@/lib/image.utils"
import { Camera, Trash2 } from "lucide-react"

interface CreateProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  preselectedTripId?: string
}

interface ProductFormData {
  title: string
  price: number
  stock: number
  description: string
  tripId: string
  type: 'goods' | 'tasks'
  image?: string
}

interface Trip {
  id: string
  title: string
  paymentType?: 'full' | 'dp'
  dpPercentage?: number
}

/**
 * Dialog component for creating a new product
 * @param open - Whether dialog is open
 * @param onOpenChange - Callback to change open state
 * @param onSuccess - Callback when product is successfully created
 */
export function CreateProductDialog({ open, onOpenChange, onSuccess, preselectedTripId }: CreateProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [trips, setTrips] = useState<Trip[]>([])
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    price: 0,
    stock: 0,
    description: "",
    tripId: "",
    type: "goods",
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchTrips()
      if (preselectedTripId) {
        setFormData((prev) => ({ ...prev, tripId: preselectedTripId }))
      }
    }
  }, [open, preselectedTripId])

  const fetchTrips = async () => {
    try {
      const data = await apiGet<Trip[]>("/trips")
      setTrips(data)
    } catch (err) {
      console.error("Failed to fetch trips", err)
    }
  }

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => {
        const result = reader.result as string
        setPreviewImage(result)
        setFormData((prev) => ({ ...prev, image: result }))
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setPreviewImage(null)
    setFormData((prev) => ({ ...prev, image: undefined }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (!formData.tripId) {
      setError("Pilih trip terlebih dahulu")
      setLoading(false)
      return
    }

    try {
      // If no image provided, use random default SVG
      // Check if image is base64 (uploaded) or empty
      let imageToSend = formData.image
      
      // If no image selected, use random default
      if (!imageToSend || imageToSend.trim() === "") {
        imageToSend = getRandomProductImage()
      }
      
      await apiPost("/products", {
        ...formData,
        image: imageToSend,
      })
      
      toast({
        title: "Produk Berhasil Dibuat!",
        description: `"${formData.title}" telah ditambahkan.`,
        variant: "success",
      })
      
      setFormData({
        title: "",
        price: 0,
        stock: 0,
        description: "",
        tripId: "",
        type: "goods",
      })
      setPreviewImage(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || "Gagal membuat produk"
      setError(errorMsg)
      toast({
        title: "Gagal Membuat Produk",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Tambah Produk Baru</SheetTitle>
          <SheetDescription className="text-sm">Tambahkan produk ke katalog Anda</SheetDescription>
        </SheetHeader>
        <form className="space-y-3 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{error}</div>}

          {/* Image Upload Section */}
          <div>
            <Label className="text-sm">Gambar (Opsional)</Label>
            {previewImage && (
              <div className="mt-2 relative">
                <img 
                  src={previewImage} 
                  alt="Preview"
                  className="w-full h-28 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  onClick={removeImage}
                  className="absolute top-1 right-1 h-6 w-6"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            )}
            <label className="mt-2 flex items-center justify-center gap-2 p-3 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
              <Camera className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600">
                {previewImage ? "Ubah Gambar" : "Upload Foto"}
              </span>
              <input 
                type="file" 
                accept="image/*"
                capture="environment"
                onChange={handleImageChange}
                disabled={loading}
                className="hidden"
              />
            </label>
          </div>

          <div>
            <Label htmlFor="trip" className="text-sm">Trip</Label>
            <div className="flex items-center gap-2">
              <Select 
                value={formData.tripId} 
                onValueChange={(val) => handleInputChange("tripId", val)}
                disabled={loading}
              >
                <SelectTrigger className="mt-1.5 h-10 flex-1">
                  <SelectValue placeholder="Pilih trip..." />
                </SelectTrigger>
                <SelectContent>
                  {trips.map((trip) => (
                    <SelectItem key={trip.id} value={trip.id}>
                      {trip.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.tripId && trips.find(t => t.id === formData.tripId) && (
                <div className="mt-1.5">
                  {trips.find(t => t.id === formData.tripId)?.paymentType === 'dp' ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold whitespace-nowrap">
                      💳 DP {trips.find(t => t.id === formData.tripId)?.dpPercentage || 20}%
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold whitespace-nowrap">
                      💰 Full
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="type" className="text-sm">Tipe</Label>
              <Select 
                value={formData.type} 
                onValueChange={(val: 'goods' | 'tasks') => handleInputChange("type", val)}
                disabled={loading}
              >
                <SelectTrigger className="mt-1.5 h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="goods">📦 Barang</SelectItem>
                  <SelectItem value="tasks">🛠️ Jasa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="product-name" className="text-sm">Nama Produk</Label>
              <Input
                id="product-name"
                placeholder="Contoh: KitKat Matcha"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                required
                disabled={loading}
                className="mt-1.5 h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="product-price" className="text-sm">Harga</Label>
              <Input
                id="product-price"
                type="number"
                placeholder="50000"
                value={formData.price || ""}
                onChange={(e) => handleInputChange("price", Number(e.target.value))}
                required
                disabled={loading}
                className="mt-1.5 h-10"
              />
            </div>
            <div>
              <Label htmlFor="product-stock" className="text-sm">Stok</Label>
              <Input
                id="product-stock"
                type="number"
                placeholder="10"
                value={formData.stock || ""}
                onChange={(e) => handleInputChange("stock", Number(e.target.value))}
                required
                disabled={loading}
                className="mt-1.5 h-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description" className="text-sm">Deskripsi (Opsional)</Label>
            <Textarea
              id="description"
              placeholder="Deskripsi produk..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={loading}
              className="mt-1.5 h-16 resize-none"
            />
          </div>

          <Button type="submit" className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-10 font-semibold" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
