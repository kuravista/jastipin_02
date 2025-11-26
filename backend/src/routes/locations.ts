/**
 * Location Routes
 * Proxy for Wilayah.id API (Indonesia location data)
 */

import express, { type Router } from 'express'
import {
  getProvinces,
  getCitiesByProvince,
  getDistrictsByCity,
  getVillagesByDistrict,
  clearCache,
  getCacheStats
} from '../services/wilayah.service.js'
import {
  searchDestinations
} from '../services/rajaongkir.service.js'

const router: Router = express.Router()

/**
 * GET /api/locations/provinces
 * Get list of provinces in Indonesia
 */
router.get('/provinces', async (_req, res) => {
  try {
    const provinces = await getProvinces()

    // Transform 'code' to 'id' for frontend compatibility (AddressForm uses 'id')
    const transformed = provinces.map(p => ({
      id: p.code,
      code: p.code, // Keep both for backward compatibility
      name: p.name
    }))

    res.json({
      success: true,
      count: transformed.length,
      data: transformed
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch provinces'
    })
  }
})

/**
 * GET /api/locations/regencies/:provinceId
 * Get cities/regencies by province ID
 */
router.get('/regencies/:provinceId', async (req, res) => {
  try {
    const { provinceId } = req.params

    if (!provinceId) {
      res.status(400).json({
        success: false,
        error: 'Province ID required'
      })
      return
    }

    const cities = await getCitiesByProvince(provinceId)

    // Transform 'code' to 'id' for frontend compatibility (AddressForm uses 'id')
    const transformed = cities.map(c => ({
      id: c.code,
      code: c.code, // Keep both for backward compatibility
      name: c.name
    }))

    res.json({
      success: true,
      count: transformed.length,
      data: transformed
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch cities'
    })
  }
})

/**
 * GET /api/locations/districts/:cityId
 * Get districts/kecamatan by city ID
 */
router.get('/districts/:cityId', async (req, res) => {
  try {
    const { cityId } = req.params

    if (!cityId) {
      res.status(400).json({
        success: false,
        error: 'City ID required'
      })
      return
    }

    const districts = await getDistrictsByCity(cityId)

    // Transform to match AddressForm format (uses 'id')
    const transformed = districts.map(d => ({
      id: d.code,
      code: d.code, // Keep both for backward compatibility
      name: d.name
    }))

    res.json({
      success: true,
      count: transformed.length,
      data: transformed
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch districts'
    })
  }
})

/**
 * GET /api/locations/villages/:districtId
 * Get villages/kelurahan by district ID (optional)
 */
router.get('/villages/:districtId', async (req, res) => {
  try {
    const { districtId } = req.params

    if (!districtId) {
      res.status(400).json({
        success: false,
        error: 'District ID required'
      })
      return
    }

    const villages = await getVillagesByDistrict(districtId)

    // Transform 'code' to 'id' for frontend compatibility
    const transformed = villages.map(v => ({
      id: v.code,
      name: v.name
    }))

    res.json({
      success: true,
      count: transformed.length,
      data: transformed
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch villages'
    })
  }
})

/**
 * GET /api/locations/rajaongkir/search
 * Search RajaOngkir location by name (returns ID for shipping calculation)
 */
router.get('/rajaongkir/search', async (req, res) => {
  try {
    const { query } = req.query

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        success: false,
        error: 'Search query required'
      })
      return
    }

    const results = await searchDestinations(query)

    res.json({
      success: true,
      count: results.length,
      data: results
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search RajaOngkir locations'
    })
  }
})

/**
 * POST /api/locations/cache/clear
 * Clear location cache (admin only)
 */
router.post('/cache/clear', (_req, res) => {
  try {
    clearCache()

    res.json({
      success: true,
      message: 'Location cache cleared'
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to clear cache'
    })
  }
})

/**
 * GET /api/locations/cache/stats
 * Get cache statistics
 */
router.get('/cache/stats', (_req, res) => {
  try {
    const stats = getCacheStats()

    res.json({
      success: true,
      data: stats
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get cache stats'
    })
  }
})

/**
 * GET /api/locations/rajaongkir/search
 * Search RajaOngkir districts (for mapping district ID)
 * Query params:
 *   - q: search query (city name, district name)
 */
router.get('/rajaongkir/search', async (req, res) => {
  try {
    const query = req.query.q as string

    if (!query || query.trim().length < 3) {
      res.status(400).json({
        success: false,
        error: 'Query must be at least 3 characters'
      })
      return
    }

    const results = await searchDestinations(query.trim())

    res.json({
      success: true,
      count: results.length,
      data: results
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to search RajaOngkir districts'
    })
  }
})

export default router
