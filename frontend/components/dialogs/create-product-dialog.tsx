"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { apiPost, apiPatch, apiGet } from "@/lib/api-client"
import { getRandomProductImage } from "@/lib/image.utils"
import { uploadImage } from "@/lib/image-upload"
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
  stock: number | null
  isUnlimitedStock: boolean
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
    isUnlimitedStock: false,
    description: "",
    tripId: "",
    type: "goods",
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingStep, setLoadingStep] = useState<string>("")
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

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB')
      return
    }

    // Store file for later upload after product is created
    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setPreviewImage(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeImage = () => {
    setPreviewImage(null)
    setSelectedFile(null)
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
      setLoadingStep("Menyimpan produk...")
      
      // Create product first without image
      const response = await apiPost<{ id: string }>("/products", {
        ...formData,
        stock: formData.isUnlimitedStock ? null : formData.stock,
        image: getRandomProductImage(), // Temporary default image
      })
      
      const productId = response.id
      
      // Upload image with real productId if file selected
      if (selectedFile && productId) {
        setLoadingStep("Mengupload gambar...")
        const { url } = await uploadImage(selectedFile, 'products', productId)
        
        setLoadingStep("Memperbarui produk...")
        // Update product with real image URL
        await apiPatch(`/products/${productId}`, { image: url })
      }
      
      setLoadingStep("")
      
      toast({
        title: "Produk Berhasil Dibuat!",
        description: `"${formData.title}" telah ditambahkan.`,
        variant: "success",
      })
      
      setFormData({
        title: "",
        price: 0,
        stock: 0,
        isUnlimitedStock: false,
        description: "",
        tripId: "",
        type: "goods",
      })
      setPreviewImage(null)
      setSelectedFile(null)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setLoadingStep("")
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

            <div className="flex items-end">
              <div className="flex items-center justify-between w-full p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex flex-col">
                  <Label className="text-sm font-semibold text-blue-900">Unlimited</Label>
                  <p className="text-[10px] text-blue-700">Tanpa batas stok</p>
                </div>
                <Switch
                  checked={formData.isUnlimitedStock}
                  onCheckedChange={(checked) => {
                    handleInputChange("isUnlimitedStock", checked)
                    if (checked) {
                      handleInputChange("stock", null)
                    }
                  }}
                  disabled={loading}
                />
              </div>
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
                value={formData.isUnlimitedStock ? "" : (formData.stock || "")}
                onChange={(e) => handleInputChange("stock", e.target.value ? Number(e.target.value) : null)}
                disabled={loading || formData.isUnlimitedStock}
                className="mt-1.5 h-10 disabled:bg-gray-100"
              />
            </div>
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
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {loadingStep || "Menyimpan..."}
              </span>
            ) : "Simpan Produk"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
