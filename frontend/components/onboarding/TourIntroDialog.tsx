/**
 * Tour Intro Dialog
 * Shown after profile completion asking if user wants to see dashboard tour
 */

'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Check, Loader2 } from 'lucide-react'

interface TourIntroDialogProps {
  open: boolean
  onStartTour: () => void
  onSkip: () => Promise<void>
}

export function TourIntroDialog({ open, onStartTour, onSkip }: TourIntroDialogProps) {
  const [isSkipping, setIsSkipping] = useState(false)

  const handleSkip = async () => {
    setIsSkipping(true)
    try {
      await onSkip()
    } catch (error) {
      console.error('Failed to skip tour:', error)
    } finally {
      setIsSkipping(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-md p-0" onInteractOutside={(e) => e.preventDefault()}>
        <div className="bg-white rounded-lg overflow-hidden">
          {/* Success Icon */}
          <div className="flex justify-center py-8 bg-gradient-to-r from-[#FB923C] to-[#F26B8A]">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg">
              <Check className="w-8 h-8 text-green-500" />
            </div>
          </div>

          {/* Content */}
          <div className="p-6 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Profil Sudah Lengkap! ✓</h2>

            <p className="text-gray-600 mb-2">Mau tur singkat dashboard dulu?</p>
            <p className="text-sm text-gray-500">(hanya 1-2 menit)</p>

            {/* Buttons */}
            <div className="flex gap-3 mt-8">
              <Button
                onClick={handleSkip}
                disabled={isSkipping}
                variant="outline"
                className="flex-1 border-gray-300"
              >
                {isSkipping ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Melewati...
                  </>
                ) : (
                  'Skip, Langsung Mulai'
                )}
              </Button>

              <Button
                onClick={onStartTour}
                disabled={isSkipping}
                className="flex-1 bg-[#FB923C] hover:bg-[#EA7C2C] text-white"
              >
                Mulai Tur
              </Button>
            </div>

            {/* Info */}
            <p className="text-xs text-gray-500 mt-6">
              💡 Anda bisa mengulangi tur kapan saja dari Account Settings
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
