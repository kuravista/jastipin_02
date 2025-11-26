/**
 * Email Template Service
 * Renders HTML and text email templates
 */

import {
  OrderConfirmationData,
  PaymentLinkData,
  PaymentReceivedData
} from '../../types/email.types.js'

/**
 * Shared compact email styles
 */
const compactStyles = `
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #374151; margin: 0; padding: 0; background: #f3f4f6; }
  .wrap { max-width: 520px; margin: 16px auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
  .head { padding: 20px; text-align: center; color: #fff; }
  .head h1 { margin: 0; font-size: 20px; font-weight: 600; }
  .body { padding: 20px; }
  .hi { font-size: 15px; margin-bottom: 12px; }
  .box { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; margin: 14px 0; }
  .box-title { font-weight: 600; font-size: 14px; margin-bottom: 10px; color: #111827; }
  .row { display: flex; justify-content: space-between; padding: 6px 0; font-size: 13px; border-bottom: 1px solid #e5e7eb; }
  .row:last-child { border-bottom: none; }
  .label { color: #6b7280; }
  .val { color: #111827; font-weight: 500; text-align: right; }
  .amt { font-size: 18px; font-weight: 700; color: #4f46e5; }
  .info { background: #eef2ff; border-left: 3px solid #4f46e5; padding: 12px 14px; border-radius: 6px; margin: 14px 0; font-size: 13px; }
  .info-green { background: #ecfdf5; border-left-color: #10b981; }
  .info-warn { background: #fffbeb; border-left-color: #f59e0b; }
  .info b { display: block; margin-bottom: 6px; color: #1f2937; }
  .info ol { margin: 0; padding-left: 18px; }
  .info li { margin: 4px 0; color: #374151; }
  .cta { text-align: center; margin: 18px 0; }
  .btn { display: inline-block; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600; font-size: 14px; }
  .btn-primary { background: #4f46e5; color: #fff !important; }
  .btn-green { background: #10b981; color: #fff !important; }
  .btn-ghost { background: #f3f4f6; color: #4f46e5 !important; }
  .note { font-size: 12px; color: #6b7280; text-align: center; margin-top: 14px; }
  .foot { background: #f9fafb; padding: 14px; text-align: center; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
  .foot b { color: #6b7280; }
  @media (max-width: 540px) { .wrap { margin: 0; border-radius: 0; } .row { flex-direction: column; } .val { text-align: left; margin-top: 2px; } }
`

export class EmailTemplateService {
  /**
   * Render Order Confirmation Email (HTML)
   */
  static renderOrderConfirmation(data: OrderConfirmationData): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Pesanan</title>
  <style>${compactStyles}</style>
</head>
<body>
  <div class="wrap">
    <div class="head" style="background: linear-gradient(135deg, #4f46e5, #7c3aed);">
      <h1>✅ Pesanan Dikonfirmasi</h1>
    </div>
    <div class="body">
      <p class="hi">Halo <b>${data.customerName}</b>,</p>
      <p style="font-size: 14px; margin-bottom: 14px;">Terima kasih atas pesanan Anda! Jastiper <b>${data.jastiperName}</b> telah menerima permintaan Anda dan akan segera memprosesnya.</p>

      <div class="box">
        <div class="box-title">📦 Detail Pesanan</div>
        <div class="row"><span class="label">ID Pesanan</span><span class="val">${data.orderCode}</span></div>
        <div class="row"><span class="label">Tanggal</span><span class="val">${data.orderDate}</span></div>
        <div class="row"><span class="label">Produk</span><span class="val">${data.productList}</span></div>
        <div class="row"><span class="label">DP Dibayar</span><span class="val amt">${data.dpAmount}</span></div>
        <div class="row"><span class="label">Sisa Pembayaran</span><span class="val">${data.remainingAmount}</span></div>
      </div>

      <div class="info">
        <b>🚀 Langkah Selanjutnya</b>
        <ol>
          <li>Jastiper akan memvalidasi pesanan dalam 1-2 hari</li>
          <li>Anda akan menerima tautan pembayaran untuk sisa tagihan</li>
          <li>Unggah bukti pembayaran melalui tautan yang dikirimkan</li>
          <li>Pantau status pesanan secara real-time</li>
        </ol>
      </div>

      <div class="cta">
        <a href="${data.dashboardUrl}" class="btn btn-primary">Lihat Status Pesanan</a>
      </div>

      <p class="note">Jika ada pertanyaan, silakan hubungi Jastiper Anda secara langsung.</p>
    </div>
    <div class="foot">
      <b>Jastipin</b> — Platform Jastip Terpercaya<br>
      © 2025 Jastipin. Email otomatis, tidak perlu dibalas.
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Order Confirmation Email (Plain Text)
   */
  static renderOrderConfirmationText(data: OrderConfirmationData): string {
    return `
PESANAN DIKONFIRMASI ✅

Halo ${data.customerName},

Terima kasih atas pesanan Anda! Jastiper ${data.jastiperName} telah menerima permintaan Anda dan akan segera memprosesnya.

DETAIL PESANAN
--------------
ID Pesanan: ${data.orderCode}
Tanggal: ${data.orderDate}
Produk: ${data.productList}
DP Dibayar: ${data.dpAmount}
Sisa Pembayaran: ${data.remainingAmount}

LANGKAH SELANJUTNYA
-------------------
1. Jastiper akan memvalidasi pesanan dalam 1-2 hari
2. Anda akan menerima tautan pembayaran untuk sisa tagihan
3. Unggah bukti pembayaran melalui tautan yang dikirimkan
4. Pantau status pesanan secara real-time

Lihat pesanan: ${data.dashboardUrl}

Jika ada pertanyaan, silakan hubungi Jastiper Anda.

---
Jastipin - Platform Jastip Terpercaya
© 2025 Jastipin. Email otomatis, tidak perlu dibalas.
    `.trim()
  }

  /**
   * Render Payment Link Email (HTML) - with Magic Link
   */
  static renderPaymentLinkEmail(data: PaymentLinkData): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembayaran Diperlukan</title>
  <style>${compactStyles}</style>
</head>
<body>
  <div class="wrap">
    <div class="head" style="background: linear-gradient(135deg, #10b981, #059669);">
      <h1>💳 Pembayaran Diperlukan</h1>
    </div>
    <div class="body">
      <p class="hi">Halo <b>${data.customerName}</b>,</p>
      <p style="font-size: 14px; margin-bottom: 14px;">Kabar baik! Pesanan <b>${data.orderCode}</b> telah divalidasi oleh ${data.jastiperName}.</p>

      <div class="box" style="text-align: center; background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none;">
        <div style="font-size: 12px; opacity: 0.9;">Total Tagihan</div>
        <div style="font-size: 28px; font-weight: 700; margin: 6px 0;">${data.remainingAmount}</div>
      </div>

      <div class="info info-warn">
        <b>⏰ Batas Waktu: ${data.deadline}</b>
        Mohon segera lakukan pembayaran sebelum batas waktu untuk menghindari pembatalan.
      </div>

      <div class="info info-green">
        <b>📸 Cara Unggah Bukti Pembayaran</b>
        <ol>
          <li>Transfer <b>${data.remainingAmount}</b> ke rekening Jastiper</li>
          <li>Klik tombol di bawah untuk membuka halaman unggah</li>
          <li>Masukkan 4 digit terakhir nomor WhatsApp untuk verifikasi</li>
          <li>Unggah foto bukti transfer yang jelas</li>
        </ol>
      </div>

      <div class="cta">
        <a href="${data.magicLink}" class="btn btn-green">📤 Unggah Bukti Pembayaran</a>
      </div>

      <p class="note">🔒 Tautan ini berlaku 7 hari dan hanya dapat digunakan satu kali. Jaga kerahasiaannya.</p>
    </div>
    <div class="foot">
      <b>Jastipin</b> — Platform Jastip Terpercaya<br>
      © 2025 Jastipin. Email otomatis, tidak perlu dibalas.
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Payment Link Email (Plain Text)
   */
  static renderPaymentLinkText(data: PaymentLinkData): string {
    return `
PEMBAYARAN DIPERLUKAN 💳

Halo ${data.customerName},

Kabar baik! Pesanan ${data.orderCode} telah divalidasi oleh ${data.jastiperName}.

TOTAL TAGIHAN: ${data.remainingAmount}

⏰ BATAS WAKTU: ${data.deadline}
Mohon segera lakukan pembayaran sebelum batas waktu.

CARA UNGGAH BUKTI PEMBAYARAN
----------------------------
1. Transfer ${data.remainingAmount} ke rekening Jastiper
2. Buka tautan: ${data.magicLink}
3. Masukkan 4 digit terakhir nomor WhatsApp untuk verifikasi
4. Unggah foto bukti transfer yang jelas

🔒 Tautan berlaku 7 hari dan hanya dapat digunakan satu kali.

---
Jastipin - Platform Jastip Terpercaya
© 2025 Jastipin. Email otomatis, tidak perlu dibalas.
    `.trim()
  }

  /**
   * Render Payment Received Email (HTML)
   */
  static renderPaymentReceivedEmail(data: PaymentReceivedData): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Pembayaran Diterima</title>
  <style>${compactStyles}</style>
</head>
<body>
  <div class="wrap">
    <div class="head" style="background: linear-gradient(135deg, #10b981, #059669);">
      <h1>✅ Pembayaran Diterima</h1>
    </div>
    <div class="body">
      <div style="text-align: center; font-size: 48px; margin: 10px 0;">🎉</div>
      <p style="text-align: center; font-size: 16px; font-weight: 600; color: #059669; margin-bottom: 6px;">Terima kasih, ${data.customerName}!</p>
      <p style="text-align: center; font-size: 14px; color: #6b7280; margin-bottom: 16px;">Pembayaran Anda telah berhasil diterima dan diverifikasi.</p>

      <div class="box" style="border: 2px dashed #10b981;">
        <div class="box-title">🧾 Bukti Pembayaran</div>
        <div class="row"><span class="label">ID Pesanan</span><span class="val">${data.orderCode}</span></div>
        <div class="row"><span class="label">No. Kwitansi</span><span class="val">${data.receiptNumber}</span></div>
        <div class="row"><span class="label">Jastiper</span><span class="val">${data.jastiperName}</span></div>
        <div class="row"><span class="label">Jumlah Dibayar</span><span class="val" style="color: #059669; font-weight: 700;">${data.amountPaid}</span></div>
      </div>

      <div class="info info-green">
        <b>🚀 Proses Selanjutnya</b>
        <ol>
          <li>Jastiper akan mulai memproses pesanan Anda</li>
          <li>Anda akan menerima notifikasi perkembangan pesanan</li>
          <li>Lacak pengiriman setelah barang dikirim</li>
          <li>Terima notifikasi saat paket tiba</li>
        </ol>
      </div>

      <p style="text-align: center; color: #059669; font-weight: 600; font-size: 15px; margin-top: 16px;">
        Terima kasih telah menggunakan Jastipin! 🙏
      </p>
    </div>
    <div class="foot">
      <b>Jastipin</b> — Platform Jastip Terpercaya<br>
      © 2025 Jastipin. Email otomatis, tidak perlu dibalas.
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Payment Received Email (Plain Text)
   */
  static renderPaymentReceivedText(data: PaymentReceivedData): string {
    return `
PEMBAYARAN DITERIMA ✅

Terima kasih, ${data.customerName}!

Pembayaran Anda telah berhasil diterima dan diverifikasi.

BUKTI PEMBAYARAN
----------------
ID Pesanan: ${data.orderCode}
No. Kwitansi: ${data.receiptNumber}
Jastiper: ${data.jastiperName}
Jumlah Dibayar: ${data.amountPaid}

PROSES SELANJUTNYA
------------------
1. Jastiper akan mulai memproses pesanan Anda
2. Anda akan menerima notifikasi perkembangan pesanan
3. Lacak pengiriman setelah barang dikirim
4. Terima notifikasi saat paket tiba

Terima kasih telah menggunakan Jastipin! 🙏

---
Jastipin - Platform Jastip Terpercaya
© 2025 Jastipin. Email otomatis, tidak perlu dibalas.
    `.trim()
  }

  /**
   * Render Order Confirmation WITH Magic Link (HTML)
   * Used after checkout - email serves as BACKUP (primary is frontend popup)
   */
  static renderOrderConfirmationWithMagicLink(data: OrderConfirmationData & { magicLink: string }): string {
    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Konfirmasi Pesanan</title>
  <style>${compactStyles}</style>
</head>
<body>
  <div class="wrap">
    <div class="head" style="background: linear-gradient(135deg, #4f46e5, #7c3aed);">
      <h1>✅ Pesanan Dikonfirmasi</h1>
    </div>
    <div class="body">
      <p class="hi">Halo <b>${data.customerName}</b>,</p>
      <p style="font-size: 14px; margin-bottom: 14px;">Terima kasih atas pesanan Anda! Jastiper <b>${data.jastiperName}</b> telah menerima permintaan Anda.</p>

      <div class="box">
        <div class="box-title">📦 Detail Pesanan</div>
        <div class="row"><span class="label">ID Pesanan</span><span class="val">${data.orderCode}</span></div>
        <div class="row"><span class="label">Tanggal</span><span class="val">${data.orderDate}</span></div>
        <div class="row"><span class="label">Produk</span><span class="val">${data.productList}</span></div>
        <div class="row"><span class="label">DP Dibayar</span><span class="val amt">${data.dpAmount}</span></div>
        <div class="row"><span class="label">Sisa Pembayaran</span><span class="val">${data.remainingAmount}</span></div>
      </div>

      <div class="box" style="background: linear-gradient(135deg, #10b981, #059669); color: #fff; border: none; text-align: center;">
        <div style="font-weight: 600; margin-bottom: 8px;">📤 Unggah Bukti Pembayaran DP</div>
        <p style="font-size: 13px; margin: 0 0 12px 0; opacity: 0.95;">Klik tombol di bawah untuk mengunggah bukti transfer DP Anda</p>
        <a href="${data.magicLink}" class="btn" style="background: #fff; color: #059669 !important;">Unggah Bukti Pembayaran</a>
        <p style="font-size: 11px; margin-top: 10px; opacity: 0.85;">Tautan berlaku 7 hari dan aman untuk pesanan Anda.</p>
      </div>

      <div class="info info-warn">
        <b>💡 Catatan</b>
        Email ini dikirim sebagai cadangan. Jika Anda sudah mengunggah bukti pembayaran di website setelah checkout, Anda dapat mengabaikan email ini.
      </div>

      <div class="info">
        <b>🚀 Langkah Selanjutnya</b>
        <ol>
          <li>Unggah bukti pembayaran DP melalui tautan di atas</li>
          <li>Jastiper akan memvalidasi pesanan dalam 1-2 hari</li>
          <li>Anda akan menerima detail jumlah akhir dan pembayaran</li>
          <li>Pantau status pesanan secara real-time</li>
        </ol>
      </div>

      <div class="cta">
        <a href="${data.dashboardUrl}" class="btn btn-ghost">Lihat Status Pesanan</a>
      </div>

      <p class="note">Jika ada pertanyaan, silakan hubungi Jastiper Anda secara langsung.</p>
    </div>
    <div class="foot">
      <b>Jastipin</b> — Platform Jastip Terpercaya<br>
      © 2025 Jastipin. Email otomatis, tidak perlu dibalas.
    </div>
  </div>
</body>
</html>
    `.trim()
  }

  /**
   * Render Order Confirmation WITH Magic Link (Plain Text)
   */
  static renderOrderConfirmationWithMagicLinkText(data: OrderConfirmationData & { magicLink: string }): string {
    return `
PESANAN DIKONFIRMASI ✅

Halo ${data.customerName},

Terima kasih atas pesanan Anda! Jastiper ${data.jastiperName} telah menerima permintaan Anda.

DETAIL PESANAN
--------------
ID Pesanan: ${data.orderCode}
Tanggal: ${data.orderDate}
Produk: ${data.productList}
DP Dibayar: ${data.dpAmount}
Sisa Pembayaran: ${data.remainingAmount}

UNGGAH BUKTI PEMBAYARAN DP
--------------------------
Klik tautan ini untuk mengunggah bukti transfer DP Anda:
${data.magicLink}

Tautan berlaku 7 hari dan aman untuk pesanan Anda.

💡 CATATAN: Email ini dikirim sebagai cadangan. Jika Anda sudah mengunggah bukti pembayaran di website setelah checkout, Anda dapat mengabaikan email ini.

LANGKAH SELANJUTNYA
-------------------
1. Unggah bukti pembayaran DP melalui tautan di atas
2. Jastiper akan memvalidasi pesanan dalam 1-2 hari
3. Anda akan menerima detail jumlah akhir dan pembayaran
4. Pantau status pesanan secara real-time

Lihat pesanan: ${data.dashboardUrl}

Jika ada pertanyaan, silakan hubungi Jastiper Anda.

---
Jastipin - Platform Jastip Terpercaya
© 2025 Jastipin. Email otomatis, tidak perlu dibalas.
    `.trim()
  }
}
