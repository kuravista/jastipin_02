"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { apiPost } from "@/lib/api-client"

interface CreateTripDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface TripFormData {
  title: string
  description: string
  startDate: string
  deadline: string
  isActive: boolean
}

/**
 * Dialog component for creating a new trip
 * @param open - Whether dialog is open
 * @param onOpenChange - Callback to change open state
 * @param onSuccess - Callback when trip is successfully created
 */
export function CreateTripDialog({ open, onOpenChange, onSuccess }: CreateTripDialogProps) {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  
  const getTodayDate = () => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  }

  const getDatePlusDays = (days: number) => {
    const date = new Date()
    date.setDate(date.getDate() + days)
    return date.toISOString().split('T')[0]
  }

  const [formData, setFormData] = useState<TripFormData>({
    title: "",
    description: "",
    startDate: getTodayDate(),
    deadline: getDatePlusDays(3),
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)

  const handleInputChange = (field: keyof TripFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // Auto-generate slug from title
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      
      await apiPost("/trips", {
        title: formData.title,
        description: formData.description,
        startDate: formData.startDate,
        deadline: formData.deadline,
        slug: slug || 'trip',
      })
      toast({
        title: "Trip Berhasil Dibuat!",
        description: `"${formData.title}" telah ditambahkan.`,
        variant: "success",
      })
      setFormData({ 
        title: "", 
        description: "", 
        startDate: getTodayDate(),
        deadline: getDatePlusDays(3),
        isActive: true,
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      const errorMsg = err.message || "Gagal membuat trip"
      setError(errorMsg)
      toast({
        title: "Gagal Membuat Trip",
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
          <SheetTitle>Buat Trip Baru</SheetTitle>
          <SheetDescription>Tambahkan trip jastip baru Anda</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-4 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

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
              <p className="text-xs text-gray-500 mt-1">Default hari ini</p>
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
              <p className="text-xs text-gray-500 mt-1">Default +3 hari</p>
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-12 font-semibold" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Trip"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
