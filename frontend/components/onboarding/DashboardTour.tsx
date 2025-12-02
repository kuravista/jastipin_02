/**
 * Dashboard Interactive Tour
 * Uses React Joyride to guide new users through dashboard features
 */

'use client'

import React, { useEffect, useState } from 'react'
import Joyride, { Step, CallBackProps, STATUS, ACTIONS, EVENTS } from 'react-joyride'

interface DashboardTourProps {
  run: boolean
  onFinish: () => void
  onSkip?: () => void
}

export function DashboardTour({ run, onFinish, onSkip }: DashboardTourProps) {
  const [stepIndex, setStepIndex] = useState(0)

  const steps: Step[] = [
    {
      target: '[data-tour="create-trip"]',
      content: (
        <div>
          <h3 className="text-base font-bold mb-2">1. Buat Trip Dulu ✈️</h3>
          <p className="text-sm">
            Langkah pertama! Buat trip untuk mengorganisir produk berdasarkan lokasi atau tanggal 
            belanja. Setiap trip bisa memiliki banyak produk.
          </p>
        </div>
      ),
      placement: 'bottom' as const,
      disableBeacon: true,
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="upload-product"]',
      content: (
        <div>
          <h3 className="text-base font-bold mb-2">2. Upload Produk 📦</h3>
          <p className="text-sm">
            Setelah trip dibuat, tambahkan produk yang ingin Anda jual. Bisa upload satu per satu 
            atau massal!
          </p>
        </div>
      ),
      placement: 'bottom' as const,
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="edit-profile"]',
      content: (
        <div>
          <h3 className="text-base font-bold mb-2">3. Edit Data Profil ⚙️</h3>
          <p className="text-sm">
            Klik avatar untuk mengakses pengaturan akun. Di sini Anda bisa mengubah nama, alamat, 
            rekening bank, dan data lainnya.
          </p>
        </div>
      ),
      placement: 'left' as const,
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="profile-url"]',
      content: (
        <div>
          <h3 className="text-base font-bold mb-2">4. Bagikan Link Profil 🔗</h3>
          <p className="text-sm">
            Ini adalah link publik profil Anda. Klik untuk copy dan bagikan ke calon pembeli di
            WhatsApp, Instagram, atau media sosial lainnya!
          </p>
        </div>
      ),
      placement: 'bottom' as const,
      spotlightPadding: 8,
    },
    {
      target: '[data-tour="validasi-card"]',
      content: (
        <div>
          <h3 className="text-base font-bold mb-2">5. Pantau Order Masuk 💰</h3>
          <p className="text-sm">
            Di sini Anda bisa melihat order baru yang masuk. Periksa detail pembeli, jumlah, dan 
            bukti pembayaran sebelum memproses.
          </p>
        </div>
      ),
      placement: 'top' as const,
      spotlightPadding: 8,
    },
    {
      target: 'body',
      content: (
        <div className="text-center">
          <h3 className="text-base font-bold mb-2">Selamat! 🎉</h3>
          <p className="text-sm">
            Anda sudah siap untuk mulai jualan. Selamat berjualan di Jastipin dan semoga sukses
            besar! 🚀
          </p>
        </div>
      ),
      placement: 'center' as const,
      disableBeacon: true,
    },
  ]

  const handleJoyrideCallback = (data: CallBackProps) => {
    const { action, index, status, type } = data

    // Update step index when user navigates
    if (type === EVENTS.STEP_AFTER || type === EVENTS.TARGET_NOT_FOUND) {
      setStepIndex(index + (action === ACTIONS.PREV ? -1 : 1))
    }

    // Handle tour completion or skip
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      onFinish()
    }
  }

  return (
    <Joyride
      steps={steps}
      run={run}
      stepIndex={stepIndex}
      continuous
      showProgress
      showSkipButton
      hideCloseButton
      disableOverlayClose
      disableScrolling={false}
      callback={handleJoyrideCallback}
      styles={{
        options: {
          primaryColor: '#FB923C',
          zIndex: 10000,
          textColor: '#1F2937',
          backgroundColor: '#FFFFFF',
          arrowColor: '#FFFFFF',
          overlayColor: 'rgba(0, 0, 0, 0.5)',
          spotlightShadow: '0 0 15px rgba(0, 0, 0, 0.5)',
        },
        tooltip: {
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
          padding: '16px',
        },
        buttonNext: {
          backgroundColor: '#FB923C',
          borderRadius: '8px',
          outline: 'none',
          fontWeight: 600,
          padding: '8px 16px',
          fontSize: '14px',
        },
        buttonBack: {
          color: '#6B7280',
          marginRight: '8px',
          fontWeight: 600,
        },
        buttonSkip: {
          color: '#F26B8A',
          fontWeight: 600,
        },
      }}
      locale={{
        back: 'Kembali',
        close: 'Tutup',
        last: 'Selesai',
        next: 'Lanjut',
        skip: 'Lewati',
      }}
    />
  )
}
