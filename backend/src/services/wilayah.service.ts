/**
 * Wilayah.id Service
 * Proxy untuk API wilayah.id dengan in-memory caching
 * Provides structured location data for Indonesia (provinces, cities, districts, villages)
 */

const WILAYAH_BASE_URL = 'https://wilayah.id/api'
const CACHE_TTL = 24 * 60 * 60 * 1000 // 24 hours in milliseconds

// In-memory cache untuk mengurangi API calls
const cache = new Map<string, { data: any; expires: number }>()

export interface WilayahLocation {
  code: string
  name: string
}

/**
 * Get provinces list
 */
export async function getProvinces(): Promise<WilayahLocation[]> {
  const cacheKey = 'provinces'
  
  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  try {
    // Fetch from API
    const response = await fetch(`${WILAYAH_BASE_URL}/provinces.json`)
    
    if (!response.ok) {
      throw new Error(`Wilayah.id API error: ${response.status}`)
    }
    
    const result: any = await response.json()
    const provinces = result.data || []
    
    // Store in cache
    cache.set(cacheKey, {
      data: provinces,
      expires: Date.now() + CACHE_TTL
    })
    
    return provinces
  } catch (error: any) {
    console.error('Error fetching provinces:', error.message)
    return []
  }
}

/**
 * Get cities/regencies by province
 */
export async function getCitiesByProvince(provinceId: string): Promise<WilayahLocation[]> {
  const cacheKey = `cities_${provinceId}`
  
  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  try {
    const response = await fetch(`${WILAYAH_BASE_URL}/regencies/${provinceId}.json`)
    
    if (!response.ok) {
      throw new Error(`Wilayah.id API error: ${response.status}`)
    }
    
    const result: any = await response.json()
    const cities = result.data || []
    
    // Store in cache
    cache.set(cacheKey, {
      data: cities,
      expires: Date.now() + CACHE_TTL
    })
    
    return cities
  } catch (error: any) {
    console.error(`Error fetching cities for province ${provinceId}:`, error.message)
    return []
  }
}

/**
 * Get districts/kecamatan by city
 */
export async function getDistrictsByCity(cityId: string): Promise<WilayahLocation[]> {
  const cacheKey = `districts_${cityId}`
  
  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  try {
    const response = await fetch(`${WILAYAH_BASE_URL}/districts/${cityId}.json`)
    
    if (!response.ok) {
      throw new Error(`Wilayah.id API error: ${response.status}`)
    }
    
    const result: any = await response.json()
    const districts = result.data || []
    
    // Store in cache
    cache.set(cacheKey, {
      data: districts,
      expires: Date.now() + CACHE_TTL
    })
    
    return districts
  } catch (error: any) {
    console.error(`Error fetching districts for city ${cityId}:`, error.message)
    return []
  }
}

/**
 * Get villages/kelurahan by district (optional)
 */
export async function getVillagesByDistrict(districtId: string): Promise<WilayahLocation[]> {
  const cacheKey = `villages_${districtId}`
  
  // Check cache
  const cached = cache.get(cacheKey)
  if (cached && cached.expires > Date.now()) {
    return cached.data
  }
  
  try {
    const response = await fetch(`${WILAYAH_BASE_URL}/villages/${districtId}.json`)
    
    if (!response.ok) {
      throw new Error(`Wilayah.id API error: ${response.status}`)
    }
    
    const result: any = await response.json()
    const villages = result.data || []
    
    // Store in cache
    cache.set(cacheKey, {
      data: villages,
      expires: Date.now() + CACHE_TTL
    })
    
    return villages
  } catch (error: any) {
    console.error(`Error fetching villages for district ${districtId}:`, error.message)
    return []
  }
}

/**
 * Clear cache (useful for testing or manual refresh)
 */
export function clearCache(): void {
  cache.clear()
}

/**
 * Get cache stats (for monitoring)
 */
export function getCacheStats() {
  return {
    size: cache.size,
    keys: Array.from(cache.keys())
  }
}
