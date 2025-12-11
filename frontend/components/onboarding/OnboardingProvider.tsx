/**
 * Onboarding Context Provider
 * Manages wizard state, form data, validation, and submission
 */

'use client'

import React, { createContext, useState, useContext, useCallback, useMemo } from 'react'
import { ProfileCompletionData, OnboardingStep } from './types'
import { apiPatch } from '@/lib/api-client'
import { useAuth } from '@/lib/auth-context'
import { parseOnboardingError } from '@/lib/parse-onboarding-errors'

interface OnboardingContextType {
  isModalOpen: boolean
  setModalOpen: (open: boolean) => void
  currentStep: OnboardingStep
  setCurrentStep: (step: OnboardingStep) => void
  formData: Partial<ProfileCompletionData>
  updateFormData: (data: Partial<ProfileCompletionData>) => void
  errors: Record<string, string>
  setErrors: (errors: Record<string, string>) => void
  generalError: string
  setGeneralError: (error: string) => void
  isSubmitting: boolean
  submitProfile: () => Promise<void>
  canGoNext: boolean
  canGoBack: boolean
  goNext: () => void
  goBack: () => void
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined)

/**
 * Provider component - wrap your app with this
 */
export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const { refreshUser } = useAuth()
  const [isModalOpen, setModalOpen] = useState(false)
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [formData, setFormData] = useState<Partial<ProfileCompletionData>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [generalError, setGeneralError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const updateFormData = useCallback(
    (data: Partial<ProfileCompletionData>) => {
      setFormData((prev) => ({ ...prev, ...data }))
    },
    [],
  )

  // Pure validation function - NO side effects (no setErrors here!)
  const getValidationErrors = useCallback((step: OnboardingStep): Record<string, string> => {
    const newErrors: Record<string, string> = {}

    if (step === 1) {
      if (!formData.profileName) {
        newErrors.profileName = 'Nama lengkap wajib diisi'
      } else if (formData.profileName.length < 2) {
        newErrors.profileName = 'Nama minimal 2 karakter'
      }

      if (!formData.whatsappNumber) {
        newErrors.whatsappNumber = 'Nomor WhatsApp wajib diisi'
      } else if (!/^\d{10,15}$/.test(formData.whatsappNumber)) {
        newErrors.whatsappNumber = 'Nomor WhatsApp harus 10-15 digit'
      }
    } else if (step === 2) {
      if (!formData.originProvinceId) {
        newErrors.originProvinceId = 'Provinsi wajib dipilih'
      }
      if (!formData.originCityId) {
        newErrors.originCityId = 'Kota wajib dipilih'
      }
      if (!formData.originDistrictId) {
        newErrors.originDistrictId = 'Kecamatan wajib dipilih'
      }
      if (!formData.originPostalCode) {
        newErrors.originPostalCode = 'Kode pos wajib diisi'
      } else if (!/^\d{5}$/.test(formData.originPostalCode)) {
        newErrors.originPostalCode = 'Kode pos harus 5 digit'
      }
      if (!formData.originAddressText) {
        newErrors.originAddressText = 'Alamat wajib diisi'
      } else if (formData.originAddressText.length < 10) {
        newErrors.originAddressText = 'Alamat minimal 10 karakter'
      }
    } else if (step === 3) {
      if (!formData.bankName) {
        newErrors.bankName = 'Nama bank wajib dipilih'
      }
      if (!formData.accountNumber) {
        newErrors.accountNumber = 'Nomor rekening wajib diisi'
      } else if (!/^\d{10,15}$/.test(formData.accountNumber)) {
        newErrors.accountNumber = 'Nomor rekening harus 10-15 digit'
      }
      if (!formData.accountHolderName) {
        newErrors.accountHolderName = 'Nama pemilik rekening wajib diisi'
      } else if (formData.accountHolderName.length < 3) {
        newErrors.accountHolderName = 'Nama pemilik minimal 3 karakter'
      }
    }

    return newErrors
  }, [formData])

  // Use useMemo to compute canGoNext without side effects
  const canGoNext = useMemo(() => {
    const validationErrors = getValidationErrors(currentStep)
    return Object.keys(validationErrors).length === 0
  }, [getValidationErrors, currentStep])

  const canGoBack = currentStep > 1

  const goNext = () => {
    const validationErrors = getValidationErrors(currentStep)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }
    if (currentStep < 3) {
      setCurrentStep((prev) => (prev + 1) as OnboardingStep)
      setErrors({})
      setGeneralError('')
    }
  }

  const goBack = () => {
    if (canGoBack) {
      setCurrentStep((prev) => (prev - 1) as OnboardingStep)
      setErrors({})
      setGeneralError('')
    }
  }

  const submitProfile = async () => {
    try {
      setIsSubmitting(true)
      // Clear previous errors before submission
      setErrors({})
      setGeneralError('')

      // Validate step 3 before submission
      const validationErrors = getValidationErrors(3)
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors)
        return
      }

      const response = await apiPatch<{ user: any }>('/users/complete-profile', formData)

      if (response.user) {
        // Refresh user data in auth context
        await refreshUser()

        // Close modal
        setModalOpen(false)

        // Reset form
        setFormData({})
        setErrors({})
        setGeneralError('')
        setCurrentStep(1)
      }
    } catch (error: any) {
      // Parse API error response
      const { fieldErrors, generalError } = parseOnboardingError(error)
      
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors)
      }
      if (generalError) {
        setGeneralError(generalError)
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const value: OnboardingContextType = {
    isModalOpen,
    setModalOpen,
    currentStep,
    setCurrentStep,
    formData,
    updateFormData,
    errors,
    setErrors,
    generalError,
    setGeneralError,
    isSubmitting,
    submitProfile,
    canGoNext,
    canGoBack,
    goNext,
    goBack,
  }

  return (
    <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>
  )
}

/**
 * Hook to use onboarding context
 * @returns Onboarding context value
 * @throws Error if used outside OnboardingProvider
 */
export function useOnboarding() {
  const context = useContext(OnboardingContext)
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider')
  }
  return context
}
