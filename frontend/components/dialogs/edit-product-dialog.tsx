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
import { Camera, Trash2, Trash } from "lucide-react"

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
  }
}

interface ProductFormData {
  title: string
  price: number
  stock: number
  description: string
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
      <SheetContent side="bottom" className="rounded-t-3xl max-h-[90vh] overflow-y-auto px-6">
        <SheetHeader>
          <SheetTitle>Edit Produk</SheetTitle>
          <SheetDescription>Ubah informasi produk Anda</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          {/* Image Upload Section */}
          <div>
            <Label>Gambar Produk</Label>
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
          </div>

          <div>
            <Label htmlFor="title">Nama Produk</Label>
            <Input
              id="title"
              placeholder="Nama produk"
              value={formData.title}
              onChange={(e) => handleInputChange("title", e.target.value)}
              disabled={loading}
              className="mt-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Harga</Label>
              <Input
                id="price"
                type="number"
                placeholder="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", Number(e.target.value))}
                disabled={loading}
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="stock">Stok</Label>
              <Input
                id="stock"
                type="number"
                placeholder="0"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", Number(e.target.value))}
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
              className="mt-2 w-full h-24 rounded-lg border border-gray-300 px-3 py-2 resize-none"
            />
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <Button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 h-11 font-semibold"
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
              <AlertDialogTitle>Hapus Produk</AlertDialogTitle>
              <AlertDialogDescription>
                Apakah Anda yakin ingin menghapus produk "{product?.title}"? Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-2 justify-end">
              <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Menghapus..." : "Hapus Produk"}
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  )
}
