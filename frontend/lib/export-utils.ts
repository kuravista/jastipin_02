/**
 * Export Utilities for Orders
 * 
 * Provides functionality to export order data to Excel and PDF shipping labels.
 * Shipping labels follow the standard 4x6 inch format accepted by most carriers.
 */

import * as XLSX from 'xlsx'
import { jsPDF } from 'jspdf'

/**
 * Order data structure for export
 */
export interface ExportOrder {
  id: string
  orderCode: string | null
  status: string
  dpAmount: number
  totalPrice: number
  shippingFee?: number
  serviceFee?: number
  createdAt: string
  dpPaidAt?: string | null
  Participant: {
    name: string
    phone: string
  }
  OrderItem: {
    Product: {
      id: string
      title: string
      type: string
      weightGram?: number | null
    }
    quantity: number
    priceAtOrder: number
  }[]
  Address?: {
    recipientName: string
    phone: string
    addressText: string
    districtId: string
    districtName: string
    cityName: string
    provinceName: string
    postalCode?: string | null
  } | null
  Trip?: {
    id: string
    title: string
  }
}

/**
 * Sender (Jastiper) information for shipping labels
 */
export interface SenderInfo {
  name: string
  phone: string
  address: string
  city: string
  province: string
  postalCode?: string
}

/**
 * Export orders to Excel file
 * 
 * @param orders - Array of orders to export
 * @param filename - Name of the exported file (without extension)
 */
export function exportToExcel(orders: ExportOrder[], filename: string = 'orders-export'): void {
  // Transform orders to flat structure for Excel
  const data = orders.map((order) => {
    const items = order.OrderItem.map(item => 
      `${item.Product.title} (x${item.quantity})`
    ).join(', ')
    
    const itemsTotal = order.OrderItem.reduce(
      (sum, item) => sum + (item.priceAtOrder * item.quantity), 0
    )

    return {
      'No. Order': order.orderCode || order.id.substring(0, 8).toUpperCase(),
      'Tanggal': new Date(order.createdAt).toLocaleDateString('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }),
      'Status': getStatusLabel(order.status),
      'Nama Customer': order.Participant.name,
      'No. HP Customer': order.Participant.phone,
      'Produk': items,
      'Total Produk': itemsTotal,
      'Ongkir': order.shippingFee || 0,
      'Jasa': order.serviceFee || 0,
      'DP': order.dpAmount,
      'Total Order': order.totalPrice,
      'Nama Penerima': order.Address?.recipientName || '-',
      'No. HP Penerima': order.Address?.phone || '-',
      'Alamat': order.Address?.addressText || '-',
      'Kecamatan': order.Address?.districtName || '-',
      'Kota': order.Address?.cityName || '-',
      'Provinsi': order.Address?.provinceName || '-',
      'Kode Pos': order.Address?.postalCode || '-',
      'Trip': order.Trip?.title || '-'
    }
  })

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(data)
  
  // Set column widths
  const colWidths = [
    { wch: 15 },  // No. Order
    { wch: 12 },  // Tanggal
    { wch: 14 },  // Status
    { wch: 20 },  // Nama Customer
    { wch: 15 },  // No. HP Customer
    { wch: 40 },  // Produk
    { wch: 12 },  // Total Produk
    { wch: 12 },  // Ongkir
    { wch: 10 },  // Jasa
    { wch: 12 },  // DP
    { wch: 12 },  // Total Order
    { wch: 20 },  // Nama Penerima
    { wch: 15 },  // No. HP Penerima
    { wch: 35 },  // Alamat
    { wch: 15 },  // Kecamatan
    { wch: 15 },  // Kota
    { wch: 15 },  // Provinsi
    { wch: 10 },  // Kode Pos
    { wch: 25 },  // Trip
  ]
  ws['!cols'] = colWidths

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Orders')

  // Generate and download file
  const timestamp = new Date().toISOString().split('T')[0]
  XLSX.writeFile(wb, `${filename}-${timestamp}.xlsx`)
}

/**
 * Convert mm to points (PDF uses points)
 */
function mmToPoints(mm: number): number {
  return mm * 2.83465
}

/**
 * Shipping label dimensions
 * Standard 4x6 inch (101.6mm x 152.4mm) - accepted by most carriers
 */
const LABEL_WIDTH_MM = 101.6
const LABEL_HEIGHT_MM = 152.4

/**
 * Generate PDF with shipping labels for paid orders
 * Creates 4x6 inch labels suitable for courier shipping
 * 
 * @param orders - Array of orders (will filter for 'paid' status only)
 * @param senderInfo - Sender (Jastiper) information
 * @param filename - Name of the exported file (without extension)
 */
export function exportShippingLabels(
  orders: ExportOrder[],
  senderInfo: SenderInfo,
  filename: string = 'shipping-labels'
): { success: boolean; count: number; message: string } {
  // Filter only paid orders with valid addresses
  const paidOrders = orders.filter(
    order => order.status === 'paid' && order.Address
  )

  if (paidOrders.length === 0) {
    return {
      success: false,
      count: 0,
      message: 'Tidak ada order dengan status "Selesai/Paid" yang memiliki alamat pengiriman'
    }
  }

  // Create PDF with 4x6 inch page size
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [LABEL_WIDTH_MM, LABEL_HEIGHT_MM]
  })

  paidOrders.forEach((order, index) => {
    if (index > 0) {
      doc.addPage([LABEL_WIDTH_MM, LABEL_HEIGHT_MM])
    }

    drawShippingLabel(doc, order, senderInfo)
  })

  // Generate and download file
  const timestamp = new Date().toISOString().split('T')[0]
  doc.save(`${filename}-${timestamp}.pdf`)

  return {
    success: true,
    count: paidOrders.length,
    message: `Berhasil membuat ${paidOrders.length} label pengiriman`
  }
}

/**
 * Draw a single shipping label on the PDF
 * Layout: Recipient on top, Sender below, Barcode area, Watermark
 */
function drawShippingLabel(
  doc: jsPDF,
  order: ExportOrder,
  senderInfo: SenderInfo
): void {
  const margin = 5
  const pageWidth = LABEL_WIDTH_MM
  const pageHeight = LABEL_HEIGHT_MM
  const contentWidth = pageWidth - (margin * 2)
  
  let y = margin

  // === HEADER: Order Code & Date ===
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  const orderDate = new Date(order.createdAt).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
  const orderCode = order.orderCode || order.id.substring(0, 8).toUpperCase()
  
  doc.text(`No: ${orderCode}`, margin, y + 3)
  doc.text(orderDate, pageWidth - margin, y + 3, { align: 'right' })
  
  y += 8

  // Separator line
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 3

  // === RECIPIENT SECTION (PENERIMA) - TOP ===
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('PENERIMA:', margin, y + 3)
  y += 5

  // Recipient name (larger, bold)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  const recipientName = order.Address?.recipientName || order.Participant.name
  doc.text(recipientName, margin, y + 4)
  y += 7

  // Recipient phone
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  const recipientPhone = order.Address?.phone || order.Participant.phone
  doc.text(recipientPhone, margin, y + 3)
  y += 6

  // Recipient address - wrap text (larger area)
  doc.setFontSize(9)
  const recipientAddress = order.Address ? [
    order.Address.addressText,
    `Kec. ${order.Address.districtName}`,
    `${order.Address.cityName}, ${order.Address.provinceName}`,
    order.Address.postalCode ? `Kode Pos: ${order.Address.postalCode}` : ''
  ].filter(Boolean).join('\n') : '-'

  const recipientLines = doc.splitTextToSize(recipientAddress, contentWidth)
  doc.text(recipientLines, margin, y + 3)
  y += (recipientLines.length * 4.5) + 5

  // Separator line (double)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 1
  doc.line(margin, y, pageWidth - margin, y)
  y += 5

  // === SENDER SECTION (PENGIRIM) - BELOW RECIPIENT (Name & Phone only) ===
  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('PENGIRIM:', margin, y + 3)
  y += 5

  doc.setFontSize(9)
  doc.setFont('helvetica', 'bold')
  doc.text(senderInfo.name, margin, y + 3)
  y += 5

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(senderInfo.phone, margin, y + 3)
  y += 6

  // === PACKAGE INFO ===
  doc.setLineWidth(0.3)
  doc.line(margin, y, pageWidth - margin, y)
  y += 4

  doc.setFontSize(7)
  doc.setFont('helvetica', 'bold')
  doc.text('ISI PAKET:', margin, y + 2)
  y += 5

  // List items (compact)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  
  const itemsText = order.OrderItem.map(item => 
    `• ${item.Product.title} x${item.quantity}`
  ).join('\n')
  
  const itemLines = doc.splitTextToSize(itemsText, contentWidth)
  // Limit to prevent overflow
  const maxItemLines = Math.min(itemLines.length, 4)
  doc.text(itemLines.slice(0, maxItemLines), margin, y + 2)
  
  if (itemLines.length > maxItemLines) {
    y += (maxItemLines * 3.5) + 2
    doc.text(`... dan ${itemLines.length - maxItemLines} item lainnya`, margin, y + 2)
    y += 4
  } else {
    y += (maxItemLines * 3.5) + 2
  }

  // Calculate total weight if available
  const totalWeight = order.OrderItem.reduce((sum, item) => {
    const weight = item.Product.weightGram || 0
    return sum + (weight * item.quantity)
  }, 0)

  if (totalWeight > 0) {
    y += 2
    doc.setFontSize(8)
    doc.setFont('helvetica', 'bold')
    const weightText = totalWeight >= 1000 
      ? `Berat: ${(totalWeight / 1000).toFixed(1)} kg`
      : `Berat: ${totalWeight} gram`
    doc.text(weightText, margin, y + 2)
  }

  // === BARCODE AREA (placeholder) ===
  // Draw a box for barcode/QR placement
  const barcodeHeight = 15
  const barcodeY = pageHeight - margin - barcodeHeight - 12
  
  doc.setLineWidth(0.2)
  doc.setDrawColor(200, 200, 200)
  doc.rect(margin, barcodeY, contentWidth, barcodeHeight)
  
  doc.setFontSize(6)
  doc.setTextColor(150, 150, 150)
  doc.text('Area Barcode/QR Code Ekspedisi', pageWidth / 2, barcodeY + barcodeHeight / 2 + 2, { align: 'center' })
  doc.setTextColor(0, 0, 0)
  doc.setDrawColor(0, 0, 0)

  // === WATERMARK / FOOTER ===
  doc.setFontSize(6)
  doc.setTextColor(180, 180, 180)
  doc.text('jastipin.me', pageWidth / 2, pageHeight - margin - 2, { align: 'center' })
  doc.setTextColor(0, 0, 0)
}

/**
 * Get human-readable status label
 */
function getStatusLabel(status: string): string {
  const statusMap: Record<string, string> = {
    'pending_dp': 'Belum Bayar',
    'awaiting_validation': 'Perlu Validasi',
    'awaiting_final_payment': 'Sudah Validasi',
    'awaiting_final_validation': 'Cek Pelunasan',
    'paid': 'Selesai',
    'cancelled': 'Dibatalkan',
    'rejected': 'Ditolak'
  }
  return statusMap[status] || status
}
