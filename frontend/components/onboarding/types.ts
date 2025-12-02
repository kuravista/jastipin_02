/**
 * Onboarding Type Definitions
 * Interfaces for profile completion and tutorial tracking
 */

export interface ProfileCompletionData {
  profileName: string
  whatsappNumber: string
  originProvinceId: string
  originProvinceName: string
  originCityId: string
  originCityName: string
  originDistrictId: string
  originDistrictName: string
  originRajaOngkirDistrictId: string
  originPostalCode: string
  originAddressText: string
  bankName: string
  accountNumber: string
  accountHolderName: string
}

export interface LocationOption {
  id: string
  code: string
  name: string
}

export interface RajaOngkirSearchResult {
  subdistrict_id: string
  subdistrict_name: string
  type: string
  city: string
  province: string
}

export type OnboardingStep = 1 | 2 | 3

export interface StepValidation {
  isValid: boolean
  errors: Record<string, string>
}
