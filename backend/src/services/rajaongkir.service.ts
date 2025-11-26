/**
 * Raja Ongkir Service
 * Handles shipping cost calculation and location search
 */

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY
const RAJAONGKIR_BASE_URL = 'https://rajaongkir.komerce.id/api/v1'

// City ID mapping for RajaOngkir calculation (city-level)
// Note: RajaOngkir has inconsistent ID systems - search API returns different IDs than calculate API
// Using city-level calculation as fallback since district-level IDs from search don't work in calculate
const CITY_ID_MAP: Record<string, string> = {
  // DKI Jakarta
  'JAKARTA BARAT': '151',
  'KOTA ADMINISTRASI JAKARTA BARAT': '151',
  'JAKARTA PUSAT': '152',
  'JAKARTA SELATAN': '153',
  'JAKARTA TIMUR': '154',
  'JAKARTA UTARA': '155',

  // Jawa Tengah
  'KARANGANYAR': '180',
  'KABUPATEN KARANGANYAR': '180',
  'SEMARANG': '321',
  'SOLO': '405',
  'SURAKARTA': '405',

  // Add more cities as needed
}

export interface LocationSearchResult {
  id: string
  districtId?: string  // Numeric ID untuk shipping calculation
  name: string
  type: string
  province_id?: string
  province_name?: string
}

export interface ShippingCostResult {
  courier: string
  service: string
  description: string
  cost: number
  etd: string
}

/**
 * Search domestic destinations (cities/subdistricts)
 * Note: This uses general search API which may return inconsistent IDs
 * For proper district IDs, use searchDistrictsByCity instead
 */
export async function searchDestinations(
  search: string
): Promise<LocationSearchResult[]> {
  try {
    const response = await fetch(
      `${RAJAONGKIR_BASE_URL}/destination/domestic-destination?search=${encodeURIComponent(search)}&limit=10&offset=0`,
      {
        method: 'GET',
        headers: {
          key: RAJAONGKIR_API_KEY || '',
        },
      }
    )

    if (!response.ok) {
      return []
    }

    const data: any = await response.json()

    if (!data.data || !Array.isArray(data.data)) {
      return []
    }

    return data.data.map((item: any) => {
      // Extract numeric district/subdistrict ID for shipping calculation
      // Try multiple fields where ID might be stored
      let districtId = item.id || item.subdistrict_id || item.district_id || item.city_id
      let displayId = item.city_id || item.subdistrict_id || item.district_id || item.id

      // If all IDs are missing, create hash-based ID for consistency
      if (!districtId && !displayId) {
        const nameKey = `${item.city_name || item.subdistrict_name}|${item.province_name}`
        displayId = Math.abs(nameKey.split('').reduce((a, b) => {a = ((a << 5) - a) + b.charCodeAt(0); return a & a}, 0)).toString()
      }

      return {
        id: String(displayId || districtId),
        districtId: districtId ? String(districtId) : undefined,
        name: item.city_name || item.subdistrict_name || item.name || item.label,
        type: item.type,
        province_id: item.province_id,
        province_name: item.province_name,
      }
    })
  } catch (error) {
    console.error('Raja Ongkir search error:', error)
    return []
  }
}

/**
 * Search cities by province ID (RajaOngkir proper hierarchy)
 * Returns city IDs that work with city-level calculate endpoint
 */
export async function searchCitiesByProvince(
  provinceId: string
): Promise<LocationSearchResult[]> {
  try {
    const response = await fetch(
      `${RAJAONGKIR_BASE_URL}/destination/city/${provinceId}`,
      {
        method: 'GET',
        headers: {
          key: RAJAONGKIR_API_KEY || '',
        },
      }
    )

    if (!response.ok) {
      console.error(`[RajaOngkir] City search failed: ${response.status}`)
      return []
    }

    const data: any = await response.json()

    if (!data.data || !Array.isArray(data.data)) {
      return []
    }

    return data.data.map((item: any) => ({
      id: String(item.id),
      districtId: String(item.id), // City ID for cost calculation
      name: item.name,
      type: 'city',
      province_id: undefined,
      province_name: undefined,
    }))
  } catch (error) {
    console.error('[RajaOngkir] City search error:', error)
    return []
  }
}

/**
 * Search districts by city ID (RajaOngkir proper hierarchy)
 * This returns proper district IDs that work with calculate endpoint
 */
export async function searchDistrictsByCity(
  cityId: string
): Promise<LocationSearchResult[]> {
  try {
    const response = await fetch(
      `${RAJAONGKIR_BASE_URL}/destination/district/${cityId}`,
      {
        method: 'GET',
        headers: {
          key: RAJAONGKIR_API_KEY || '',
        },
      }
    )

    if (!response.ok) {
      console.error(`[RajaOngkir] District search failed: ${response.status}`)
      return []
    }

    const data: any = await response.json()

    if (!data.data || !Array.isArray(data.data)) {
      return []
    }

    return data.data.map((item: any) => ({
      id: String(item.id),
      districtId: String(item.id), // These are proper district IDs for calculation
      name: item.name,
      type: 'district',
      province_id: undefined,
      province_name: undefined,
    }))
  } catch (error) {
    console.error('[RajaOngkir] District search error:', error)
    return []
  }
}

/**
 * Search city ID by name using general search API
 * Falls back to CITY_ID_MAP if search fails
 */
export async function searchCityIdByName(
  cityName: string
): Promise<string | null> {
  try {
    // First try the general domestic search
    const results = await searchDestinations(cityName)

    if (results && results.length > 0) {
      // Look for city_id in the result
      for (const result of results) {
        if (result.name.toUpperCase().includes(cityName.toUpperCase())) {
          return result.id
        }
      }
    }

    // Fallback to CITY_ID_MAP
    const normalizedCity = cityName.toUpperCase().trim()

    if (CITY_ID_MAP[normalizedCity]) {
      return CITY_ID_MAP[normalizedCity]
    }

    const withKota = `KOTA ADMINISTRASI ${normalizedCity}`
    if (CITY_ID_MAP[withKota]) {
      return CITY_ID_MAP[withKota]
    }

    const withKabupaten = `KABUPATEN ${normalizedCity}`
    if (CITY_ID_MAP[withKabupaten]) {
      return CITY_ID_MAP[withKabupaten]
    }

    return null
  } catch (error) {
    console.error('[RajaOngkir] City ID search error:', error)
    return null
  }
}

/**
 * Calculate shipping cost using city IDs (more reliable than district IDs)
 */
export async function calculateShippingCost(
  origin: string,
  destination: string,
  weight: number = 1000,
  courier: string = 'jne:tiki:pos:jnt'
): Promise<ShippingCostResult[]> {
  try {
    // Send all couriers in single request (RajaOngkir supports colon-separated couriers)
    const params = new URLSearchParams()
    params.append('origin', origin)
    params.append('destination', destination)
    params.append('weight', weight.toString())
    params.append('courier', courier) // Send all couriers at once: "jne:tiki:pos"
    params.append('price', 'lowest') // Get lowest price options

    const response = await fetch(
      `${RAJAONGKIR_BASE_URL}/calculate/domestic-cost`,
      {
        method: 'POST',
        headers: {
          key: RAJAONGKIR_API_KEY || '',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )

    const data: any = await response.json()

    if (!response.ok) {
      console.error(`[RajaOngkir] API error: ${response.status} ${response.statusText}`)
      console.error('[RajaOngkir] Error response:', JSON.stringify(data, null, 2))
      console.error('[RajaOngkir] Request params:', { origin, destination, weight, courier })
      return []
    }

    console.log('[RajaOngkir] Success:', JSON.stringify(data, null, 2))

    // Response: flat array with cost directly in each item
    if (!data.data || !Array.isArray(data.data)) {
      console.error('[RajaOngkir] No results in response')
      return []
    }

    // Parse flat array results and group by courier code
    const courierMap = new Map<string, ShippingCostResult>()

    for (const item of data.data) {
      const result: ShippingCostResult = {
        courier: item.code,
        service: item.service,
        description: item.description,
        cost: item.cost,
        etd: item.etd,
      }

      // Only keep the cheapest option for each courier
      const existing = courierMap.get(item.code)
      if (!existing || result.cost < existing.cost) {
        courierMap.set(item.code, result)
      }
    }

    // Convert map to array
    const uniqueResults = Array.from(courierMap.values())

    return uniqueResults
  } catch (error) {
    console.error('[RajaOngkir] Cost calculation error:', error)
    return []
  }
}

/**
 * Get best (cheapest) shipping option
 */
export function getBestShippingOption(
  options: ShippingCostResult[]
): ShippingCostResult | null {
  if (!options || options.length === 0) {
    return null
  }

  return options.reduce((min, current) =>
    current.cost < min.cost ? current : min
  )
}

/**
 * Auto-map Wilayah.id city to RajaOngkir city ID
 * Uses search API + CITY_ID_MAP fallback
 * Note: Returns city-level ID (not district) for shipping calculation
 */
export async function autoMapToRajaOngkir(
  cityName: string,
  districtName: string
): Promise<string | null> {
  try {
    // Use the search function which tries API first, then CITY_ID_MAP
    const cityId = await searchCityIdByName(cityName)

    if (cityId) {
      console.log(`[RajaOngkir Auto-Map] Mapped "${cityName}" to RajaOngkir city ID: ${cityId}`)
      return cityId
    }

    console.warn(`[RajaOngkir Auto-Map] No city mapping found for "${cityName}" (district: ${districtName})`)
    console.warn(`[RajaOngkir Auto-Map] Consider adding to CITY_ID_MAP in rajaongkir.service.ts`)
    return null
  } catch (error) {
    console.error('[RajaOngkir Auto-Map] Error:', error)
    return null
  }
}
