/**
 * Step 2: Origin Address
 * Form for selecting province, city, district, and address details
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useOnboarding } from '../OnboardingProvider'
import { LocationOption, RajaOngkirSearchResult } from '../types'
import { apiGet } from '@/lib/api-client'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Loader2 } from 'lucide-react'

export function Step2OriginAddress() {
  const { formData, updateFormData, errors } = useOnboarding()
  const [provinces, setProvinces] = useState<LocationOption[]>([])
  const [cities, setCities] = useState<LocationOption[]>([])
  const [districts, setDistricts] = useState<LocationOption[]>([])
  const [rajaOngkirResults, setRajaOngkirResults] = useState<RajaOngkirSearchResult[]>([])
  const [loading, setLoading] = useState({ provinces: false, cities: false, districts: false, search: false })

  // Fetch provinces on mount
  useEffect(() => {
    fetchProvinces()
  }, [])

  // Fetch cities when province changes
  useEffect(() => {
    if (formData.originProvinceId) {
      fetchCities(formData.originProvinceId)
    }
  }, [formData.originProvinceId])

  // Fetch districts when city changes
  useEffect(() => {
    if (formData.originCityId) {
      fetchDistricts(formData.originCityId)
    }
  }, [formData.originCityId])

  // Search RajaOngkir when district selected
  useEffect(() => {
    if (formData.originDistrictName && formData.originCityName) {
      searchRajaOngkir(`${formData.originDistrictName} ${formData.originCityName}`)
    }
  }, [formData.originDistrictName, formData.originCityName])

  const fetchProvinces = async () => {
    try {
      setLoading((prev) => ({ ...prev, provinces: true }))
      const response = await apiGet<{ data: LocationOption[] }>('/locations/provinces')
      setProvinces(response.data || [])
    } catch (error) {
      console.error('Failed to fetch provinces:', error)
    } finally {
      setLoading((prev) => ({ ...prev, provinces: false }))
    }
  }

  const fetchCities = async (provinceId: string) => {
    try {
      setLoading((prev) => ({ ...prev, cities: true }))
      setCities([])
      setDistricts([])
      setRajaOngkirResults([])
      const response = await apiGet<{ data: LocationOption[] }>(
        `/locations/regencies/${provinceId}`,
      )
      setCities(response.data || [])
    } catch (error) {
      console.error('Failed to fetch cities:', error)
    } finally {
      setLoading((prev) => ({ ...prev, cities: false }))
    }
  }

  const fetchDistricts = async (cityId: string) => {
    try {
      setLoading((prev) => ({ ...prev, districts: true }))
      setDistricts([])
      setRajaOngkirResults([])
      const response = await apiGet<{ data: LocationOption[] }>(
        `/locations/districts/${cityId}`,
      )
      setDistricts(response.data || [])
    } catch (error) {
      console.error('Failed to fetch districts:', error)
    } finally {
      setLoading((prev) => ({ ...prev, districts: false }))
    }
  }

  const searchRajaOngkir = async (query: string) => {
    try {
      setLoading((prev) => ({ ...prev, search: true }))
      const response = await apiGet<{ data: RajaOngkirSearchResult[] }>(
        `/locations/rajaongkir/search?q=${encodeURIComponent(query)}`,
      )
      setRajaOngkirResults(response.data || [])
    } catch (error) {
      console.error('Failed to search RajaOngkir:', error)
    } finally {
      setLoading((prev) => ({ ...prev, search: false }))
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 mb-4">
        Alamat ini digunakan untuk menghitung ongkos kirim ke pembeli
      </p>

      {/* Province */}
      <div>
        <Label htmlFor="province" className="text-sm font-semibold text-gray-700">
          Provinsi <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.originProvinceId || ''}
          onValueChange={(value) => {
            const province = provinces.find((p) => p.id === value)
            updateFormData({
              originProvinceId: value,
              originProvinceName: province?.name,
              originCityId: '',
              originCityName: '',
              originDistrictId: '',
              originDistrictName: '',
              originRajaOngkirDistrictId: '',
            })
          }}
        >
          <SelectTrigger className="mt-2 border-gray-300">
            <SelectValue placeholder="Pilih Provinsi" />
          </SelectTrigger>
          <SelectContent>
            {loading.provinces ? (
              <div className="p-2 text-center">
                <Loader2 className="w-4 h-4 animate-spin inline" />
              </div>
            ) : (
              provinces.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.originProvinceId && (
          <p className="text-sm text-red-500 mt-1">{errors.originProvinceId}</p>
        )}
      </div>

      {/* City */}
      <div>
        <Label htmlFor="city" className="text-sm font-semibold text-gray-700">
          Kota/Kabupaten <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.originCityId || ''}
          onValueChange={(value) => {
            const city = cities.find((c) => c.id === value)
            updateFormData({
              originCityId: value,
              originCityName: city?.name,
              originDistrictId: '',
              originDistrictName: '',
              originRajaOngkirDistrictId: '',
            })
          }}
          disabled={!formData.originProvinceId || loading.cities}
        >
          <SelectTrigger className="mt-2 border-gray-300">
            <SelectValue placeholder="Pilih Kota/Kabupaten" />
          </SelectTrigger>
          <SelectContent>
            {loading.cities ? (
              <div className="p-2 text-center">
                <Loader2 className="w-4 h-4 animate-spin inline" />
              </div>
            ) : (
              cities.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.originCityId && (
          <p className="text-sm text-red-500 mt-1">{errors.originCityId}</p>
        )}
      </div>

      {/* District */}
      <div>
        <Label htmlFor="district" className="text-sm font-semibold text-gray-700">
          Kecamatan <span className="text-red-500">*</span>
        </Label>
        <Select
          value={formData.originDistrictId || ''}
          onValueChange={(value) => {
            const district = districts.find((d) => d.id === value)
            updateFormData({
              originDistrictId: value,
              originDistrictName: district?.name,
              originRajaOngkirDistrictId: '',
            })
          }}
          disabled={!formData.originCityId || loading.districts}
        >
          <SelectTrigger className="mt-2 border-gray-300">
            <SelectValue placeholder="Pilih Kecamatan" />
          </SelectTrigger>
          <SelectContent>
            {loading.districts ? (
              <div className="p-2 text-center">
                <Loader2 className="w-4 h-4 animate-spin inline" />
              </div>
            ) : (
              districts.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.name}
                </SelectItem>
              ))
            )}
          </SelectContent>
        </Select>
        {errors.originDistrictId && (
          <p className="text-sm text-red-500 mt-1">{errors.originDistrictId}</p>
        )}
      </div>

      {/* RajaOngkir District Selection */}
      {rajaOngkirResults.length > 0 && (
        <div>
          <Label htmlFor="rajaOngkir" className="text-sm font-semibold text-gray-700">
            Kecamatan untuk Ongkir <span className="text-red-500">*</span>
          </Label>
          <Select
            value={formData.originRajaOngkirDistrictId || ''}
            onValueChange={(value) => {
              updateFormData({ originRajaOngkirDistrictId: value })
            }}
          >
            <SelectTrigger className="mt-2 border-gray-300">
              <SelectValue placeholder="Pilih Kecamatan untuk Ongkir" />
            </SelectTrigger>
            <SelectContent>
              {rajaOngkirResults.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name} {r.province_name ? `- ${r.province_name}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.originRajaOngkirDistrictId && (
            <p className="text-sm text-red-500 mt-1">{errors.originRajaOngkirDistrictId}</p>
          )}
        </div>
      )}

      {/* Postal Code */}
      <div>
        <Label htmlFor="postalCode" className="text-sm font-semibold text-gray-700">
          Kode Pos <span className="text-red-500">*</span>
        </Label>
        <Input
          id="postalCode"
          value={formData.originPostalCode || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 5)
            updateFormData({ originPostalCode: value })
          }}
          placeholder="12345"
          maxLength={5}
          className="mt-2 border-gray-300"
        />
        {errors.originPostalCode && (
          <p className="text-sm text-red-500 mt-1">{errors.originPostalCode}</p>
        )}
      </div>

      {/* Address Detail */}
      <div>
        <Label htmlFor="addressText" className="text-sm font-semibold text-gray-700">
          Alamat Lengkap <span className="text-red-500">*</span>
        </Label>
        <Textarea
          id="addressText"
          value={formData.originAddressText || ''}
          onChange={(e) => updateFormData({ originAddressText: e.target.value })}
          placeholder="Contoh: Jl. Merdeka No. 123, RT 01/RW 02, Kelurahan Pusat, Kecamatan Kota"
          rows={4}
          className="mt-2 border-gray-300 resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">Minimal 10 karakter</p>
        {errors.originAddressText && (
          <p className="text-sm text-red-500 mt-1">{errors.originAddressText}</p>
        )}
      </div>
    </div>
  )
}
