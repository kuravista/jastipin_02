"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { apiPost, apiPatch } from "@/lib/api-client"
import { uploadImage } from "@/lib/image-upload"
import { ImageIcon, Trash2, Calendar } from "lucide-react"

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
  url_img?: string
  paymentType: 'full' | 'dp'
  isLifetime: boolean
}

// Helper functions for date handling
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0]
}

function getDatePlusDays(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

export function CreateTripDialog({ open, onOpenChange, onSuccess }: CreateTripDialogProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [dpPercentage, setDpPercentage] = useState(30)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  
  const [formData, setFormData] = useState<TripFormData>({
    title: "",
    description: "",
    startDate: getTodayDate(),
    deadline: getDatePlusDays(3),
    isActive: true,
    paymentType: 'full',
    isLifetime: false
  })

  const handleInputChange = (field: keyof TripFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      toast({
        variant: "destructive",
        title: "File terlalu besar",
        description: "Maksimal 5MB",
      })
      return
    }

    // Store file for later upload after trip is created
    setSelectedFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const [loadingStep, setLoadingStep] = useState<string>("")
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      // Note: We send undefined slug to let backend generate the short unique slug (max 15 chars)
      // backend logic: truncated-title(10) + '-' + random(4)
      
      setLoadingStep("Menyimpan trip...")
      
      const payload: any = {
        title: formData.title,
        description: formData.description,
        startDate: formData.isLifetime ? null : new Date(formData.startDate).toISOString(),
        deadline: formData.isLifetime ? null : new Date(formData.deadline).toISOString(),
        paymentType: formData.paymentType,
        dpPercentage: formData.paymentType === 'dp' ? dpPercentage : undefined,
        slug: undefined, // Let backend generate short slug
        isActive: formData.isActive,
      }

      // Create trip first to get tripId
      const response = await apiPost<{ id: string }>("/trips", payload)
      const tripId = response.id

      // Upload image with real tripId if file selected
      if (selectedFile && tripId) {
        setLoadingStep("Mengupload gambar...")
        setUploadProgress(0)
        
        const { url } = await uploadImage(
          selectedFile, 
          'trips', 
          tripId,
          (progress) => setUploadProgress(progress.percent)
        )
        
        setLoadingStep("Memperbarui trip...")
        // Update trip with image URL
        await apiPatch(`/trips/${tripId}`, { url_img: url })
      }
      
      setLoadingStep("")
      setUploadProgress(0)
      
      toast({
        title: "Trip berhasil dibuat",
        description: "Trip baru telah ditambahkan",
      })
      
      setFormData({ 
        title: "", 
        description: "", 
        startDate: getTodayDate(),
        deadline: getDatePlusDays(3),
        isActive: true,
        url_img: undefined,
        paymentType: 'full',
        isLifetime: false
      })
      setImagePreview(null)
      setSelectedFile(null)
      setDpPercentage(30)
      
      onOpenChange(false)
      onSuccess?.()
    } catch (error: any) {
      setLoadingStep("")
      setUploadProgress(0)
      toast({
        variant: "destructive",
        title: "Gagal membuat trip",
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
          <SheetTitle className="text-lg font-bold">Buat Trip Baru</SheetTitle>
          <SheetDescription className="text-sm text-gray-500">
            Tambahkan trip baru untuk jastip Anda
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
                  max={90}
                  step={5}
                  className="w-full"
                  disabled={loading}
                />
                <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                  <span>Min: 10%</span>
                  <span>Max: 90%</span>
                </div>
              </div>
            )}
          </div>

          {loading && uploadProgress > 0 && uploadProgress < 100 && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-gray-600">
                <span>Mengupload gambar...</span>
                <span className="font-medium">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-[#FB923C] h-2 transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-10 font-semibold text-sm" 
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {loadingStep || "Menyimpan..."}
                {uploadProgress > 0 && ` (${uploadProgress}%)`}
              </span>
            ) : "Simpan Trip"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
