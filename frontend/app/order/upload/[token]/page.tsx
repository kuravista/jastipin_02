'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Loader2, CheckCircle2, Upload } from 'lucide-react'

type UploadStep = 'validating' | 'challenge' | 'upload' | 'success' | 'error'

// Helper function to translate error messages
const translateError = (error: string): { title: string; message: string; hint?: string } => {
  const errorLower = error.toLowerCase()

  if (errorLower.includes('token revoked') || errorLower.includes('already used')) {
    return {
      title: '✅ Bukti Pembayaran Sudah Diupload',
      message: 'Link ini sudah pernah digunakan untuk mengupload bukti pembayaran. Setiap link hanya bisa digunakan satu kali untuk keamanan.',
      hint: 'Jika Anda ingin mengupload ulang, silakan hubungi Jastiper Anda.'
    }
  }

  if (errorLower.includes('expired') || errorLower.includes('kadaluarsa')) {
    return {
      title: '⏰ Link Sudah Kadaluarsa',
      message: 'Link upload ini sudah tidak berlaku. Link hanya valid selama 7 hari setelah checkout.',
      hint: 'Silakan hubungi Jastiper Anda untuk mendapatkan link baru.'
    }
  }

  if (errorLower.includes('invalid token')) {
    return {
      title: '❌ Link Tidak Valid',
      message: 'Link yang Anda gunakan tidak valid atau salah. Pastikan Anda menggunakan link yang lengkap dari email atau popup checkout.',
      hint: 'Salin link lengkap dari email konfirmasi yang Anda terima.'
    }
  }

  return {
    title: 'Link Tidak Valid',
    message: error || 'Terjadi kesalahan saat memvalidasi link.'
  }
}

export default function GuestUploadPage() {
  const params = useParams()
  const router = useRouter()
  const token = params.token as string

  const [step, setStep] = useState<UploadStep>('validating')
  const [challenge, setChallenge] = useState('')
  const [error, setError] = useState('')
  const [orderId, setOrderId] = useState('')
  const [challengeResponse, setChallengeResponse] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [jastiperSlug, setJastiperSlug] = useState<string | null>(null)

  useEffect(() => {
    validateToken()
  }, [token])

  const validateToken = async () => {
    try {
      const response = await fetch(`/api/upload/validate?token=${encodeURIComponent(token)}`)
      const data = await response.json()

      if (!response.ok || !data.valid) {
        setError(data.error || 'Token tidak valid atau sudah kadaluarsa')
        setStep('error')
        return
      }

      setChallenge(data.challenge)
      setJastiperSlug(data.jastiperSlug)
      setStep('challenge')
    } catch (err: any) {
      setError(err.message || 'Gagal memvalidasi token')
      setStep('error')
    }
  }

  const handleVerifyChallenge = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (challengeResponse.length !== 4 || !/^\d{4}$/.test(challengeResponse)) {
      setError('Masukkan 4 digit angka')
      return
    }

    try {
      const response = await fetch('/api/upload/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          challengeResponse
        })
      })

      const data = await response.json()

      if (!response.ok || !data.verified) {
        setError(data.error || 'Kode verifikasi salah')
        return
      }

      setOrderId(data.orderId)
      setStep('upload')
    } catch (err: any) {
      setError(err.message || 'Gagal memverifikasi kode')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.size > 5 * 1024 * 1024) {
        setError('Ukuran file maksimal 5MB')
        return
      }
      setFile(selectedFile)
      setError('')
    }
  }

  const handleUpload = async () => {
    if (!file) {
      setError('Pilih file terlebih dahulu')
      return
    }

    setUploading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch(`/api/upload/${orderId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Gagal mengupload file')
      }

      setStep('success')
    } catch (err: any) {
      setError(err.message || 'Gagal mengupload bukti pembayaran')
    } finally {
      setUploading(false)
    }
  }

  if (step === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
            <p className="text-gray-600">Memvalidasi link...</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'error') {
    const errorInfo = translateError(error)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-6 h-6 text-amber-500" />
              <CardTitle className="text-gray-900">{errorInfo.title}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">{errorInfo.message}</p>

              {errorInfo.hint && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800">
                    <strong>💡 Saran:</strong> {errorInfo.hint}
                  </p>
                </div>
              )}
            </div>

            <Button variant="outline" onClick={() => router.push(jastiperSlug ? `/${jastiperSlug}` : '/')} className="w-full">
              Kembali ke {jastiperSlug ? 'Profil Jastiper' : 'Beranda'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'challenge') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Verifikasi Identitas</CardTitle>
            <CardDescription>
              Masukkan 4 digit terakhir nomor WhatsApp Anda untuk melanjutkan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyChallenge} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="challenge">4 Digit Terakhir WhatsApp</Label>
                <div className="flex items-center space-x-2">
                  <span className="text-gray-500">+62 8xx-xxxx-</span>
                  <Input
                    id="challenge"
                    type="text"
                    inputMode="numeric"
                    pattern="\d{4}"
                    maxLength={4}
                    value={challengeResponse}
                    onChange={(e) => setChallengeResponse(e.target.value.replace(/\D/g, ''))}
                    placeholder="____"
                    className="w-24 text-center text-2xl font-mono"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-sm text-gray-500">
                  Contoh: Jika nomor Anda 0812-3456-7890, masukkan <strong>7890</strong>
                </p>
              </div>

              <Button type="submit" className="w-full" size="lg">
                Verifikasi
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (step === 'upload') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-blue-50 py-8 px-4">
        <div className="container max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Upload Bukti Pembayaran</CardTitle>
              <CardDescription>
                Upload bukti transfer untuk order #{orderId.slice(0, 8)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <Label htmlFor="file">Pilih File Bukti Pembayaran</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors cursor-pointer">
                  <input
                    id="file"
                    type="file"
                    accept="image/*,.pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="file" className="cursor-pointer">
                    <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    {file ? (
                      <div>
                        <p className="font-medium text-gray-900">{file.name}</p>
                        <p className="text-sm text-gray-500">
                          {(file.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="font-medium text-gray-900 mb-1">
                          Klik untuk memilih file
                        </p>
                        <p className="text-sm text-gray-500">
                          PNG, JPG, atau PDF (maks. 5MB)
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm">
                <p className="text-blue-800">
                  <strong>Pastikan bukti transfer mencakup:</strong>
                </p>
                <ul className="list-disc list-inside text-blue-700 mt-2 space-y-1">
                  <li>Nominal transfer yang sesuai</li>
                  <li>Tanggal dan waktu transfer</li>
                  <li>Nama rekening tujuan</li>
                </ul>
              </div>

              <Button
                onClick={handleUpload}
                disabled={!file || uploading}
                className="w-full"
                size="lg"
              >
                {uploading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Mengupload...
                  </>
                ) : (
                  <>Upload Bukti Pembayaran</>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-50 to-blue-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
            <h2 className="text-2xl font-bold text-gray-900">Berhasil!</h2>
            <p className="text-center text-gray-600">
              Bukti pembayaran Anda telah diterima. Jastiper akan segera memverifikasi pembayaran Anda.
            </p>
            <Button onClick={() => router.push(jastiperSlug ? `/${jastiperSlug}` : '/')} className="w-full">
              Kembali ke {jastiperSlug ? 'Profil Jastiper' : 'Beranda'}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return null
}
