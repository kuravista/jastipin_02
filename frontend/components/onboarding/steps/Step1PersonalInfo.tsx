/**
 * Step 1: Personal Information
 * Form for name and WhatsApp number
 */

'use client'

import React from 'react'
import { useOnboarding } from '../OnboardingProvider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export function Step1PersonalInfo() {
  const { formData, updateFormData, errors } = useOnboarding()

  return (
    <div className="space-y-5">
      {/* Profile Name */}
      <div>
        <Label htmlFor="profileName" className="text-sm font-semibold text-gray-700">
          Nama Lengkap <span className="text-red-500">*</span>
        </Label>
        <Input
          id="profileName"
          value={formData.profileName || ''}
          onChange={(e) => updateFormData({ profileName: e.target.value })}
          placeholder="Masukkan nama lengkap Anda"
          className="mt-2 border-gray-300 focus:border-[#FB923C] focus:ring-[#FB923C]"
        />
        {errors.profileName && (
          <p className="text-sm text-red-500 mt-1">{errors.profileName}</p>
        )}
      </div>

      {/* WhatsApp Number */}
      <div>
        <Label htmlFor="whatsappNumber" className="text-sm font-semibold text-gray-700">
          Nomor WhatsApp <span className="text-red-500">*</span>
        </Label>
        <div className="flex mt-2">
          <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-300 rounded-l-md text-sm font-medium text-gray-600">
            +62
          </span>
          <Input
            id="whatsappNumber"
            type="tel"
            value={formData.whatsappNumber ? formData.whatsappNumber.replace(/^\+?62/, '') : ''}
            onChange={(e) => {
              let value = e.target.value.replace(/\D/g, '').slice(0, 12)
              // Remove leading 0 if user types it
              if (value.startsWith('0')) {
                value = value.slice(1)
              }
              updateFormData({ whatsappNumber: value ? `62${value}` : '' })
            }}
            placeholder="8 diikuti 9-12 digit (mis: 81234567890)"
            className="rounded-l-none border-gray-300 focus:border-[#FB923C] focus:ring-[#FB923C]"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">Mulai dengan angka 8, contoh: 81234567890</p>
        {errors.whatsappNumber && (
          <p className="text-sm text-red-500 mt-1">{errors.whatsappNumber}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-900">
          💡 Nomor WhatsApp ini akan digunakan pembeli untuk menghubungi Anda tentang pesanan.
        </p>
      </div>
    </div>
  )
}
