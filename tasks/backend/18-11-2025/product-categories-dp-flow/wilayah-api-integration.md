# Wilayah.id API Integration

**API Base URL**: `https://wilayah.id/api/`  
**Purpose**: Structured location data for Indonesia (provinces, cities, districts, villages)  
**Status**: Required for address input

---

## 📍 Why Wilayah.id?

**Advantages**:
- ✅ Free and open-source
- ✅ Complete Indonesia location data
- ✅ Hierarchical structure (province → city → district → village)
- ✅ Standard BPS codes
- ✅ No API key required
- ✅ JSON format

**Use Case**:
- Penitip address selection during checkout
- Standardized address format
- Easy shipping calculation with RajaOngkir (using district/city codes)

---

## 🔌 API Endpoints

### 1. Get Provinces
```bash
GET https://wilayah.id/api/provinces.json

Response:
{
  "data": [
    { "code": "11", "name": "ACEH" },
    { "code": "12", "name": "SUMATERA UTARA" },
    { "code": "31", "name": "DKI JAKARTA" },
    ...
  ]
}
```

### 2. Get Cities/Regencies by Province
```bash
GET https://wilayah.id/api/regencies/{provinceId}.json

Example: /api/regencies/31.json (DKI Jakarta)

Response:
{
  "data": [
    { "code": "3171", "name": "KOTA JAKARTA SELATAN" },
    { "code": "3172", "name": "KOTA JAKARTA TIMUR" },
    ...
  ]
}
```

### 3. Get Districts/Kecamatan by City
```bash
GET https://wilayah.id/api/districts/{cityId}.json

Example: /api/districts/3171.json (Jakarta Selatan)

Response:
{
  "data": [
    { "code": "317101", "name": "KEBAYORAN BARU" },
    { "code": "317102", "name": "KEBAYORAN LAMA" },
    ...
  ]
}
```

### 4. Get Villages/Kelurahan by District (Optional)
```bash
GET https://wilayah.id/api/villages/{districtId}.json

Example: /api/villages/317101.json (Kebayoran Baru)

Response:
{
  "data": [
    { "code": "3171011001", "name": "MELAWAI" },
    { "code": "3171011002", "name": "KRAMAT PELA" },
    ...
  ]
}
```

---

## 🗄️ Database Schema

```prisma
model Address {
  id              String       @id @default(cuid())
  participantId   String
  
  recipientName   String       // Nama penerima
  phone           String       // Nomor HP penerima
  addressText     String       @db.Text  // Jl. nama jalan, no rumah, RT/RW, patokan
  
  // Wilayah.id structured data
  provinceId      String       // "31"
  provinceName    String       // "DKI JAKARTA"
  cityId          String       // "3171"
  cityName        String       // "KOTA JAKARTA SELATAN"
  districtId      String       // "317101"
  districtName    String       // "KEBAYORAN BARU"
  villageId       String?      // "3171011001" (optional)
  villageName     String?      // "MELAWAI" (optional)
  postalCode      String?      // "12345"
  
  // Optional: for RajaOngkir auto-calculate
  rajaOngkirDistrictId  String?
  
  isDefault       Boolean      @default(false)
  
  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt
}
```

---

## 🔧 Backend Service

**File**: `backend/src/services/wilayah.service.ts`

```typescript
/**
 * Wilayah.id Service
 * Proxy untuk API wilayah.id dengan caching
 */

const WILAYAH_BASE_URL = 'https://wilayah.id/api'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours

// In-memory cache untuk mengurangi API calls
const cache = new Map<string, { data: any; expires: number }>()

/**
 * Get provinces list
 */
export async function getProvinces(): Promise<any[]> {
  const cacheKey = 'provinces'
  
  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  // Fetch from API
  const response = await fetch(`${WILAYAH_BASE_URL}/provinces.json`)
  const result = await response.json()
  
  // Store in cache
  cache.set(cacheKey, {
    data: result.data,
    expires: Date.now() + CACHE_TTL
  })
  
  return result.data
}

/**
 * Get cities/regencies by province
 */
export async function getCitiesByProvince(provinceId: string): Promise<any[]> {
  const cacheKey = `cities_${provinceId}`
  
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  const response = await fetch(`${WILAYAH_BASE_URL}/regencies/${provinceId}.json`)
  const result = await response.json()
  
  cache.set(cacheKey, {
    data: result.data,
    expires: Date.now() + CACHE_TTL
  })
  
  return result.data
}

/**
 * Get districts by city
 */
export async function getDistrictsByCity(cityId: string): Promise<any[]> {
  const cacheKey = `districts_${cityId}`
  
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  const response = await fetch(`${WILAYAH_BASE_URL}/districts/${cityId}.json`)
  const result = await response.json()
  
  cache.set(cacheKey, {
    data: result.data,
    expires: Date.now() + CACHE_TTL
  })
  
  return result.data
}

/**
 * Get villages by district (optional)
 */
export async function getVillagesByDistrict(districtId: string): Promise<any[]> {
  const cacheKey = `villages_${districtId}`
  
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  const response = await fetch(`${WILAYAH_BASE_URL}/villages/${districtId}.json`)
  const result = await response.json()
  
  cache.set(cacheKey, {
    data: result.data,
    expires: Date.now() + CACHE_TTL
  })
  
  return result.data
}
```

---

## 🌐 API Routes

**File**: `backend/src/routes/locations.ts`

```typescript
import express from 'express'
import * as wilayahService from '@/services/wilayah.service'

const router = express.Router()

// GET /api/locations/provinces
router.get('/provinces', async (req, res) => {
  try {
    const provinces = await wilayahService.getProvinces()
    res.json({ data: provinces })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch provinces' })
  }
})

// GET /api/locations/regencies/:provinceId
router.get('/regencies/:provinceId', async (req, res) => {
  try {
    const { provinceId } = req.params
    const cities = await wilayahService.getCitiesByProvince(provinceId)
    res.json({ data: cities })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch cities' })
  }
})

// GET /api/locations/districts/:cityId
router.get('/districts/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params
    const districts = await wilayahService.getDistrictsByCity(cityId)
    res.json({ data: districts })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch districts' })
  }
})

// GET /api/locations/villages/:districtId
router.get('/villages/:districtId', async (req, res) => {
  try {
    const { districtId } = req.params
    const villages = await wilayahService.getVillagesByDistrict(districtId)
    res.json({ data: villages })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch villages' })
  }
})

export default router
```

---

## 🎨 Frontend Component

**File**: `frontend/components/checkout/AddressSelector.tsx`

```tsx
'use client'

import { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export function AddressSelector({ onChange }) {
  const [provinces, setProvinces] = useState([])
  const [cities, setCities] = useState([])
  const [districts, setDistricts] = useState([])
  const [villages, setVillages] = useState([])
  
  const [selectedProvince, setSelectedProvince] = useState(null)
  const [selectedCity, setSelectedCity] = useState(null)
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedVillage, setSelectedVillage] = useState(null)
  
  // Load provinces on mount
  useEffect(() => {
    fetch('/api/locations/provinces')
      .then(res => res.json())
      .then(data => setProvinces(data.data))
  }, [])
  
  // Load cities when province changes
  useEffect(() => {
    if (selectedProvince) {
      fetch(`/api/locations/regencies/${selectedProvince.code}`)
        .then(res => res.json())
        .then(data => setCities(data.data))
      
      // Reset dependent fields
      setCities([])
      setDistricts([])
      setVillages([])
      setSelectedCity(null)
      setSelectedDistrict(null)
      setSelectedVillage(null)
    }
  }, [selectedProvince])
  
  // Load districts when city changes
  useEffect(() => {
    if (selectedCity) {
      fetch(`/api/locations/districts/${selectedCity.code}`)
        .then(res => res.json())
        .then(data => setDistricts(data.data))
      
      setDistricts([])
      setVillages([])
      setSelectedDistrict(null)
      setSelectedVillage(null)
    }
  }, [selectedCity])
  
  // Load villages when district changes (optional)
  useEffect(() => {
    if (selectedDistrict) {
      fetch(`/api/locations/villages/${selectedDistrict.code}`)
        .then(res => res.json())
        .then(data => setVillages(data.data))
      
      setVillages([])
      setSelectedVillage(null)
    }
  }, [selectedDistrict])
  
  // Notify parent of changes
  useEffect(() => {
    onChange({
      provinceId: selectedProvince?.code,
      provinceName: selectedProvince?.name,
      cityId: selectedCity?.code,
      cityName: selectedCity?.name,
      districtId: selectedDistrict?.code,
      districtName: selectedDistrict?.name,
      villageId: selectedVillage?.code,
      villageName: selectedVillage?.name,
    })
  }, [selectedProvince, selectedCity, selectedDistrict, selectedVillage])
  
  return (
    <div className="space-y-4">
      {/* Province */}
      <Select onValueChange={val => setSelectedProvince(provinces.find(p => p.code === val))}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih Provinsi" />
        </SelectTrigger>
        <SelectContent>
          {provinces.map(province => (
            <SelectItem key={province.code} value={province.code}>
              {province.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* City */}
      <Select disabled={!selectedProvince} onValueChange={val => setSelectedCity(cities.find(c => c.code === val))}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih Kota/Kabupaten" />
        </SelectTrigger>
        <SelectContent>
          {cities.map(city => (
            <SelectItem key={city.code} value={city.code}>
              {city.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* District */}
      <Select disabled={!selectedCity} onValueChange={val => setSelectedDistrict(districts.find(d => d.code === val))}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih Kecamatan" />
        </SelectTrigger>
        <SelectContent>
          {districts.map(district => (
            <SelectItem key={district.code} value={district.code}>
              {district.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {/* Village (Optional) */}
      <Select disabled={!selectedDistrict} onValueChange={val => setSelectedVillage(villages.find(v => v.code === val))}>
        <SelectTrigger>
          <SelectValue placeholder="Pilih Kelurahan (opsional)" />
        </SelectTrigger>
        <SelectContent>
          {villages.map(village => (
            <SelectItem key={village.code} value={village.code}>
              {village.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
```

---

## ✅ Benefits

1. **Standardized Data**: Consistent address format across all orders
2. **Easy Validation**: Dropdown prevents typos and invalid locations
3. **Shipping Ready**: Structured data makes shipping calculation easier
4. **User-Friendly**: Cascading dropdowns guide users through selection
5. **Free & Reliable**: No API key, no rate limits, maintained by community

---

## 🔗 Integration with RajaOngkir

**Mapping**:
- Wilayah.id `cityId` / `districtId` can be mapped to RajaOngkir district IDs
- If needed, create mapping table or use search to find equivalent
- Most cases: manual shipping input by jastiper, no mapping needed

**Optional Mapping Table**:
```prisma
model LocationMapping {
  id                    String @id @default(cuid())
  wilayahCityId         String @unique
  wilayahCityName       String
  rajaOngkirCityId      String
  rajaOngkirCityType    String // city/regency
}
```

---

**Documentation Ready**: Wilayah.id integration fully documented ✅
