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
        <Input
          id="whatsappNumber"
          type="tel"
          value={formData.whatsappNumber || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '') // Only digits
            updateFormData({ whatsappNumber: value })
          }}
          placeholder="08123456789"
          maxLength={15}
          className="mt-2 border-gray-300 focus:border-[#FB923C] focus:ring-[#FB923C]"
        />
        <p className="text-xs text-gray-500 mt-1">10-15 digit angka (misal: 08123456789)</p>
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
