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
import { Camera, Trash2 } from "lucide-react"

interface EditProductDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
  product?: {
    id: string
    title: string
    price: number
    stock: number
    description?: string
    image?: string
    type?: 'goods' | 'tasks'
    tripId?: string
    Trip?: {
      title: string
      paymentType?: 'full' | 'dp'
      dpPercentage?: number
    }
  }
}

interface ProductFormData {
  title: string
  price: number
  stock: number
  description: string
  type: 'goods' | 'tasks'
}

export function EditProductDialog({ open, onOpenChange, onSuccess, product }: EditProductDialogProps) {
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [formData, setFormData] = useState<ProductFormData>({
    title: "",
    price: 0,
    stock: 0,
    description: "",
    type: "goods",
  })
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    if (product && open) {
      setFormData({
        title: product.title || "",
        price: product.price || 0,
        stock: product.stock || 0,
        description: product.description || "",
        type: product.type || "goods",
      })
      setPreviewImage(product.image || null)
    }
  }, [product, open])

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
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

  const removeImage = () => {
    setPreviewImage(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product?.id) return

    setLoading(true)
    setError(null)

    try {
      await apiPatch(`/products/${product.id}`, {
        title: formData.title,
        price: formData.price,
        stock: formData.stock,
        description: formData.description,
        type: formData.type,
        image: previewImage,
      })

      toast({
        title: "Produk Berhasil Diperbarui!",
        description: `"${formData.title}" telah diperbarui.`,
        variant: "success",
      })

      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || "Gagal memperbarui produk"
      setError(errorMsg)
      toast({
        title: "Gagal Memperbarui Produk",
        description: errorMsg,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteConfirm = async () => {
    if (!product?.id) return

    setDeleting(true)
    setError(null)

    try {
      await apiDelete(`/products/${product.id}`)
      toast({
        title: "Produk Berhasil Dihapus!",
        description: `"${product?.title}" telah dihapus.`,
        variant: "success",
      })
      setShowDeleteConfirm(false)
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || "Gagal menghapus produk"
      setError(errorMsg)
      toast({
        title: "Gagal Menghapus Produk",
        description: errorMsg,
        variant: "destructive",
      })
      setShowDeleteConfirm(false)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto px-4 sm:px-6">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-lg">Edit Produk</SheetTitle>
          <SheetDescription className="text-sm">Ubah informasi produk Anda</SheetDescription>
        </SheetHeader>
        <form className="space-y-3 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs">{error}</div>}

          {/* Image Upload Section */}
          <div>
            <Label className="text-sm">Gambar</Label>
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

          {/* Trip Information - Read Only */}
          {product?.Trip && (
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Trip</p>
                  <p className="text-sm font-semibold text-gray-900">{product.Trip.title}</p>
                </div>
                <div>
                  {product.Trip.paymentType === 'dp' ? (
                    <div className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-[10px] font-bold whitespace-nowrap">
                      💳 DP {product.Trip.dpPercentage || 20}%
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-[10px] font-bold whitespace-nowrap">
                      💰 Full Payment
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

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
              <Label htmlFor="title" className="text-sm">Nama Produk</Label>
              <Input
                id="title"
                placeholder="Nama produk"
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                disabled={loading}
                className="mt-1.5 h-10"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="price" className="text-sm">Harga</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={formData.price || ""}
                onChange={(e) => handleInputChange("price", Number(e.target.value))}
                disabled={loading}
                className="mt-1.5 h-10"
              />
            </div>
            <div>
              <Label htmlFor="stock" className="text-sm">Stok</Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                value={formData.stock || ""}
                onChange={(e) => handleInputChange("stock", Number(e.target.value))}
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

          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-10 font-semibold"
              disabled={loading || deleting}
            >
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="h-10 w-10"
              onClick={() => setShowDeleteConfirm(true)}
              disabled={loading || deleting}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </form>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
          <AlertDialogContent className="max-w-[90%] sm:max-w-md">
            <AlertDialogHeader className="space-y-2">
              <AlertDialogTitle className="text-base">Hapus Produk</AlertDialogTitle>
              <AlertDialogDescription className="text-sm">
                Yakin hapus "{product?.title}"? Tindakan ini tidak bisa dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end pt-2">
              <AlertDialogCancel disabled={deleting} className="h-9">Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700 h-9"
              >
                {deleting ? "Menghapus..." : "Hapus"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}
