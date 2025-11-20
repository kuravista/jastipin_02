Di bawah ini versi **dokumen ringkas, utuh, dan terstruktur**—formatnya memang sengaja dibuat **singkat, modular, dan mudah diproses AI agent**, agar bisa digunakan sebagai pedoman implementasi seluruh sistem: **kategori produk, struktur data, checkout, DP flow, validasi, ongkir, fee jastiper, dan notifikasi**.
Bahasanya padat, jelas, dan sistematis.

---

# 📄 **DOCUMENT: JASTIPIN — PRODUCT TYPES & DP CHECKOUT FLOW (AI-FRIENDLY SPEC)**

Dokumen ini mendefinisikan bagaimana sistem Jastipin menangani **kategori produk (goods/tasks)**, alur **checkout**, penggunaan **DP (down payment)**, **validasi jastiper**, **harga final**, dan **flow notifikasi**.
Dokumen ini dipakai untuk backend, frontend, worker, dan AI reasoning.

---

# 1. **PRODUCT CATEGORIES**

## **1.1 Kategori Produk**

Setiap produk memiliki tipe:

* `"goods"` → barang fisik yang bisa dikirim.
* `"tasks"` → jasa/tugas (ambil antrean, titip beli tiket, preorder makanan, dll).

## **1.2 Perbedaan Atribut**

### GOODS

* Butuh alamat pengiriman.
* Punya `stock`, `unit`, `weight_gram` (opsional).
* Butuh ongkir.

### TASKS

* Tidak butuh alamat (kecuali tugas terkait lokasi).
* Opsional `requires_details`: butuh data tambahan dari penitip.
* Tidak perlu ongkir.

---

# 2. **DATABASE STRUCTURE (SUMMARY)**

## 2.1 Products Table

```
type: 'goods' | 'tasks'
unit: nullable
stock: nullable
weight_gram: nullable
requires_details: boolean
requires_proof: boolean
markup_type: 'percent' | 'flat'
markup_value: integer
```

## 2.2 Orders Table

```
status:
  'pending_dp' → 'dp_paid' → 'awaiting_validation'
  → 'validated' → 'awaiting_final_payment'
  → 'confirmed' → 'shipped' → 'done' | 'cancelled'

dp_amount
dp_paid_at
final_breakdown (JSON)
address_id (nullable)
shipping_fee
service_fee
platform_commission
```

## 2.3 Order Items

```
product_type: 'goods' | 'tasks'
price_at_order
item_subtotal
qty
note (optional)
```

## 2.4 Addresses

```
participant_id
recipient_name
address_text
city
postal_code
```

## 2.5 Fees Config

(global admin rules)

```
scope: 'shipping'|'task_fee'|'platform_commission'|'max_markup_percent'
calculation_type: 'flat'|'percent'|'per_task'|'per_kg'
value: integer
meta: JSON
```

---

# 3. **CHECKOUT FLOW (DP FIRST MODEL)**

## Overview

Sistem menggunakan **DP Flow** untuk menyederhanakan input pengguna dan memberikan fleksibilitas kepada jastiper untuk menilai ongkir, stok, dan total akhir.

### Langkah Utama

1. Penitip isi form checkout minimal → bayar DP.
2. Jastiper validasi → menentukan harga final (subtotal, ongkir, markup, fee).
3. Penitip bayar sisa → order selesai.

---

# 4. **CHECKOUT — STEP BY STEP**

## **4.1 Step 1 — Penitip Checkout (Minimal Input)**

Input dari penitip:

```
name
phone
qty per product
addressId (only required if ANY product.type == 'goods')
note (optional)
```

Tidak perlu:

* berat barang
* ongkir
* fee jastiper
* fee platform
* detail teknis lainnya

Output server:

```
orderId
dp_amount
payment_link (VA/QR)
status: 'pending_dp'
```

---

## **4.2 Step 2 — DP Payment Received**

Payment gateway -> webhook:

```
status = 'dp_paid'
```

Sistem:

* Lock stok (jika goods).
* Kirim notifikasi WA ke jastiper.
* Status menjadi `awaiting_validation`.

---

## **4.3 Step 3 — Jastiper Validation (Harga Final)**

Jastiper melihat order & menentukan:

```
shipping_fee   (jika goods)
jastiper_markup (flat/percent)
platform_commission (auto)
service_fee (optional)
total_final
```

Jastiper mengirim:

```
action: accept | reject
final_breakdown (JSON)
```

Jika **accept**:

* Status → `awaiting_final_payment`
* Penitip menerima invoice final via WA.

Jika **reject**:

* Status → `cancelled`
* DP direfund otomatis.

---

## **4.4 Step 4 — Penitip Bayar Sisa**

Penitip melihat breakdown:

```
Harga barang (subtotal)
Ongkir
Biaya jastiper
Biaya platform
Total
DP yang sudah dibayar
Sisa tagihan
```

Setelah bayar:

* Status → `confirmed`

---

## **4.5 Step 5 — Finalization**

Jastiper proses pembelian / pengambilan / pengiriman.
Sistem meng-update status:

* `shipped`
* `done`

Invoice akhir dikirim.

---

# 5. **PRICE CALCULATION ENGINE (SERVER SIDE)**

Selalu 100% dihitung oleh server, bukan client.

### Rumus:

```
subtotal = sum(price_at_order * qty)

shipping_fee = 
  if(contains goods) ? jastiper_input OR auto_rule : 0

task_fee =
  sum(product.price * qty) if type=tasks OR custom_fee_rule

jastiper_markup = 
  if markup_type='percent': subtotal * value/100
  if markup_type='flat': value

platform_commission =
  (subtotal + markup) * commission_percent/100

total_final =
  subtotal + shipping_fee + jastiper_markup + task_fee + service_fee
```

Saat jastiper “accept”, semua angka dikunci di `final_breakdown`.

---

# 6. **FORM INPUT SIMPLIFICATION (USER-FRIENDLY)**

Penitip hanya melihat input:

```
Nama
Nomor WA
Alamat (jika diperlukan)
Qty
Catatan (optional)
Button: BAYAR DP
```

Tidak ada:

* berat barang
* ongkir
* fee jastiper
* fee platform
* detail teknis

Semua diputuskan setelah DP oleh jastiper.

---

# 7. **NOTIFICATION FLOW (WhatsApp)**

## Setelah DP

Ke penitip:

```
Jastipin: DP diterima untuk order {orderId}. 
Jastiper akan konfirmasi harga dalam 24 jam.
```

Ke jastiper:

```
Jastipin: Order {orderId} sudah bayar DP. 
Mohon verifikasi harga final.
```

## Setelah jastiper accept

```
Order {orderId} dikonfirmasi.
Rincian final: {breakdown}.
Silakan bayar sisa Rp{remaining}.
```

## Setelah jastiper reject

```
Order {orderId} ditolak. DP akan dikembalikan.
```

---

# 8. **AUTO SAFETY RULES**

* `response_timeout` jastiper: 24 jam → auto-refund DP.
* stock lock: 30 menit setelah order dibuat, extend after DP.
* max markup: platform enforce (%).
* logs: semua state change disimpan ke `order_logs`.
* prevent double-payment: idempotency key per order.

---

# 9. **WORKER / BACKEND TASKS**

* Webhook listener (DP & final payment)
* Notification dispatcher (WA sender)
* Auto-refund worker
* Expired DP worker (cancel not-paid DP orders)
* Stock lock worker (TTL)
* PDF invoice generator

---

# 10. **EDGE CASES (ringkas)**

* Partial accept (barang habis sebagian): support di future.
* Jika ada goods + tasks → address tetap required.
* Jika tasks butuh bukti (foto antrean), jastiper upload via dashboard.
* Refund rules mengikuti status order.

---

# 11. **FINAL STRUCTURAL SUMMARY (untuk AI agent)**

## Sistem harus:

1. Mendukung dua kategori produk: `goods` dan `tasks`.
2. Mengganti checkout penuh menjadi **checkout DP minimal**.
3. Memindahkan perhitungan ongkir, fee, dan markup ke **jastiper validation step**.
4. Menyimpan final breakdown harga di server (`final_breakdown`).
5. Menjalankan payment flow: DP → Validasi → Final Payment → Done.
6. Menggunakan notifikasi WhatsApp sebagai channel utama.
7. Menyederhanakan UX penitip seminimal mungkin.
8. Menggunakan state machine order yang jelas.
9. Menyediakan worker otomatis untuk refund/timeouts.
10. Selalu melakukan perhitungan harga di backend sebagai **source of truth**.

---

