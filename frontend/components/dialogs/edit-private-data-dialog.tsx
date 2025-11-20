"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { apiPatch, apiGet } from "@/lib/api-client"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface EditPrivateDataDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface PrivateData {
  email: string
  profileName: string // Used as full name for now
  // Origin Address Fields
  originProvinceId?: string
  originProvinceName?: string
  originCityId?: string
  originCityName?: string
  originDistrictId?: string
  originDistrictName?: string
  originPostalCode?: string
  originAddressText?: string
}

interface LocationOption {
  code: string
  name: string
}

export function EditPrivateDataDialog({ open, onOpenChange, onSuccess }: EditPrivateDataDialogProps) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PrivateData>({
    email: "",
    profileName: "",
  })
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  // Location State
  const [provinces, setProvinces] = useState<LocationOption[]>([])
  const [cities, setCities] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [locationLoading, setLocationLoading] = useState({
    provinces: false,
    cities: false,
    districts: false,
  })

  useEffect(() => {
    if (open) {
      loadInitialData()
    }
  }, [open])

  // Debug: Log districts state changes
  useEffect(() => {
    console.log('[EditPrivateDataDialog] Districts state updated:', districts)
  }, [districts])

  const loadInitialData = async () => {
    try {
      // Reset state
      setFormData({ email: "", profileName: "" })
      setCities([])
      setDistricts([])
      
      // 1. Fetch provinces
      setLocationLoading(prev => ({ ...prev, provinces: true }))
      const provincesRes = await apiGet<any>('/locations/provinces')
      const provincesData = (provincesRes.success || Array.isArray(provincesRes)) 
        ? (provincesRes.data || provincesRes) 
        : []
      setProvinces(provincesData)
      setLocationLoading(prev => ({ ...prev, provinces: false }))

      // 2. Fetch user profile
      const profileData = await apiGet<PrivateData>("/profile")
      
      // 3. Load dependent cities if province exists and is valid
      if (profileData.originProvinceId && profileData.originProvinceId.trim() !== '') {
        setLocationLoading(prev => ({ ...prev, cities: true }))
        const citiesRes = await apiGet<any>(`/locations/regencies/${profileData.originProvinceId}`)
        const citiesData = (citiesRes.success || Array.isArray(citiesRes)) 
          ? (citiesRes.data || citiesRes) 
          : []
        setCities(citiesData)
        setLocationLoading(prev => ({ ...prev, cities: false }))
      }

      // 4. Load dependent districts if city exists and is valid
      if (profileData.originCityId && profileData.originCityId.trim() !== '') {
        setLocationLoading(prev => ({ ...prev, districts: true }))
        console.log('[EditPrivateDataDialog] Loading initial districts for cityId:', profileData.originCityId)
        
        try {
          const districtsRes = await apiGet<any>(`/locations/districts/${profileData.originCityId}`)
          console.log('[EditPrivateDataDialog] Initial districts API response:', districtsRes)
          
          // Handle response structure consistently
          let districtsData: LocationOption[] = []
          if (districtsRes.success && Array.isArray(districtsRes.data)) {
            districtsData = districtsRes.data
          } else if (Array.isArray(districtsRes)) {
            districtsData = districtsRes
          }
          
          console.log('[EditPrivateDataDialog] Setting initial districts:', districtsData)
          
          // Use a small delay to ensure state update completes before formData is set
          setDistricts(districtsData)
          
          // Wait for next tick to ensure React has processed the state update
          await new Promise(resolve => setTimeout(resolve, 50))
        } catch (districtError) {
          console.error('[EditPrivateDataDialog] Error fetching districts:', districtError)
          setDistricts([])
        } finally {
          setLocationLoading(prev => ({ ...prev, districts: false }))
        }
      }

      // 5. Set form data (now that options are loaded)
      console.log('[EditPrivateDataDialog] Profile data loaded:', {
        originProvinceId: profileData.originProvinceId,
        originCityId: profileData.originCityId,
        originDistrictId: profileData.originDistrictId
      })
      
      setFormData({
        email: profileData.email || "",
        profileName: profileData.profileName || "",
        originProvinceId: profileData.originProvinceId || "",
        originProvinceName: profileData.originProvinceName || "",
        originCityId: profileData.originCityId || "",
        originCityName: profileData.originCityName || "",
        originDistrictId: profileData.originDistrictId || "",
        originDistrictName: profileData.originDistrictName || "",
        originPostalCode: profileData.originPostalCode || "",
        originAddressText: profileData.originAddressText || "",
      })

    } catch (err) {
      console.error("Failed to load initial data", err)
    }
  }

  // Fetch cities when province changes (USER INTERACTION ONLY)
  const handleProvinceChange = async (val: string) => {
    const province = provinces.find(p => p.code === val)
    
    // Update form data
    setFormData(prev => ({
      ...prev,
      originProvinceId: val,
      originProvinceName: province?.name || '',
      originCityId: '',
      originCityName: '',
      originDistrictId: '',
      originDistrictName: ''
    }))

    // Clear dependent arrays
    setCities([])
    setDistricts([])

    // Fetch new cities
    if (val) {
      fetchCities(val)
    }
  }

  // Fetch districts when city changes (USER INTERACTION ONLY)
  const handleCityChange = async (val: string) => {
    const city = cities.find(c => c.code === val)
    
    setFormData(prev => ({
      ...prev,
      originCityId: val,
      originCityName: city?.name || '',
      originDistrictId: '',
      originDistrictName: ''
    }))

    setDistricts([])

    if (val) {
      fetchDistricts(val)
    }
  }

  // Handle district change
  const handleDistrictChange = (val: string) => {
    const district = districts.find(d => d.code === val)
    setFormData(prev => ({
      ...prev,
      originDistrictId: val,
      originDistrictName: district?.name || ''
    }))
  }

  const fetchProvinces = async () => {
    setLocationLoading((prev) => ({ ...prev, provinces: true }))
    try {
      const data = await apiGet<any>('/locations/provinces')
      if (data.success || Array.isArray(data)) {
        setProvinces(data.data || data)
      }
    } catch (error) {
      console.error('Failed to fetch provinces:', error)
    } finally {
      setLocationLoading((prev) => ({ ...prev, provinces: false }))
    }
  }

  const fetchCities = async (provinceId: string) => {
    setLocationLoading((prev) => ({ ...prev, cities: true }))
    try {
      const data = await apiGet<any>(`/locations/regencies/${provinceId}`)
      if (data.success || Array.isArray(data)) {
        setCities(data.data || data)
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error)
    } finally {
      setLocationLoading((prev) => ({ ...prev, cities: false }))
    }
  }

  const fetchDistricts = async (cityId: string) => {
    setLocationLoading((prev) => ({ ...prev, districts: true }))
    try {
      console.log('[EditPrivateDataDialog] Fetching districts for cityId:', cityId)
      const data = await apiGet<any>(`/locations/districts/${cityId}`)
      console.log('[EditPrivateDataDialog] Districts API response:', data)
      
      // Handle response structure: { success: true, data: [...] }
      let districtsArray: LocationOption[] = []
      if (data.success && Array.isArray(data.data)) {
        districtsArray = data.data
      } else if (Array.isArray(data)) {
        districtsArray = data
      }
      
      console.log('[EditPrivateDataDialog] Setting districts array:', districtsArray)
      setDistricts(districtsArray)
    } catch (error) {
      console.error('[EditPrivateDataDialog] Failed to fetch districts:', error)
      setDistricts([]) // Ensure empty array on error
    } finally {
      setLocationLoading((prev) => ({ ...prev, districts: false }))
    }
  }

  const handleInputChange = (field: keyof PrivateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await apiPatch("/profile", formData)
      toast({
        title: "Data Tersimpan",
        description: "Informasi pribadi berhasil diperbarui",
        variant: "success",
      })
      onOpenChange(false)
      onSuccess?.()
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-6 max-h-[90vh] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Informasi Pribadi</SheetTitle>
          <SheetDescription>Kelola data pribadi dan alamat pengiriman Anda</SheetDescription>
        </SheetHeader>
        <form className="mt-6 space-y-6 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Data Diri</h3>
            
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData.email}
                disabled={true}
                className="mt-2 bg-gray-50"
              />
              <p className="text-xs text-gray-500 mt-1">Email tidak dapat diubah</p>
            </div>

            <div>
              <Label htmlFor="profileName">Nama Lengkap</Label>
              <Input
                id="profileName"
                value={formData.profileName}
                onChange={(e) => handleInputChange("profileName", e.target.value)}
                disabled={loading}
                className="mt-2"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900 border-b pb-2">Alamat Pengiriman (Asal)</h3>
            <p className="text-sm text-gray-500">Alamat ini digunakan sebagai titik awal perhitungan ongkos kirim.</p>
            
            {/* Province */}
            <div className="mb-3">
              <Label htmlFor="province">Provinsi</Label>
              <Select 
                value={formData.originProvinceId || ''} 
                onValueChange={handleProvinceChange}
                disabled={locationLoading.provinces}
              >
                <SelectTrigger id="province" className="mt-1">
                  <SelectValue placeholder={locationLoading.provinces ? "Memuat..." : "Pilih Provinsi"} />
                </SelectTrigger>
                <SelectContent>
                  {provinces.map((province) => (
                    <SelectItem key={province.code} value={province.code}>
                      {province.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* City */}
            <div className="mb-3">
              <Label htmlFor="city">Kota/Kabupaten</Label>
              <Select 
                value={formData.originCityId || ''} 
                onValueChange={handleCityChange}
                disabled={!formData.originProvinceId || locationLoading.cities}
              >
                <SelectTrigger id="city" className="mt-1">
                  <SelectValue placeholder={locationLoading.cities ? "Memuat..." : "Pilih Kota/Kabupaten"} />
                </SelectTrigger>
                <SelectContent>
                  {cities.map((city) => (
                    <SelectItem key={city.code} value={city.code}>
                      {city.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* District */}
            <div className="mb-3">
              <Label htmlFor="district">Kecamatan</Label>
              <Select 
                key={`district-${districts.length}-${formData.originCityId}`}
                value={formData.originDistrictId || ''} 
                onValueChange={handleDistrictChange}
                disabled={!formData.originCityId || locationLoading.districts}
              >
                <SelectTrigger id="district" className="mt-1">
                  <SelectValue placeholder={locationLoading.districts ? "Memuat..." : "Pilih Kecamatan"} />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((district) => (
                    <SelectItem key={district.code} value={district.code}>
                      {district.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Postal Code */}
            <div className="mb-3">
              <Label htmlFor="postalCode">Kode Pos</Label>
              <Input
                id="postalCode"
                value={formData.originPostalCode || ''}
                onChange={(e) => handleInputChange("originPostalCode", e.target.value)}
                disabled={loading}
                className="mt-1"
                placeholder="Contoh: 12345"
                maxLength={5}
              />
            </div>

             {/* Address Text */}
             <div>
              <Label htmlFor="addressText">Alamat Lengkap</Label>
              <textarea
                id="addressText"
                placeholder="Nama jalan, nomor rumah, RT/RW..."
                value={formData.originAddressText || ''}
                onChange={(e) => handleInputChange("originAddressText", e.target.value)}
                disabled={loading}
                className="mt-1 w-full h-20 rounded-lg border border-gray-300 px-3 py-2 resize-none text-sm"
              />
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-12 font-semibold" disabled={loading}>
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
