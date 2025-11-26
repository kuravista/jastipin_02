'use client'

import { useState, useEffect, useRef } from 'react'
import { Label } from '@/components/ui/label'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

interface LocationOption {
  id: string
  name: string
}

interface AddressData {
  recipientName: string
  phone: string
  provinceId: string
  provinceName: string
  cityId: string
  cityName: string
  districtId: string
  districtName: string
  villageId?: string
  villageName?: string
  addressText: string
  postalCode?: string
  rajaOngkirDistrictId?: string  // RajaOngkir ID for shipping calculation
}

interface AddressFormProps {
  value: Partial<AddressData>
  onChange: (address: Partial<AddressData>) => void
  required?: boolean
}

export default function AddressForm({ value, onChange, required = true }: AddressFormProps) {
  const [provinces, setProvinces] = useState<LocationOption[]>([])
  const [cities, setCities] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [villages, setVillages] = useState<LocationOption[]>([])

  const [loading, setLoading] = useState({
    provinces: false,
    cities: false,
    districts: false,
    villages: false
  })

  // Track if this is initial data load to prevent clearing loaded data
  const isInitialLoadRef = useRef(true)
  const hasLoadedDataRef = useRef(false)

  // Mark as loaded when we receive full address data
  useEffect(() => {
    if (value.provinceId && value.cityId && value.districtId) {
      hasLoadedDataRef.current = true
      isInitialLoadRef.current = false
    }
  }, [value.provinceId, value.cityId, value.districtId])

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces()
  }, [])

  // Fetch cities when province changes
  useEffect(() => {
    if (value.provinceId) {
      fetchCities(value.provinceId)
    } else {
      setCities([])
      setDistricts([])
      setVillages([])
    }
  }, [value.provinceId])

  // Fetch districts when city changes
  useEffect(() => {
    if (value.cityId) {
      fetchDistricts(value.cityId)
    } else {
      setDistricts([])
      setVillages([])
    }
  }, [value.cityId])

  // Fetch villages when district changes
  useEffect(() => {
    if (value.districtId) {
      fetchVillages(value.districtId)
    } else {
      setVillages([])
    }
  }, [value.districtId])

  const fetchProvinces = async () => {
    setLoading(prev => ({ ...prev, provinces: true }))
    try {
      const response = await fetch('/api/locations/provinces')
      const data = await response.json()
      if (data.success) {
        setProvinces(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch provinces:', error)
    } finally {
      setLoading(prev => ({ ...prev, provinces: false }))
    }
  }

  const fetchCities = async (provinceId: string) => {
    setLoading(prev => ({ ...prev, cities: true }))
    try {
      const response = await fetch(`/api/locations/regencies/${provinceId}`)
      const data = await response.json()
      if (data.success) {
        setCities(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error)
    } finally {
      setLoading(prev => ({ ...prev, cities: false }))
    }
  }

  const fetchDistricts = async (cityId: string) => {
    setLoading(prev => ({ ...prev, districts: true }))
    try {
      const response = await fetch(`/api/locations/districts/${cityId}`)
      const data = await response.json()
      if (data.success) {
        setDistricts(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch districts:', error)
    } finally {
      setLoading(prev => ({ ...prev, districts: false }))
    }
  }

  const fetchVillages = async (districtId: string) => {
    setLoading(prev => ({ ...prev, villages: true }))
    try {
      const response = await fetch(`/api/locations/villages/${districtId}`)
      const data = await response.json()
      if (data.success) {
        setVillages(data.data)
      }
    } catch (error) {
      console.error('Failed to fetch villages:', error)
    } finally {
      setLoading(prev => ({ ...prev, villages: false }))
    }
  }

  const handleProvinceChange = (provinceId: string) => {
    // Don't trigger onChange if value hasn't actually changed
    if (provinceId === value.provinceId || (provinceId === '' && !value.provinceId)) {
      return
    }

    // Don't clear data if this is just loading existing data
    if (hasLoadedDataRef.current && provinceId === value.provinceId) {
      return
    }

    const province = provinces.find(p => p.id === provinceId)
    onChange({
      ...value,
      provinceId,
      provinceName: province?.name || '',
      cityId: '',
      cityName: '',
      districtId: '',
      districtName: '',
      villageId: '',
      villageName: ''
    })
  }

  const handleCityChange = (cityId: string) => {
    // Don't trigger onChange if value hasn't actually changed
    if (cityId === value.cityId || (cityId === '' && !value.cityId)) {
      return
    }

    // Don't clear data if this is just loading existing data
    if (hasLoadedDataRef.current && cityId === value.cityId) {
      return
    }

    const city = cities.find(c => c.id === cityId)
    onChange({
      ...value,
      cityId,
      cityName: city?.name || '',
      districtId: '',
      districtName: '',
      villageId: '',
      villageName: ''
    })
  }

  const handleDistrictChange = async (districtId: string) => {
    // Don't trigger onChange if value hasn't actually changed
    if (districtId === value.districtId || (districtId === '' && !value.districtId)) {
      return
    }

    // Don't clear data if this is just loading existing data
    if (hasLoadedDataRef.current && districtId === value.districtId) {
      return
    }

    const district = districts.find(d => d.id === districtId)
    const updatedAddress = {
      ...value,
      districtId,
      districtName: district?.name || '',
      villageId: '',
      villageName: ''
    }

    // Fetch RajaOngkir ID based on location name
    if (value.cityName && value.provinceName && district?.name) {
      try {
        const searchQuery = `${district.name}, ${value.cityName}, ${value.provinceName}`
        console.log('[RajaOngkir] Fetching ID for:', searchQuery)

        const response = await fetch(`/api/locations/rajaongkir/search?query=${encodeURIComponent(searchQuery)}`)
        const data = await response.json()

        console.log('[RajaOngkir] Search result:', data)

        if (data.success && data.data && data.data.length > 0) {
          // Use the first result's district ID
          const rajaOngkirId = data.data[0].districtId || data.data[0].id
          updatedAddress.rajaOngkirDistrictId = rajaOngkirId
          console.log('[RajaOngkir] Set ID to:', rajaOngkirId)
        } else {
          console.warn('[RajaOngkir] No results found')
        }
      } catch (error) {
        console.error('[RajaOngkir] Failed to fetch ID:', error)
        // Continue without RajaOngkir ID - not critical for address input
      }
    }

    onChange(updatedAddress)
  }

  const handleVillageChange = (villageId: string) => {
    // Don't trigger onChange if value hasn't actually changed
    if (villageId === value.villageId || (villageId === '' && !value.villageId)) {
      return
    }

    const village = villages.find(v => v.id === villageId)
    onChange({
      ...value,
      villageId,
      villageName: village?.name || ''
    })
  }

  const handleTextFieldChange = (field: string, newValue: string) => {
    onChange({ ...value, [field]: newValue })
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Recipient Name */}
        <div className="space-y-2">
          <Label htmlFor="recipientName">
            Nama Penerima {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="recipientName"
            value={value.recipientName || ''}
            onChange={(e) => handleTextFieldChange('recipientName', e.target.value)}
            placeholder="Nama lengkap penerima"
            required={required}
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone">
            No. HP Penerima {required && <span className="text-red-500">*</span>}
          </Label>
          <Input
            id="phone"
            type="tel"
            value={value.phone || ''}
            onChange={(e) => handleTextFieldChange('phone', e.target.value)}
            placeholder="08123456789"
            required={required}
          />
        </div>
      </div>

      {/* Province */}
      <div className="space-y-2">
        <Label htmlFor="province">
          Provinsi {required && <span className="text-red-500">*</span>}
        </Label>
        <Select 
          value={value.provinceId || ''} 
          onValueChange={handleProvinceChange}
          disabled={loading.provinces}
        >
          <SelectTrigger id="province">
            <SelectValue placeholder={loading.provinces ? "Memuat provinsi..." : "Pilih provinsi"} />
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

      {/* City/Regency */}
      <div className="space-y-2">
        <Label htmlFor="city">
          Kota/Kabupaten {required && <span className="text-red-500">*</span>}
        </Label>
        <Select 
          value={value.cityId || ''} 
          onValueChange={handleCityChange}
          disabled={!value.provinceId || loading.cities}
        >
          <SelectTrigger id="city">
            <SelectValue placeholder={
              !value.provinceId ? "Pilih provinsi terlebih dahulu" :
              loading.cities ? "Memuat kota..." :
              "Pilih kota/kabupaten"
            } />
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

      {/* District */}
      <div className="space-y-2">
        <Label htmlFor="district">
          Kecamatan {required && <span className="text-red-500">*</span>}
        </Label>
        <Select 
          value={value.districtId || ''} 
          onValueChange={handleDistrictChange}
          disabled={!value.cityId || loading.districts}
        >
          <SelectTrigger id="district">
            <SelectValue placeholder={
              !value.cityId ? "Pilih kota terlebih dahulu" :
              loading.districts ? "Memuat kecamatan..." :
              "Pilih kecamatan"
            } />
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

      {/* Village (Optional) */}
      <div className="space-y-2">
        <Label htmlFor="village">
          Kelurahan/Desa <span className="text-gray-500">(opsional)</span>
        </Label>
        <Select 
          value={value.villageId || ''} 
          onValueChange={handleVillageChange}
          disabled={!value.districtId || loading.villages}
        >
          <SelectTrigger id="village">
            <SelectValue placeholder={
              !value.districtId ? "Pilih kecamatan terlebih dahulu" :
              loading.villages ? "Memuat kelurahan..." :
              "Pilih kelurahan/desa"
            } />
          </SelectTrigger>
          <SelectContent>
            {villages.map((village) => (
              <SelectItem key={village.id} value={village.id}>
                {village.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Street Address */}
      <div className="space-y-2">
        <Label htmlFor="addressText">
          Alamat Lengkap {required && <span className="text-red-500">*</span>}
        </Label>
        <Textarea
          id="addressText"
          value={value.addressText || ''}
          onChange={(e) => handleTextFieldChange('addressText', e.target.value)}
          placeholder="Jl. Contoh No. 123, RT/RW 01/02, Patokan: Dekat masjid..."
          rows={3}
          required={required}
        />
        <p className="text-sm text-gray-500">
          Masukkan nama jalan, nomor rumah, RT/RW, dan patokan untuk memudahkan pengiriman
        </p>
      </div>

      {/* Postal Code */}
      <div className="space-y-2">
        <Label htmlFor="postalCode">
          Kode Pos <span className="text-gray-500">(opsional)</span>
        </Label>
        <Input
          id="postalCode"
          type="text"
          value={value.postalCode || ''}
          onChange={(e) => handleTextFieldChange('postalCode', e.target.value)}
          placeholder="12345"
          maxLength={5}
        />
      </div>
    </div>
  )
}
