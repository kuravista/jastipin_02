"use client"

import { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Bell, Check, Clock } from "lucide-react"
import { cn } from "@/lib/utils"

interface NotificationsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Notification {
  id: string
  title: string
  message: string
  time: string
  read: boolean
  type: 'info' | 'success' | 'warning'
}

// Mock data
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: '1',
    title: 'Pesanan Diterima',
    message: 'Pesanan #ORD-2023-001 telah diterima oleh traveler.',
    time: '2 jam yang lalu',
    read: false,
    type: 'success'
  },
  {
    id: '2',
    title: 'Pembayaran Berhasil',
    message: 'Pembayaran untuk transaksi #TRX-998877 berhasil diverifikasi.',
    time: '1 hari yang lalu',
    read: true,
    type: 'info'
  },
  {
    id: '3',
    title: 'Update Status Pengiriman',
    message: 'Paket Anda sedang dalam perjalanan menuju Jakarta.',
    time: '2 hari yang lalu',
    read: true,
    type: 'info'
  },
  {
    id: '4',
    title: 'Peringatan Akun',
    message: 'Silakan verifikasi email Anda untuk keamanan akun.',
    time: '3 hari yang lalu',
    read: true,
    type: 'warning'
  }
]

export function NotificationsDialog({ open, onOpenChange }: NotificationsDialogProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [emailNotif, setEmailNotif] = useState(true)
  const [whatsappNotif, setWhatsappNotif] = useState(true)

  useEffect(() => {
    if (open) {
      // Simulate fetch
      setNotifications(MOCK_NOTIFICATIONS)
    }
  }, [open])

  const markAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
  }

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-3xl px-0 max-h-[85vh] flex flex-col">
        <SheetHeader className="px-6 pt-4 pb-2">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5" />
              Notifikasi
            </SheetTitle>
            <button 
              onClick={markAllAsRead}
              className="text-xs text-orange-500 font-medium hover:text-orange-600"
            >
              Tandai semua dibaca
            </button>
          </div>
          <SheetDescription>
            Update terbaru seputar aktivitas akun Anda
          </SheetDescription>
        </SheetHeader>
        
        <div className="px-6 py-4 border-b border-gray-100 space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="email-notif" className="text-sm font-medium text-gray-700">Notifikasi Email</Label>
            <Switch id="email-notif" checked={emailNotif} onCheckedChange={setEmailNotif} />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="wa-notif" className="text-sm font-medium text-gray-700">Notifikasi WhatsApp</Label>
            <Switch id="wa-notif" checked={whatsappNotif} onCheckedChange={setWhatsappNotif} />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-400">
              <Bell className="w-10 h-10 mb-2 opacity-20" />
              <p className="text-sm">Belum ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-3 mt-2">
              {notifications.map((item) => (
                <div 
                  key={item.id} 
                  className={cn(
                    "p-4 rounded-xl border transition-all cursor-pointer",
                    item.read ? "bg-white border-gray-100" : "bg-orange-50/50 border-orange-100"
                  )}
                  onClick={() => markAsRead(item.id)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={cn("text-sm font-semibold", item.read ? "text-gray-700" : "text-gray-900")}>
                      {item.title}
                    </h4>
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-orange-500 block" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-2">
                    {item.message}
                  </p>
                  <div className="flex items-center gap-1 text-[10px] text-gray-400">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
