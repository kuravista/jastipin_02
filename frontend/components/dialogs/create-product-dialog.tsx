"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { apiPost, apiGet } from "@/lib/api-client"
import { getRandomProductImage } from "@/lib/image.utils"
import { Plus, Camera, Trash2 } from "lucide-react"

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
  trip_id: string
  image?: string
}

interface Trip {
  id: string
  title: string
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
    trip_id: "",
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (open) {
      fetchTrips()
      if (preselectedTripId) {
        setFormData((prev) => ({ ...prev, trip_id: preselectedTripId }))
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

    if (!formData.trip_id) {
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
        trip_id: "",
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
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto px-6">
        <SheetHeader>
          <SheetTitle>Tambah Produk Baru</SheetTitle>
          <SheetDescription>Tambahkan produk ke katalog Anda</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          {/* Image Upload Section */}
          <div>
            <Label>Gambar Produk (Opsional)</Label>
            {previewImage && (
              <div className="mt-2 relative">
                <img 
                  src={previewImage} 
                  alt="Preview"
                  className="w-full h-32 object-cover rounded-lg"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <label className="mt-3 flex items-center justify-center gap-2 p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors">
              <Camera className="w-5 h-5 text-gray-600" />
              <span className="text-sm text-gray-600">
                {previewImage ? "Ubah Gambar" : "Upload/Ambil Foto"}
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
            <p className="text-xs text-gray-500 mt-1">*Gambar akan otomatis dipilih jika tidak ada</p>
          </div>

          <div>
            <Label htmlFor="trip">Pilih Trip</Label>
            <select
              id="trip"
              value={formData.trip_id}
              onChange={(e) => handleInputChange("trip_id", e.target.value)}
              disabled={loading}
              className="mt-2 w-full h-12 rounded-lg border border-gray-300 px-3 bg-white"
              required
            >
              <option value="">Pilih trip...</option>
              {trips.map((trip) => (
                <option key={trip.id} value={trip.id}>
                  {trip.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <Label htmlFor="product-name">Nama Produk</Label>
            <Input
              id="product-name"
              placeholder="Contoh: KitKat Matcha"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              required
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="product-price">Harga</Label>
              <Input
                id="product-price"
                type="number"
                placeholder="50000"
                value={formData.price}
                onChange={(e) => handleInputChange("price", Number(e.target.value))}
                required
                disabled={loading}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="product-stock">Stok Awal</Label>
              <Input
                id="product-stock"
                type="number"
                placeholder="10"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", Number(e.target.value))}
                required
                disabled={loading}
                className="mt-2"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <textarea
              id="description"
              placeholder="Deskripsi produk..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              disabled={loading}
              className="mt-2 w-full h-20 rounded-lg border border-gray-300 px-3 py-2 resize-none"
            />
          </div>

          <Button type="submit" className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] h-12 font-semibold" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Produk"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
