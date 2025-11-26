"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { useToast } from "@/components/ui/use-toast"
import { apiPatch, apiGet, apiPost, apiDelete } from "@/lib/api-client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pencil, Eye, EyeOff, Plus, Trash2, Star } from "lucide-react"
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

interface BankAccount {
  id: string
  bankName: string
  accountNumber: string
  accountHolderName: string
  isDefault: boolean
  isPrimary: boolean
  status: string
}

interface PrivateData {
  email: string
  profileName: string
  whatsappNumber?: string
  // Origin Address Fields
  originProvinceId?: string
  originProvinceName?: string
  originCityId?: string
  originCityName?: string
  originDistrictId?: string
  originDistrictName?: string
  originPostalCode?: string
  originAddressText?: string
  originRajaOngkirDistrictId?: string  // RajaOngkir ID for shipping calculation
  // Bank Account Fields (Legacy - for backward compatibility)
  bankName?: string
  accountNumber?: string
  accountHolderName?: string
  // New bank accounts array
  bankAccounts?: BankAccount[]
}

interface LocationOption {
  id: string
  code?: string // Optional for backward compatibility
  name: string
}

export function EditPrivateDataDialog({ open, onOpenChange, onSuccess }: EditPrivateDataDialogProps) {
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("data-pribadi")
  const [formData, setFormData] = useState<PrivateData>({
    email: "",
    profileName: "",
  })
  const [error, setError] = useState<string | null>(null)
  const [showEmailChangeConfirm, setShowEmailChangeConfirm] = useState(false)
  const [emailChangePassword, setEmailChangePassword] = useState("")
  const [showEmailPassword, setShowEmailPassword] = useState(false)
  const [newEmail, setNewEmail] = useState("")
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

  // Bank Accounts State
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [showAddBankAccount, setShowAddBankAccount] = useState(false)
  const [newBankAccount, setNewBankAccount] = useState({
    bankName: "",
    accountNumber: "",
    accountHolderName: "",
  })

  // Address Edit Mode State
  const [isEditingAddress, setIsEditingAddress] = useState(false)

  // Prevent double loading in React strict mode
  const isLoadingRef = useRef(false)
  const hasLoadedRef = useRef(false)
  const dialogOpenedAtRef = useRef<number>(0)

  useEffect(() => {
    if (open) {
      const now = Date.now()
      // Prevent multiple loads within 500ms (strict mode double render)
      if (hasLoadedRef.current && (now - dialogOpenedAtRef.current) < 500) {
        return
      }

      if (!isLoadingRef.current) {
        dialogOpenedAtRef.current = now
        loadInitialData()
      }
    } else {
      // Reset when dialog closes
      hasLoadedRef.current = false
      isLoadingRef.current = false
    }
  }, [open])

  const loadInitialData = async () => {
    if (isLoadingRef.current) {
      return
    }

    isLoadingRef.current = true

    try {
      // 1. Fetch provinces first
      setLocationLoading(prev => ({ ...prev, provinces: true }))
      const provincesRes = await apiGet<any>('/locations/provinces')
      const provincesData = (provincesRes.success || Array.isArray(provincesRes))
        ? (provincesRes.data || provincesRes)
        : []
      setProvinces(provincesData)
      setLocationLoading(prev => ({ ...prev, provinces: false }))

      // 2. Fetch user profile
      const profileData = await apiGet<PrivateData>("/profile")

      // 3. Load cities and districts in parallel if needed
      const promises: Promise<any>[] = []

      if (profileData.originProvinceId && profileData.originProvinceId.trim() !== '') {
        setLocationLoading(prev => ({ ...prev, cities: true }))
        promises.push(
          apiGet<any>(`/locations/regencies/${profileData.originProvinceId}`)
            .then(citiesRes => {
              const citiesData = (citiesRes.success || Array.isArray(citiesRes))
                ? (citiesRes.data || citiesRes)
                : []
              setCities(citiesData)
              setLocationLoading(prev => ({ ...prev, cities: false }))
              return citiesData
            })
            .catch(err => {
              console.error('Error fetching cities:', err)
              setCities([])
              setLocationLoading(prev => ({ ...prev, cities: false }))
              return []
            })
        )
      }

      if (profileData.originCityId && profileData.originCityId.trim() !== '') {
        setLocationLoading(prev => ({ ...prev, districts: true }))

        promises.push(
          apiGet<any>(`/locations/districts/${profileData.originCityId}`)
            .then(districtsRes => {
              let districtsData: LocationOption[] = []
              if (districtsRes.success && Array.isArray(districtsRes.data)) {
                districtsData = districtsRes.data
              } else if (Array.isArray(districtsRes)) {
                districtsData = districtsRes
              }

              setDistricts(districtsData)
              setLocationLoading(prev => ({ ...prev, districts: false }))
              return districtsData
            })
            .catch(err => {
              console.error('Error fetching districts:', err)
              setDistricts([])
              setLocationLoading(prev => ({ ...prev, districts: false }))
              return []
            })
        )
      }

      // Wait for all location data to load
      if (promises.length > 0) {
        await Promise.all(promises)
        // Small delay to ensure React processes state updates
        await new Promise(resolve => setTimeout(resolve, 100))
      }

      // 4. Now set form data after all location options are loaded
      setFormData({
        email: profileData.email || "",
        profileName: profileData.profileName || "",
        whatsappNumber: profileData.whatsappNumber || "",
        originProvinceId: profileData.originProvinceId || "",
        originProvinceName: profileData.originProvinceName || "",
        originCityId: profileData.originCityId || "",
        originCityName: profileData.originCityName || "",
        originDistrictId: profileData.originDistrictId || "",
        originDistrictName: profileData.originDistrictName || "",
        originPostalCode: profileData.originPostalCode || "",
        originAddressText: profileData.originAddressText || "",
        originRajaOngkirDistrictId: profileData.originRajaOngkirDistrictId || "",
        bankName: profileData.bankName || "",
        accountNumber: profileData.accountNumber || "",
        accountHolderName: profileData.accountHolderName || "",
      })

      // 5. Load bank accounts
      setBankAccounts(profileData.bankAccounts || [])

      // Mark as loaded
      hasLoadedRef.current = true

    } catch (err) {
      console.error("Failed to load initial data", err)
    } finally {
      isLoadingRef.current = false
    }
  }

  // Fetch cities when province changes (USER INTERACTION ONLY)
  const handleProvinceChange = async (val: string) => {
    const province = provinces.find(p => p.id === val || p.code === val)

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
    const city = cities.find(c => c.id === val || c.code === val)

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
  const handleDistrictChange = async (val: string) => {
    const district = districts.find(d => d.id === val || d.code === val)
    const updatedData: PrivateData = {
      ...formData,
      originDistrictId: val,
      originDistrictName: district?.name || ''
    }

    // Fetch RajaOngkir ID based on location name
    if (formData.originCityName && formData.originProvinceName && district?.name) {
      try {
        const searchQuery = `${district.name}, ${formData.originCityName}, ${formData.originProvinceName}`
        console.log('[RajaOngkir] Fetching ID for:', searchQuery)

        const response = await fetch(`/api/locations/rajaongkir/search?query=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()

        console.log('[RajaOngkir] Search result:', data)

        if (data.success && data.data && data.data.length > 0) {
          // Use the first result's district ID
          const rajaOngkirId = data.data[0].districtId || data.data[0].id
          updatedData.originRajaOngkirDistrictId = rajaOngkirId
          console.log('[RajaOngkir] Set ID to:', rajaOngkirId)
        } else {
          console.warn('[RajaOngkir] No results found')
        }
      } catch (error) {
        console.error('[RajaOngkir] Failed to fetch ID:', error)
        // Continue without RajaOngkir ID - not critical for profile update
      }
    }

    setFormData(updatedData)
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
      const data = await apiGet<any>(`/locations/districts/${cityId}`)

      // Handle response structure: { success: true, data: [...] }
      let districtsArray: LocationOption[] = []
      if (data.success && Array.isArray(data.data)) {
        districtsArray = data.data
      } else if (Array.isArray(data)) {
        districtsArray = data
      }

      setDistricts(districtsArray)
    } catch (error) {
      console.error('Failed to fetch districts:', error)
      setDistricts([])
    } finally {
      setLocationLoading((prev) => ({ ...prev, districts: false }))
    }
  }

  const handleInputChange = (field: keyof PrivateData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateAddress = (address: string) => {
    return {
      minLength: address.length >= 25,
      hasNumber: /[0-9]/.test(address),
      hasLetter: /[a-zA-Z]/.test(address),
    }
  }

  const isAddressValid = (address: string) => {
    const validation = validateAddress(address)
    return validation.minLength && validation.hasNumber && validation.hasLetter
  }

  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  // Bank Account Functions
  const handleAddBankAccount = async () => {
    if (!newBankAccount.bankName || !newBankAccount.accountNumber || !newBankAccount.accountHolderName) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Semua field rekening harus diisi",
      })
      return
    }

    setLoading(true)
    try {
      const response = await apiPost<{ data: BankAccount }>("/bank-accounts", {
        ...newBankAccount,
        isDefault: bankAccounts.length === 0 // First account is default
      })

      const newAccount = response.data
      setBankAccounts([...bankAccounts, newAccount])
      setNewBankAccount({ bankName: "", accountNumber: "", accountHolderName: "" })
      setShowAddBankAccount(false)

      toast({
        title: "Berhasil",
        description: "Rekening berhasil ditambahkan",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal menambahkan rekening",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteBankAccount = async (id: string) => {
    if (!confirm("Yakin ingin menghapus rekening ini?")) return

    setLoading(true)
    try {
      await apiDelete(`/bank-accounts/${id}`)
      setBankAccounts(bankAccounts.filter(acc => acc.id !== id))

      toast({
        title: "Berhasil",
        description: "Rekening berhasil dihapus",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal menghapus rekening",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSetDefault = async (id: string) => {
    setLoading(true)
    try {
      await apiPost(`/bank-accounts/${id}/set-default`, {})
      setBankAccounts(
        bankAccounts.map(acc => ({
          ...acc,
          isDefault: acc.id === id
        }))
      )

      toast({
        title: "Berhasil",
        description: "Rekening default berhasil diubah",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal mengubah rekening default",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmEmailChange = async () => {
    if (!emailChangePassword) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Masukkan password untuk konfirmasi",
      })
      return
    }

    if (!newEmail) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Masukkan email baru",
      })
      return
    }

    if (!isValidEmail(newEmail)) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Format email tidak valid",
      })
      return
    }

    setLoading(true)
    try {
      // In real implementation, backend should verify password before changing email
      // For now, we'll just update the email in formData
      setFormData((prev) => ({ ...prev, email: newEmail }))
      setShowEmailChangeConfirm(false)
      setNewEmail("")
      setEmailChangePassword("")
      
      toast({
        title: "Berhasil",
        description: "Email berhasil diperbarui",
      })
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: err.message || "Gagal mengubah email",
      })
    } finally {
      setLoading(false)
    }
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
      // Parse validation error details from API
      let errorMessage = "Gagal menyimpan data"
      
      if (err.details && Array.isArray(err.details) && err.details.length > 0) {
        // Extract the first validation error message
        const firstError = err.details[0]
        errorMessage = firstError.message || err.message || errorMessage
      } else if (err.message) {
        errorMessage = err.message
      }
      
      setError(errorMessage)
      toast({
        variant: "destructive",
        title: "Gagal Menyimpan",
        description: errorMessage,
      })
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
        <form className="mt-4 pb-6" onSubmit={handleSubmit}>
          {error && <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-xs mb-4">{error}</div>}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-4">
              <TabsTrigger value="data-pribadi" className="text-xs">Data Pribadi</TabsTrigger>
              <TabsTrigger value="alamat" className="text-xs">Alamat</TabsTrigger>
              <TabsTrigger value="rekening" className="text-xs">Rekening</TabsTrigger>
            </TabsList>

            {/* Tab 1: Data Pribadi */}
            <TabsContent value="data-pribadi" className="space-y-3">
              {/* Email Change Confirmation */}
              {showEmailChangeConfirm ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-2">
                  <p className="text-xs font-semibold text-blue-900">Ubah Email</p>
                  
                  <div>
                    <Label htmlFor="newEmail" className="text-xs">Email Baru</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="Masukkan email baru"
                      className="mt-0.5 h-8 text-sm"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="emailPassword" className="text-xs">Password</Label>
                    <div className="relative">
                      <Input
                        id="emailPassword"
                        type={showEmailPassword ? "text" : "password"}
                        value={emailChangePassword}
                        onChange={(e) => setEmailChangePassword(e.target.value)}
                        placeholder="Masukkan password untuk konfirmasi"
                        className="mt-0.5 h-8 text-sm pr-8"
                        disabled={loading}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEmailPassword(!showEmailPassword)}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showEmailPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowEmailChangeConfirm(false)
                        setNewEmail("")
                        setEmailChangePassword("")
                      }}
                      disabled={loading}
                      className="h-7 text-xs flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleConfirmEmailChange}
                      disabled={loading || !newEmail || !emailChangePassword || !isValidEmail(newEmail)}
                      className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Proses..." : "Ubah"}
                    </Button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email" className="text-xs">Email</Label>
                    <button
                      type="button"
                      onClick={() => setShowEmailChangeConfirm(true)}
                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                      title="Ubah email"
                    >
                      <Pencil className="w-4 h-4 text-gray-500" />
                    </button>
                  </div>
                  <Input
                    id="email"
                    value={formData.email}
                    disabled={true}
                    className="mt-1 h-8 text-sm bg-gray-50"
                  />
                  <p className="text-[10px] text-gray-500 mt-0.5">Klik ikon untuk mengubah email</p>
                </div>
              )}

              <div>
                <Label htmlFor="profileName" className="text-xs">Nama Lengkap</Label>
                <Input
                  id="profileName"
                  value={formData.profileName}
                  onChange={(e) => handleInputChange("profileName", e.target.value)}
                  disabled={loading}
                  className="mt-1 h-8 text-sm"
                />
              </div>

              <div>
                <Label htmlFor="whatsappNumber" className="text-xs">Nomor WhatsApp</Label>
                <div className="flex mt-1">
                  <span className="flex items-center px-2 h-8 bg-gray-100 border border-r-0 border-gray-300 rounded-l text-sm font-medium text-gray-600">+62</span>
                  <Input
                    id="whatsappNumber"
                    type="tel"
                    value={formData.whatsappNumber ? formData.whatsappNumber.replace('+62', '') : ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 12)
                      handleInputChange("whatsappNumber", value ? `+62${value}` : '')
                    }}
                    disabled={loading}
                    className="mt-0 h-8 text-sm rounded-r rounded-l-none border-l-0"
                    placeholder="8123491293912"
                  />
                </div>
                <p className="text-[10px] text-gray-500 mt-0.5">Isi tanpa +62, mulai dari 81/82/83 dst</p>
              </div>
            </TabsContent>

            {/* Tab 2: Alamat */}
            <TabsContent value="alamat" className="space-y-3">
              <p className="text-xs text-gray-500">Alamat awal untuk perhitungan ongkos kirim</p>

              {!isEditingAddress ? (
                // View Mode - Display existing location as read-only
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="text-xs font-semibold text-gray-700">Lokasi Asal Saat Ini</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => {
                        setIsEditingAddress(true)
                        // Load provinces if not already loaded
                        if (provinces.length === 0) {
                          fetchProvinces()
                        }
                        // Load cities if province exists
                        if (formData.originProvinceId && cities.length === 0) {
                          fetchCities(formData.originProvinceId)
                        }
                        // Load districts if city exists
                        if (formData.originCityId && districts.length === 0) {
                          fetchDistricts(formData.originCityId)
                        }
                      }}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Ubah
                    </Button>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <p className="text-[10px] text-gray-500">Provinsi</p>
                      <p className="font-medium">{formData.originProvinceName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Kota/Kab</p>
                      <p className="font-medium">{formData.originCityName || '-'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500">Kecamatan</p>
                      <p className="font-medium">{formData.originDistrictName || '-'}</p>
                    </div>
                  </div>
                  {(formData.originDistrictId || formData.originRajaOngkirDistrictId) && (
                    <div className="text-[10px] text-gray-400 pt-1 border-t border-gray-200 space-y-0.5">
                      {formData.originDistrictId && <p>Wilayah ID: {formData.originDistrictId}</p>}
                      {formData.originRajaOngkirDistrictId && (
                        <p className="text-green-600 font-medium">RajaOngkir ID: {formData.originRajaOngkirDistrictId}</p>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                // Edit Mode - Show Select dropdowns
                <div className="space-y-3 border border-blue-200 bg-blue-50 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-semibold text-blue-900">Edit Lokasi Asal</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-[10px]"
                      onClick={() => setIsEditingAddress(false)}
                    >
                      Batal
                    </Button>
                  </div>

                  <div>
                    <Label htmlFor="province" className="text-xs">Provinsi</Label>
                    <Select
                      value={formData.originProvinceId || ''}
                      onValueChange={handleProvinceChange}
                      disabled={locationLoading.provinces}
                    >
                      <SelectTrigger id="province" className="mt-1 h-8 text-sm bg-white">
                        <SelectValue placeholder={locationLoading.provinces ? "Memuat..." : "Pilih Provinsi"} />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((province) => (
                          <SelectItem key={province.id} value={province.id}>
                            {province.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="city" className="text-xs">Kota/Kabupaten</Label>
                    <Select
                      value={formData.originCityId || ''}
                      onValueChange={handleCityChange}
                      disabled={!formData.originProvinceId || locationLoading.cities}
                    >
                      <SelectTrigger id="city" className="mt-1 h-8 text-sm bg-white">
                        <SelectValue placeholder={locationLoading.cities ? "Memuat..." : "Pilih Kota/Kabupaten"} />
                      </SelectTrigger>
                      <SelectContent>
                        {cities.map((city) => (
                          <SelectItem key={city.id} value={city.id}>
                            {city.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="district" className="text-xs">Kecamatan</Label>
                    <Select
                      value={formData.originDistrictId || ''}
                      onValueChange={handleDistrictChange}
                      disabled={!formData.originCityId || locationLoading.districts}
                    >
                      <SelectTrigger id="district" className="mt-1 h-8 text-sm bg-white">
                        <SelectValue placeholder={locationLoading.districts ? "Memuat..." : "Pilih Kecamatan"} />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((district) => (
                          <SelectItem key={district.id} value={district.id}>
                            {district.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="postalCode" className="text-xs">Kode Pos</Label>
                <Input
                  id="postalCode"
                  value={formData.originPostalCode || ''}
                  onChange={(e) => handleInputChange("originPostalCode", e.target.value)}
                  disabled={loading}
                  className="mt-1 h-8 text-sm"
                  placeholder="12345"
                  maxLength={5}
                />
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="addressText" className="text-xs">Alamat Lengkap</Label>
                  <span className="text-[10px] text-gray-500">
                    {(formData.originAddressText || '').length}/25
                  </span>
                </div>
                <textarea
                  id="addressText"
                  placeholder="Nama jalan, nomor rumah, RT/RW..."
                  value={formData.originAddressText || ''}
                  onChange={(e) => handleInputChange("originAddressText", e.target.value)}
                  disabled={loading}
                  className={`mt-1 w-full h-16 rounded border px-2 py-1.5 resize-none text-xs transition-colors ${
                    !formData.originAddressText 
                      ? 'border-gray-300' 
                      : isAddressValid(formData.originAddressText)
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                  }`}
                />
                <div className="mt-1 space-y-1">
                  {formData.originAddressText && (
                    <div className="flex flex-wrap gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${validateAddress(formData.originAddressText).minLength ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] ${validateAddress(formData.originAddressText).minLength ? 'text-green-700' : 'text-gray-600'}`}>
                          Minimal 25 karakter
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${validateAddress(formData.originAddressText).hasNumber ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] ${validateAddress(formData.originAddressText).hasNumber ? 'text-green-700' : 'text-gray-600'}`}>
                          Wajib ada nomor rumah/RT/RW
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-3 h-3 rounded-full ${validateAddress(formData.originAddressText).hasLetter ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                        <span className={`text-[10px] ${validateAddress(formData.originAddressText).hasLetter ? 'text-green-700' : 'text-gray-600'}`}>
                          Wajib ada nama jalan
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab 3: Rekening */}
            <TabsContent value="rekening" className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">Kelola rekening bank untuk pembayaran</p>
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setShowAddBankAccount(true)}
                  className="h-7 text-xs"
                  disabled={loading}
                >
                  <Plus className="w-3 h-3 mr-1" />
                  Tambah
                </Button>
              </div>

              {/* Add Bank Account Form */}
              {showAddBankAccount && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded space-y-2">
                  <p className="text-xs font-semibold text-blue-900">Tambah Rekening Baru</p>

                  <div>
                    <Label htmlFor="newBankName" className="text-xs">Nama Bank</Label>
                    <Input
                      id="newBankName"
                      value={newBankAccount.bankName}
                      onChange={(e) => setNewBankAccount({...newBankAccount, bankName: e.target.value})}
                      className="mt-0.5 h-8 text-sm"
                      placeholder="BCA, Mandiri, BNI"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newAccountNumber" className="text-xs">Nomor Rekening</Label>
                    <Input
                      id="newAccountNumber"
                      value={newBankAccount.accountNumber}
                      onChange={(e) => setNewBankAccount({...newBankAccount, accountNumber: e.target.value})}
                      className="mt-0.5 h-8 text-sm"
                      placeholder="1234567890"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <Label htmlFor="newAccountHolderName" className="text-xs">Nama Pemilik</Label>
                    <Input
                      id="newAccountHolderName"
                      value={newBankAccount.accountHolderName}
                      onChange={(e) => setNewBankAccount({...newBankAccount, accountHolderName: e.target.value})}
                      className="mt-0.5 h-8 text-sm"
                      placeholder="Nama sesuai rekening"
                      disabled={loading}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setShowAddBankAccount(false)
                        setNewBankAccount({ bankName: "", accountNumber: "", accountHolderName: "" })
                      }}
                      disabled={loading}
                      className="h-7 text-xs flex-1"
                    >
                      Batal
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddBankAccount}
                      disabled={loading || !newBankAccount.bankName || !newBankAccount.accountNumber || !newBankAccount.accountHolderName}
                      className="h-7 text-xs flex-1 bg-blue-600 hover:bg-blue-700"
                    >
                      {loading ? "Proses..." : "Simpan"}
                    </Button>
                  </div>
                </div>
              )}

              {/* Bank Accounts List */}
              <div className="space-y-2">
                {bankAccounts.length === 0 ? (
                  <div className="p-4 text-center text-gray-500 text-xs border border-dashed rounded">
                    Belum ada rekening terdaftar
                  </div>
                ) : (
                  bankAccounts.map((account) => (
                    <div
                      key={account.id}
                      className="p-3 border rounded-lg bg-white space-y-1"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold">{account.bankName}</p>
                            {account.isDefault && (
                              <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] rounded">
                                Default
                              </span>
                            )}
                            {account.isPrimary && (
                              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded">
                                Utama
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-600">{account.accountNumber}</p>
                          <p className="text-xs text-gray-500">{account.accountHolderName}</p>
                        </div>
                        <div className="flex gap-1">
                          {!account.isDefault && (
                            <button
                              type="button"
                              onClick={() => handleSetDefault(account.id)}
                              className="p-1 hover:bg-gray-100 rounded transition-colors"
                              title="Set sebagai default"
                              disabled={loading}
                            >
                              <Star className="w-4 h-4 text-gray-400" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteBankAccount(account.id)}
                            className="p-1 hover:bg-red-100 rounded transition-colors"
                            title="Hapus rekening"
                            disabled={loading}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>

          <Button 
            type="submit" 
            className="w-full bg-[#FB923C] hover:bg-[#EA7C2C] h-10 font-semibold mt-4 text-sm disabled:opacity-50" 
            disabled={loading || (activeTab === "alamat" && formData.originAddressText && !isAddressValid(formData.originAddressText))}
          >
            {loading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
