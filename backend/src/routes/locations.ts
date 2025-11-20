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

const router: Router = express.Router()

/**
 * GET /api/locations/provinces
 * Get list of provinces in Indonesia
 */
router.get('/provinces', async (_req, res) => {
  try {
    const provinces = await getProvinces()
    
    res.json({
      success: true,
      count: provinces.length,
      data: provinces
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
    
    res.json({
      success: true,
      count: cities.length,
      data: cities
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
    
    res.json({
      success: true,
      count: districts.length,
      data: districts
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
    
    res.json({
      success: true,
      count: villages.length,
      data: villages
    })
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to fetch villages'
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

export default router
