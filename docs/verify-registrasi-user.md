Bagus — kamu sudah sampai di titik yang penting: **kamu ingin otomatisasi verifikasi & kirim email untuk pendaftar baru** lewat SendPulse. Saya rangkum langkah praktis, urutan implementasi, dan contoh kode siap pakai (curl + Node/Python) supaya kamu bisa langsung integrasi. Saya akan jelaskan juga kapan pakai *email verifier* SendPulse vs. kapan cukup kirim email konfirmasi (transactional).

Singkat:

1. Dapatkan credential API (Client ID & Secret) → ambil access token. ([SendPulse][1])
2. Untuk mengecek validitas alamat: gunakan **Email Verifier API** (opsional, berguna untuk bulk / mencegah fake emails). ([SendPulse][2])
3. Untuk mengirim email verifikasi/konfirmasi pendaftar: gunakan **Transactional Email API** (kirim template / single email). ([SendPulse][3])
4. Tambahkan webhooks untuk tracking delivery/bounce jika perlu. ([SendPulse][4])

Di bawah ini langkah lengkap + contoh.

---

# Langkah 0 — Persiapan di dashboard SendPulse

1. Login → Settings → API (atau Developers) → aktifkan REST API / dapatkan **Client ID** dan **Client Secret**. Catat keduanya dan simpan di environment variables di servermu. ([SendPulse][1])

---

# Langkah 1 — Dapatkan access token (OAuth client_credentials)

Kamu harus request token sebelum memanggil API. Contoh curl:

```bash
curl -X POST "https://api.sendpulse.com/oauth/access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "grant_type":"client_credentials",
    "client_id":"YOUR_CLIENT_ID",
    "client_secret":"YOUR_CLIENT_SECRET"
  }'
```

Response sukses akan berisi `access_token` dan `expires_in`. Gunakan token ini di header Authorization: `Bearer <access_token>` untuk request selanjutnya. Token perlu direfresh saat expired (minta token baru). ([SendPulse][1])

Contoh Node (fetch):

```js
// node >=18 fetch tersedia; or use node-fetch
const res = await fetch('https://api.sendpulse.com/oauth/access_token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'client_credentials',
    client_id: process.env.SENDPULSE_ID,
    client_secret: process.env.SENDPULSE_SECRET,
  }),
});
const data = await res.json(); // { access_token, expires_in, ... }
const token = data.access_token;
```

---

# Langkah 2 — (Opsional tapi dianjurkan) Verifikasi alamat email sebelum kirim

Jika kamu mendapat banyak pendaftar dari sumber tidak terpercaya, gunakan **Email Verifier API** untuk cek apakah email valid / disposable / catch-all / syntax ok. Proses verifikasi mailing list bisa diajukan via API; ada juga single-address verification fitur di dashboard. Untuk bulk ada endpoints untuk submit list → cek progress → ambil hasil. ([SendPulse][2])

Contoh ide flow:

* Saat user register, panggil Email Verifier API untuk alamat itu (atau simpan ke queue untuk batch verification).
* Jika hasil = `valid` → lanjut kirim email konfirmasi.
* Jika `invalid` atau `disposable` → tolak / minta alamat lain.

(Karena verifikasi menggunakan kuota/pack, untuk user realtime sering cukup lakukan simple validation + kirim email konfirmasi dan cek bounce)

---

# Langkah 3 — Kirim email verifikasi (Transactional Email API)

Paling sering kamu ingin mengirim *email konfirmasi pendaftaran* (one-time, transactional). Gunakan REST endpoint SMTP/Transactional. Secara umum kamu akan memanggil API untuk mengirim email memakai template atau raw HTML.

Contoh minimal (curl) memakai template (lihat docs SMTP API untuk detail nama endpoint pada akunmu — format umum: `https://api.sendpulse.com/smtp/emails`):

```bash
curl -X POST "https://api.sendpulse.com/smtp/emails" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": {
      "subject": "Konfirmasi pendaftaran - Jastipin",
      "html": "<p>Halo {{name}}, klik <a href=\"https://your.site/verify?token=...\">verifikasi</a></p>",
      "from": { "name": "Jastipin", "email": "no-reply@jastipin.me" },
      "to": [ { "email": "user@example.com", "name": "Nama User" } ]
    }
  }'
```

Atau gunakan template yang sudah kamu buat di SendPulse dan panggil lewat parameter `template` + `variables`. Dokumentasi lengkap endpoint transactional ada di bagian SMTP/API docs. ([SendPulse][5])

Contoh Node (fetch):

```js
await fetch('https://api.sendpulse.com/smtp/emails', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    email: {
      subject: 'Konfirmasi pendaftaran - Jastipin',
      html: `<p>Halo ${user.name}, klik <a href="https://jastipin.me/verify?token=${tokenVerify}">verifikasi</a></p>`,
      from: { name: 'Jastipin', email: 'no-reply@jastipin.me' },
      to: [{ email: user.email, name: user.name }]
    }
  })
});
```

Catatan praktis:

* Pastikan `from` menggunakan alamat yang sudah kamu verifikasi di SendPulse ([no-reply@jastipin.me](mailto:no-reply@jastipin.me)).
* Untuk verifikasi pendaftar, pakai link yang unik (signed token) dan simpan token di DB untuk validasi saat user klik.
* Simpan response id/message-id untuk debugging.

---

# Langkah 4 — Tangani webhook untuk delivery / bounce / open (opsional tapi penting)

Untuk memastikan valid sign-up flow (mis. detect bounce sehingga tak mengaktifkan account jika email tak bisa dikirim), daftar webhook di SendPulse (Account Settings → API → Webhooks). Endpointmu akan menerima event seperti delivered, bounced, opened, clicked. Gunakan ini untuk menandai alamat invalid dan mengurangi waste. ([SendPulse][4])

---

# Contoh flow pendaftar baru (end-to-end)

1. User register → server validasi basic (email regex, block disposable via quick check).
2. (Opsional) Queue untuk Email Verifier API (fast fail if invalid). ([SendPulse][2])
3. Generate verification token → simpan (user_id, token, expiry).
4. Ambil access_token SendPulse → panggil Transactional Email API kirim email konfirmasi dengan link verifikasi. ([SendPulse][1])
5. User klik link → server cek token → aktifkan akun.
6. Terima webhook bounce/delivery → jika bounce, tandai email invalid. ([SendPulse][4])

---

# Hal-hal teknis & keamanan (jangan lupakan ini)

* Simpan `client_secret` di server (ENV), jangan commit ke repo.
* Cache / reuse access_token sampai expired; jangan minta token setiap request. Token memiliki `expires_in`. ([SendPulse][1])
* Log id response dari SendPulse untuk tracing.
* Jika kirim banyak verifikasi sekaligus, gunakan template & batch send untuk efisiensi. ([SendPulse][3])

---

# Perlu saya bantu tulis kodenya langsung ke projectmu?

Beri tahu:

* bahasa stack yang kamu gunakan (Node/Express, Python/Flask, PHP, dll),
* apakah mau menggunakan SendPulse SDK atau plain HTTP,
* apakah mau saya buatkan handler webhook dan contoh token generation (DB schema sederhana).

Saya bisa kirim contoh file lengkap (route + controller + cron/worker untuk verifikasi batch) yang siap dipaste ke repo. Mana yang kamu mau — Node (Express) atau Python (FastAPI)?

[1]: https://sendpulse.com/integrations/api?utm_source=chatgpt.com "⚙️ API for Bulk Marketing and Other Needs"
[2]: https://sendpulse.com/integrations/api/verifier?utm_source=chatgpt.com "API for Verifying Email Addresses"
[3]: https://sendpulse.com/knowledge-base/smtp/send-email-with-template?utm_source=chatgpt.com "Send transactional emails using a SendPulse Template"
[4]: https://sendpulse.com/knowledge-base/smtp/smtp-webhooks?utm_source=chatgpt.com "Enable webhooks for transactional emails"
[5]: https://sendpulse.com/integrations/api/smtp?utm_source=chatgpt.com "Bulk Email Service API - API Documentation"
