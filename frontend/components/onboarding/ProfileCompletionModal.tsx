/**
 * Profile Completion Modal
 * Main wizard container with progress indicator and step navigation
 */

'use client'

import React from 'react'
import { useOnboarding } from './OnboardingProvider'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Step1PersonalInfo } from './steps/Step1PersonalInfo'
import { Step2OriginAddress } from './steps/Step2OriginAddress'
import { Step3BankAccount } from './steps/Step3BankAccount'
import { Loader2, AlertCircle } from 'lucide-react'

export function ProfileCompletionModal() {
  const {
    isModalOpen,
    currentStep,
    canGoNext,
    canGoBack,
    goNext,
    goBack,
    submitProfile,
    isSubmitting,
    generalError,
    setGeneralError,
  } = useOnboarding()

  return (
    <Dialog open={isModalOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl p-0">
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#FB923C] to-[#F26B8A] p-6 text-white">
            <h2 className="text-2xl font-bold mb-2">Selamat Datang di Jastipin! 🎉</h2>
            <p className="text-sm opacity-90">Lengkapi profil Anda untuk mulai jualan</p>
          </div>

          {/* Progress Indicator */}
          <div className="px-6 pt-6 pb-4">
            <div className="flex gap-3">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex-1">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      currentStep >= step ? 'bg-[#FB923C]' : 'bg-gray-200'
                    }`}
                  />
                  <p className="text-xs font-medium mt-2 text-gray-600">
                    {step === 1 && 'Info Personal'}
                    {step === 2 && 'Alamat'}
                    {step === 3 && 'Bank'}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Error Banner */}
          {generalError && (
            <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex gap-2">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{generalError}</p>
            </div>
          )}

          {/* Step Content */}
          <div className="px-6 py-4 min-h-96">
            {currentStep === 1 && <Step1PersonalInfo />}
            {currentStep === 2 && <Step2OriginAddress />}
            {currentStep === 3 && <Step3BankAccount />}
          </div>

          {/* Navigation */}
          <div className="px-6 py-4 bg-gray-50 border-t flex justify-between gap-3">
            <Button
              onClick={goBack}
              disabled={!canGoBack || isSubmitting}
              variant="outline"
              className="flex-1"
            >
              Kembali
            </Button>

            {currentStep < 3 ? (
              <Button
                onClick={goNext}
                disabled={!canGoNext || isSubmitting}
                className="flex-1 bg-[#FB923C] hover:bg-[#EA7C2C]"
              >
                Lanjut
              </Button>
            ) : (
              <Button
                onClick={submitProfile}
                disabled={!canGoNext || isSubmitting}
                className="flex-1 bg-[#FB923C] hover:bg-[#EA7C2C]"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan & Selesai'
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
