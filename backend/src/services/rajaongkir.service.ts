/**
 * Raja Ongkir Service
 * Handles shipping cost calculation and location search
 */

const RAJAONGKIR_API_KEY = process.env.RAJAONGKIR_API_KEY
const RAJAONGKIR_BASE_URL = 'https://rajaongkir.komerce.id/api/v1'

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
 * Calculate shipping cost
 */
export async function calculateShippingCost(
  origin: string,
  destination: string,
  weight: number = 1000,
  courier: string = 'jne:tiki:pos'
): Promise<ShippingCostResult[]> {
  try {
    const params = new URLSearchParams()
    params.append('origin', origin)
    params.append('destination', destination)
    params.append('weight', weight.toString())
    params.append('courier', courier)
    params.append('price', 'lowest')

    const response = await fetch(
      `${RAJAONGKIR_BASE_URL}/calculate/district/domestic-cost`,
      {
        method: 'POST',
        headers: {
          key: RAJAONGKIR_API_KEY || '',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      }
    )

    if (!response.ok) {
      console.error(`Raja Ongkir API error: ${response.status} ${response.statusText}`)
      return []
    }

    const data: any = await response.json()
    console.log('Raja Ongkir response:', JSON.stringify(data, null, 2))

    if (!data.data || !data.data.results) {
      console.error('Raja Ongkir: No results in response or invalid structure')
      return []
    }

    const results: ShippingCostResult[] = []

    for (const result of data.data.results) {
      if (result.costs && Array.isArray(result.costs)) {
        for (const cost of result.costs) {
          const costArray = cost.cost || []
          if (costArray.length > 0) {
            results.push({
              courier: result.code,
              service: cost.service,
              description: cost.description,
              cost: costArray[0].value,
              etd: costArray[0].etd,
            })
          }
        }
      }
    }

    return results
  } catch (error) {
    console.error('Raja Ongkir cost calculation error:', error)
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
