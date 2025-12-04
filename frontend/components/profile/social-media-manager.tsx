"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiGet, apiPost, apiPatch, apiDelete } from "@/lib/api-client"
import { Plus, Trash2, Instagram, Youtube, Facebook, Twitter, MessageCircle, ShoppingCart, Briefcase, Send, MessageSquare } from "lucide-react"

interface SocialMediaAccount {
  id: string
  platform: string
  handle: string
  url?: string
}

const PLATFORMS = [
  { value: 'INSTAGRAM', label: 'Instagram', icon: Instagram, color: 'text-pink-600' },
  { value: 'YOUTUBE', label: 'YouTube', icon: Youtube, color: 'text-red-600' },
  { value: 'TIKTOK', label: 'TikTok', icon: MessageCircle, color: 'text-black' },
  { value: 'FACEBOOK', label: 'Facebook', icon: Facebook, color: 'text-blue-600' },
  { value: 'TWITTER', label: 'Twitter/X', icon: Twitter, color: 'text-blue-400' },
  { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle, color: 'text-green-600' },
  { value: 'SHOPEE', label: 'Shopee', icon: ShoppingCart, color: 'text-orange-600' },
  { value: 'LINKEDIN', label: 'LinkedIn', icon: Briefcase, color: 'text-blue-600' },
  { value: 'TELEGRAM', label: 'Telegram', icon: Send, color: 'text-blue-500' },
  { value: 'DISCORD', label: 'Discord', icon: MessageSquare, color: 'text-indigo-600' },
]

export function SocialMediaManager() {
  const [accounts, setAccounts] = useState<SocialMediaAccount[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [newAccount, setNewAccount] = useState({ platform: '', handle: '' })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const data = await apiGet<SocialMediaAccount[]>('/social-media')
      setAccounts(data)
    } catch (err) {
      console.error('Failed to fetch social media accounts', err)
    }
  }

  const handleAdd = async () => {
    if (!newAccount.platform || !newAccount.handle.trim()) {
      setError('Platform dan handle harus diisi')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const created = await apiPost<SocialMediaAccount>('/social-media', newAccount)
      setAccounts([...accounts, created])
      setNewAccount({ platform: '', handle: '' })
      setIsAdding(false)
    } catch (err: any) {
      setError(err.message || 'Gagal menambahkan akun')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus akun social media ini?')) return

    setLoading(true)
    try {
      await apiDelete(`/social-media/${id}`)
      setAccounts(accounts.filter(acc => acc.id !== id))
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus akun')
    } finally {
      setLoading(false)
    }
  }

  const getPlatformInfo = (platform: string) => {
    return PLATFORMS.find(p => p.value === platform) || { label: platform, icon: MessageCircle, color: 'text-gray-600' }
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Existing Accounts */}
      <div className="space-y-2">
        {accounts.map((account) => {
          const platformInfo = getPlatformInfo(account.platform)
          const Icon = platformInfo.icon
          return (
            <div key={account.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <Icon className={`w-5 h-5 ${platformInfo.color}`} />
              <div className="flex-1">
                <div className="font-medium text-sm">{platformInfo.label}</div>
                <div className="text-xs text-gray-600">@{account.handle}</div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(account.id)}
                disabled={loading}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          )
        })}
      </div>

      {/* Add New Account */}
      {isAdding ? (
        <div className="space-y-3 p-4 border border-gray-200 rounded-lg bg-white">
          <div>
            <Label>Platform</Label>
            <Select
              value={newAccount.platform}
              onValueChange={(value) => setNewAccount({ ...newAccount, platform: value })}
            >
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Pilih platform" />
              </SelectTrigger>
              <SelectContent>
                {PLATFORMS.filter(p => !accounts.some(acc => acc.platform === p.value)).map((platform) => {
                  const Icon = platform.icon
                  return (
                    <SelectItem key={platform.value} value={platform.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`w-4 h-4 ${platform.color}`} />
                        <span>{platform.label}</span>
                      </div>
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Username/Handle</Label>
            <Input
              value={newAccount.handle}
              onChange={(e) => setNewAccount({ ...newAccount, handle: e.target.value })}
              placeholder="username"
              className="mt-2"
            />
            <p className="text-xs text-gray-500 mt-1">Tanpa simbol @ di awal</p>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleAdd}
              disabled={loading}
              className="flex-1 bg-[#FB923C] hover:bg-[#EA7C2C]"
            >
              {loading ? 'Menambahkan...' : 'Tambahkan'}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setIsAdding(false)
                setNewAccount({ platform: '', handle: '' })
                setError(null)
              }}
              disabled={loading}
            >
              Batal
            </Button>
          </div>
        </div>
      ) : (
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setIsAdding(true)}
        >
          <Plus className="w-4 h-4 mr-2" />
          Tambah Social Media
        </Button>
      )}

      {accounts.length === 0 && !isAdding && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Belum ada akun social media
        </div>
      )}
    </div>
  )
}
