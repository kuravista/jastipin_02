"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Bell, Lock, LogOut, User, CreditCard, HelpCircle, Plane, UserCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth-context"
import { clearAuthToken } from "@/lib/api-client"
import { EditProfileDialog } from "@/components/dialogs/edit-profile-dialog"
import { EditPrivateDataDialog } from "@/components/dialogs/edit-private-data-dialog"
import { ChangePasswordDialog } from "@/components/dialogs/change-password-dialog"
import { NotificationsDialog } from "@/components/dialogs/notifications-dialog"
import { BillingDialog } from "@/components/dialogs/billing-dialog"

export default function DashboardAccount({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const router = useRouter()
  const { user } = useAuth()
  const [editProfileOpen, setEditProfileOpen] = useState(false)
  const [editPrivateDataOpen, setEditPrivateDataOpen] = useState(false)
  const [changePasswordOpen, setChangePasswordOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [billingOpen, setBillingOpen] = useState(false)

  const handleLogout = () => {
    clearAuthToken()
    router.push("/auth/login")
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Akun Saya</h1>
        <p className="text-gray-600">Kelola profil dan pengaturan akun</p>
      </div>

      {/* User Info */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-pink-200 to-purple-200 flex items-center justify-center overflow-hidden">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.profileName || 'User'} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-white">
                {(user?.profileName || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div className="flex-1 overflow-hidden">
            <div className="font-bold text-gray-900 truncate">{user?.profileName || 'Pengguna'}</div>
            <div className="text-sm text-gray-600 truncate">{user?.email}</div>
            <div className="text-xs text-gray-500 mt-1 truncate">jastipin.me/{user?.slug}</div>
          </div>
        </div>
      </div>

      {/* Section 1: Profil Publik */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Profil Publik</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <button
            onClick={() => setEditProfileOpen(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <UserCircle className="w-5 h-5 text-gray-600" />
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Edit Halaman Profil</div>
              <div className="text-sm text-gray-600">Ubah bio, foto, dan link sosial media</div>
            </div>
          </button>

          <button
            onClick={() => onNavigate?.("trips")}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <Plane className="w-5 h-5 text-gray-600" />
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Kelola Trip</div>
              <div className="text-sm text-gray-600">Lihat dan kelola semua trip jastip</div>
            </div>
          </button>
        </div>
      </div>

      {/* Section 2: Pengaturan */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Pengaturan</h2>
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          <button 
            onClick={() => setEditPrivateDataOpen(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <User className="w-5 h-5 text-gray-600" />
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Informasi Pribadi</div>
              <div className="text-sm text-gray-600">Edit data diri dan alamat asal pengiriman</div>
            </div>
          </button>

          <button 
            onClick={() => setChangePasswordOpen(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <Lock className="w-5 h-5 text-gray-600" />
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Keamanan</div>
              <div className="text-sm text-gray-600">Ubah password dan pengaturan keamanan</div>
            </div>
          </button>

          <button 
            onClick={() => setNotificationsOpen(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600" />
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Notifikasi</div>
              <div className="text-sm text-gray-600">Kelola preferensi notifikasi</div>
            </div>
          </button>

          <button 
            onClick={() => setBillingOpen(true)}
            className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
          >
            <CreditCard className="w-5 h-5 text-gray-600" />
            <div className="flex-1 text-left">
              <div className="font-semibold text-gray-900">Paket & Billing</div>
              <div className="text-sm text-gray-600">Lihat paket aktif dan riwayat pembayaran</div>
            </div>
          </button>
        </div>
      </div>

      {/* Help & Support */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <button className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
          <HelpCircle className="w-5 h-5 text-gray-600" />
          <div className="flex-1 text-left">
            <div className="font-semibold text-gray-900">Bantuan & Support</div>
            <div className="text-sm text-gray-600">FAQ, tutorial, dan hubungi tim support</div>
          </div>
        </button>
      </div>

      {/* Section 3: Logout */}
      <Button
        onClick={handleLogout}
        variant="outline"
        className="w-full h-12 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-semibold bg-transparent"
      >
        <LogOut className="w-5 h-5 mr-2" />
        Keluar dari Akun
      </Button>

      {/* Edit Profile Dialog */}
      <EditProfileDialog open={editProfileOpen} onOpenChange={setEditProfileOpen} />
      <EditPrivateDataDialog open={editPrivateDataOpen} onOpenChange={setEditPrivateDataOpen} />
      <ChangePasswordDialog open={changePasswordOpen} onOpenChange={setChangePasswordOpen} />
      <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
      <BillingDialog open={billingOpen} onOpenChange={setBillingOpen} />
    </div>
  )
}
