"use client"

import { useState } from "react"
import { Home, DollarSign, Package, User } from "lucide-react"
import DashboardHome from "@/components/dashboard/dashboard-home"
import DashboardValidasi from "@/components/dashboard/dashboard-validasi"
import DashboardProduk from "@/components/dashboard/dashboard-produk"
import DashboardProfile from "@/components/dashboard/dashboard-profile"
import DashboardTrips from "@/components/dashboard/dashboard-trips"
import DashboardAccount from "@/components/dashboard/dashboard-account"

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState("home")

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-blue-50 pb-20">
      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 max-w-2xl">
        {activeTab === "home" && <DashboardHome onNavigate={setActiveTab} />}
        {activeTab === "validasi" && <DashboardValidasi />}
        {activeTab === "produk" && <DashboardProduk />}
        {activeTab === "profile" && <DashboardProfile onBack={() => setActiveTab("account")} />}
        {activeTab === "trips" && <DashboardTrips onBack={() => setActiveTab("account")} />}
        {activeTab === "account" && <DashboardAccount onNavigate={setActiveTab} />}
      </div>

      {/* Bottom Tab Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
        <div className="container mx-auto max-w-2xl">
          <div className="grid grid-cols-4 h-16">
            <button
              onClick={() => setActiveTab("home")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "home" ? "text-[#F26B8A]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Home className="w-6 h-6" />
              <span className="text-xs font-medium">Home</span>
            </button>

            <button
              onClick={() => setActiveTab("validasi")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors relative ${
                activeTab === "validasi" ? "text-[#F26B8A]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <DollarSign className="w-6 h-6" />
              <span className="text-xs font-medium">Validasi</span>
              {/* Badge for pending orders */}
              <span className="absolute top-1 right-6 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </button>

            <button
              onClick={() => setActiveTab("produk")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "produk" ? "text-[#F26B8A]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <Package className="w-6 h-6" />
              <span className="text-xs font-medium">Produk</span>
            </button>

            <button
              onClick={() => setActiveTab("account")}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                activeTab === "account" ? "text-[#F26B8A]" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              <User className="w-6 h-6" />
              <span className="text-xs font-medium">Akun</span>
            </button>
          </div>
        </div>
      </nav>
    </div>
  )
}
