/**
 * Step 3: Bank Account Information
 * Form for entering bank details
 */

'use client'

import React, { useState } from 'react'
import { useOnboarding } from '../OnboardingProvider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const BANK_OPTIONS = [
  'BCA',
  'BNI',
  'BRI',
  'Mandiri',
  'CIMB Niaga',
  'Permata',
  'Danamon',
  'BTN',
  'BSI',
  'Lainnya',
]

export function Step3BankAccount() {
  const { formData, updateFormData, errors } = useOnboarding()
  const [showCustomBank, setShowCustomBank] = useState(formData.bankName && !BANK_OPTIONS.includes(formData.bankName))

  const handleBankChange = (value: string) => {
    if (value === 'Lainnya') {
      setShowCustomBank(true)
      updateFormData({ bankName: '' })
    } else {
      setShowCustomBank(false)
      updateFormData({ bankName: value })
    }
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-600 mb-4">
        Informasi rekening ini digunakan untuk transfer pembayaran dari pembeli
      </p>

      {/* Bank Name */}
      <div>
        <Label htmlFor="bankName" className="text-sm font-semibold text-gray-700">
          Nama Bank <span className="text-red-500">*</span>
        </Label>
        {!showCustomBank ? (
          <Select
            value={formData.bankName || ''}
            onValueChange={handleBankChange}
          >
            <SelectTrigger className="mt-2 border-gray-300">
              <SelectValue placeholder="Pilih Bank" />
            </SelectTrigger>
            <SelectContent>
              {BANK_OPTIONS.map((bank) => (
                <SelectItem key={bank} value={bank}>
                  {bank}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={formData.bankName || ''}
            onChange={(e) => updateFormData({ bankName: e.target.value })}
            placeholder="Masukkan nama bank"
            className="mt-2 border-gray-300"
          />
        )}
        {showCustomBank && (
          <button
            onClick={() => setShowCustomBank(false)}
            className="text-xs text-[#FB923C] hover:underline mt-2"
          >
            ← Pilih dari daftar
          </button>
        )}
        {errors.bankName && (
          <p className="text-sm text-red-500 mt-1">{errors.bankName}</p>
        )}
      </div>

      {/* Account Number */}
      <div>
        <Label htmlFor="accountNumber" className="text-sm font-semibold text-gray-700">
          Nomor Rekening <span className="text-red-500">*</span>
        </Label>
        <Input
          id="accountNumber"
          value={formData.accountNumber || ''}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 15)
            updateFormData({ accountNumber: value })
          }}
          placeholder="1234567890"
          maxLength={15}
          className="mt-2 border-gray-300"
        />
        <p className="text-xs text-gray-500 mt-1">10-15 digit angka</p>
        {errors.accountNumber && (
          <p className="text-sm text-red-500 mt-1">{errors.accountNumber}</p>
        )}
      </div>

      {/* Account Holder Name */}
      <div>
        <Label htmlFor="accountHolderName" className="text-sm font-semibold text-gray-700">
          Nama Pemilik Rekening <span className="text-red-500">*</span>
        </Label>
        <Input
          id="accountHolderName"
          value={formData.accountHolderName || ''}
          onChange={(e) => updateFormData({ accountHolderName: e.target.value })}
          placeholder="Nama sesuai rekening bank"
          className="mt-2 border-gray-300"
        />
        <p className="text-xs text-gray-500 mt-1">
          Harus sama dengan nama di rekening bank
        </p>
        {errors.accountHolderName && (
          <p className="text-sm text-red-500 mt-1">{errors.accountHolderName}</p>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-blue-900">
          💡 Pastikan informasi rekening Anda benar. Ini akan digunakan untuk menerima
          pembayaran dari pembeli.
        </p>
      </div>
    </div>
  )
}
