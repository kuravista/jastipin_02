# Export Feature Documentation

## Overview

Fitur Export memungkinkan Jastiper untuk mengexport data order ke format Excel dan PDF shipping label langsung dari dashboard validasi order.

## Lokasi

Dashboard → Validasi Order → Tombol "Export" (di samping judul halaman)

## Fitur Export

### 1. Export Excel

**Fungsi:** Mengexport semua order yang tampil (sesuai filter aktif) ke file Excel (.xlsx)

**Kolom yang disertakan:**
- No. Order
- Tanggal
- Status
- Nama Customer
- No. HP Customer
- Produk (list items)
- Total Produk
- Ongkir
- Jasa
- DP
- Total Order
- Nama Penerima
- No. HP Penerima
- Alamat
- Kecamatan
- Kota
- Provinsi
- Kode Pos
- Trip

**Nama File:** `jastipin-orders-YYYY-MM-DD.xlsx`

### 2. Export Label (PDF Shipping Labels)

**Fungsi:** Menghasilkan PDF berisi label pengiriman untuk order dengan status "Selesai/Paid"

**Ukuran Label:** 4 x 6 inch (101.6mm x 152.4mm) - standar internasional yang diterima hampir semua ekspedisi

**Layout Label:**
```
┌─────────────────────────────────┐
│ No: JST-XXXXX         26 Nov 25 │  ← Header (order code + tanggal)
├─────────────────────────────────┤
│ PENERIMA:                       │
│ Nama Penerima (besar, bold)     │  ← Data penerima lengkap
│ 08123456789                     │
│ Alamat lengkap,                 │
│ Kec. xxx                        │
│ Kota, Provinsi                  │
│ Kode Pos: 12345                 │
├═════════════════════════════════┤
│ PENGIRIM:                       │
│ Nama Jastiper                   │  ← Nama & No WA saja
│ 08xxxxxxxxxx                    │
├─────────────────────────────────┤
│ ISI PAKET:                      │
│ • Produk A x2                   │
│ • Produk B x1                   │
│ Berat: 1.5 kg                   │
│                                 │
│ ┌─────────────────────────────┐ │
│ │  Area Barcode/QR Ekspedisi  │ │  ← Space untuk barcode
│ └─────────────────────────────┘ │
│                                 │
│          jastipin.me            │  ← Watermark
└─────────────────────────────────┘
```

**Nama File:** `jastipin-labels-YYYY-MM-DD.pdf`

## Persyaratan

### Export Label
- **Alamat asal jastiper harus sudah diatur** di pengaturan profil (Settings → Profil → Alamat Asal)
- Hanya order dengan status `paid` (Selesai) yang akan digenerate labelnya
- Order harus memiliki alamat pengiriman yang valid

## Technical Implementation

### Frontend Files
- `/frontend/lib/export-utils.ts` - Utility functions untuk generate Excel dan PDF
- `/frontend/components/dashboard/dashboard-validasi.tsx` - Komponen dashboard dengan tombol export

### Dependencies
- `xlsx` - Library untuk generate file Excel
- `jspdf` - Library untuk generate PDF

### API Endpoint
- `GET /api/orders?status=paid&limit=500` - Fetch orders untuk export

## Batasan

- Maksimum 500 order per export (batasan API)
- Export Label hanya untuk order status "Selesai/Paid"
- Membutuhkan alamat asal jastiper yang sudah dikonfigurasi

## Referensi

- [EasyPost Shipping Label Sizes](https://support.easypost.com/hc/en-us/articles/360044915671-Shipping-Label-Sizes) - Standar ukuran label 4x6 inch
