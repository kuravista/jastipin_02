/**
 * Location API Client
 * Functions for wilayah.id integration
 */

export interface LocationOption {
  id: string
  name: string
}

export interface LocationResponse {
  success: boolean
  count: number
  data: LocationOption[]
}

/**
 * Get all provinces
 */
export async function getProvinces(): Promise<LocationOption[]> {
  const response = await fetch('/api/locations/provinces')
  const result: LocationResponse = await response.json()

  if (!response.ok || !result.success) {
    throw new Error('Failed to fetch provinces')
  }

  return result.data
}

/**
 * Get cities by province
 */
export async function getCitiesByProvince(provinceId: string): Promise<LocationOption[]> {
  const response = await fetch(`/api/locations/regencies/${provinceId}`)
  const result: LocationResponse = await response.json()

  if (!response.ok || !result.success) {
    throw new Error('Failed to fetch cities')
  }

  return result.data
}

/**
 * Get districts by city
 */
export async function getDistrictsByCity(cityId: string): Promise<LocationOption[]> {
  const response = await fetch(`/api/locations/districts/${cityId}`)
  const result: LocationResponse = await response.json()

  if (!response.ok || !result.success) {
    throw new Error('Failed to fetch districts')
  }

  return result.data
}

/**
 * Get villages by district
 */
export async function getVillagesByDistrict(districtId: string): Promise<LocationOption[]> {
  const response = await fetch(`/api/locations/villages/${districtId}`)
  const result: LocationResponse = await response.json()

  if (!response.ok || !result.success) {
    throw new Error('Failed to fetch villages')
  }

  return result.data
}
