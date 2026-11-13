# Panduan Integrasi Portal Notifikasi WhatsApp (WABA Gateway) pada Aplikasi Anak

Dokumen ini menjelaskan langkah-langkah teknis bagi seluruh **Aplikasi Anak** di lingkungan **Lingkar Ide Manajemen (LIM)** untuk:
1. Mengajukan template pesan WhatsApp secara mandiri ke Meta WhatsApp Cloud API.
2. Melihat daftar katalog template yang tersedia beserta status persetujuannya (`APPROVED`, `PENDING`, `REJECTED`).
3. Mengirimkan notifikasi WhatsApp ke pengguna melalui antrean terpusat PostgreSQL pada **Aplikasi Induk**.
4. Memeriksa status pengiriman pesan secara *real-time* (`pending`, `processing`, `sent`, `delivered`, `read`, `failed`).

---

## 1. Persiapan & Konfigurasi Lingkungan (`.env`)

Sebelum melakukan integrasi, minta **Super Administrator** Aplikasi Induk untuk membuatkan **WABA API Key** pada menu:
`Dashboard Admin Induk -> 💬 Notifikasi WhatsApp -> 🔑 Akses Aplikasi Anak -> Generate API Key`.

Tambahkan variabel lingkungan berikut pada berkas `.env` di server **Aplikasi Anak** Anda (jangan pernah diekspos ke sisi *client/browser*):

```env
# Base URL Aplikasi Induk Lingkar Ide Manajemen
LIM_WABA_BASE_URL="https://event.lingkaridemanajemen.id"

# Kunci API WABA khusus Aplikasi Anak (diawali lim_waba_...)
LIM_WABA_API_KEY="lim_waba_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
```

---

## 2. Skema Autentikasi & Batasan Kuota

Setiap permintaan HTTP ke Portal WABA wajib menyertakan header autentikasi di sisi *server-to-server*:

```http
Authorization: Bearer <LIM_WABA_API_KEY>
Content-Type: application/json
```
*(Alternatif header yang juga didukung: `X-API-Key: <LIM_WABA_API_KEY>`)*

### Ketentuan Kuota & Rate Limit
- **Rate Limit Per Menit**: Default `60` pesan/menit per aplikasi anak (dapat disesuaikan Super Admin).
- **Kuota Harian (Rolling 24 Jam)**: Default `1000` pesan/hari per aplikasi anak.
- Jika batas terlampaui, gateway mengembalikan HTTP `429 Too Many Requests`.

---

## 3. Spesifikasi REST API

### A. Mengajukan Template Pesan Baru ke Meta
Meta mewajibkan pesan notifikasi bisnis di luar jendela percakapan 24 jam menggunakan **Message Template** yang telah disetujui (`APPROVED`). Aplikasi anak dapat langsung mengajukan template baru melalui endpoint berikut:

- **Endpoint**: `POST /api/v1/waba/templates`
- **Aturan Penamaan (`name`)**: Gunakan prefix unik aplikasi anak Anda dengan huruf kecil, angka, dan *underscore* saja (contoh: `catering_pesanan_siap`, `merch_resi_pengiriman`).

**Contoh Request Body**:
```json
{
  "name": "catering_pesanan_siap",
  "category": "UTILITY",
  "language": "id",
  "headerFormat": "TEXT",
  "headerContent": "Update Pesanan Katering",
  "bodyText": "Halo {{1}}, pesanan katering Anda dengan nomor {{2}} untuk acara {{3}} telah siap diambil di {{4}}.",
  "footerText": "Lingkar Ide Manajemen - Catering",
  "buttons": [
    {
      "type": "URL",
      "text": "Lihat Detail Pesanan",
      "url": "https://catering.lim.id/orders/{{1}}",
      "example": ["ORD-2026-991"]
    }
  ]
}
```

**Keterangan Field**:
| Field | Tipe | Wajib | Penjelasan |
| :--- | :--- | :---: | :--- |
| `name` | `string` | Ya | Nama teknis unik template (`a-z`, `0-9`, `_`). |
| `category` | `string` | Tidak | `UTILITY` (default), `AUTHENTICATION`, atau `MARKETING`. |
| `language` | `string` | Tidak | Kode bahasa ISO, default `"id"`. |
| `headerFormat` | `string` | Tidak | `NONE`, `TEXT`, `IMAGE`, atau `DOCUMENT`. |
| `headerContent` | `string` | Tidak | Teks judul header apabila `headerFormat` bernilai `"TEXT"`. |
| `bodyText` | `string` | Ya | Isi utama pesan dengan placeholder berurutan `{{1}}`, `{{2}}`, dst. |
| `footerText` | `string` | Tidak | Teks catatan kaki kecil (maks. 60 karakter). |
| `buttons` | `array` | Tidak | Daftar tombol (`URL`, `QUICK_REPLY`, atau `PHONE_NUMBER`). |

**Contoh Response (`201 Created`)**:
```json
{
  "success": true,
  "message": "Template WhatsApp berhasil diajukan ke Meta dan menunggu peninjauan.",
  "data": {
    "id": "b62f8c10-...",
    "name": "catering_pesanan_siap",
    "category": "UTILITY",
    "language": "id",
    "status": "PENDING",
    "metaTemplateId": "114029384756102"
  }
}
```

---

### B. Melihat Daftar Katalog & Status Template
Gunakan endpoint ini untuk memeriksa apakah template yang Anda ajukan sudah berstatus `APPROVED` oleh Meta, serta melihat template global milik Aplikasi Induk yang dapat dipakai bersama.

- **Endpoint**: `GET /api/v1/waba/templates`

**Contoh Response (`200 OK`)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "b62f8c10-...",
      "name": "catering_pesanan_siap",
      "category": "UTILITY",
      "language": "id",
      "headerFormat": "TEXT",
      "bodyText": "Halo {{1}}, pesanan katering Anda...",
      "status": "APPROVED",
      "rejectionReason": null,
      "isGlobal": false,
      "createdAt": "2026-11-08T00:15:00.000Z"
    }
  ]
}
```
> **Catatan Penting**: Hanya kirimkan notifikasi menggunakan template yang sudah berstatus **`APPROVED`**.

---

### C. Mengirim Notifikasi WhatsApp (Antrean PostgreSQL)
Menambahkan pesan ke antrean pengiriman dan memicu worker pengirim ke Meta Cloud API secara asinkron.

- **Endpoint**: `POST /api/v1/waba/send`

**Format Nomor Telepon (`to`)**:
Sistem secara otomatis menormalisasi format `081234567890`, `+62 812-3456-7890`, atau `6281234567890` menjadi standar internasional `6281234567890`.

**Contoh Request Body**:
```json
{
  "to": "081234567890",
  "recipientName": "Siti Aminah",
  "template": "catering_pesanan_siap",
  "language": "id",
  "referenceId": "ORD-2026-991",
  "parameters": {
    "body": [
      "Siti Aminah",
      "ORD-2026-991",
      "Seminar Nasional AI",
      "Booth Konsumsi Lt. 2"
    ],
    "buttons": [
      {
        "index": 0,
        "type": "url",
        "parameter": "ORD-2026-991"
      }
    ]
  }
}
```

*Jika template Anda menggunakan gambar atau dokumen PDF pada bagian Header, tambahkan objek `header` di dalam `parameters`:*
```json
"parameters": {
  "header": {
    "type": "document",
    "mediaUrl": "https://catering.lim.id/invoices/INV-991.pdf",
    "filename": "Invoice-ORD-2026-991.pdf"
  },
  "body": ["Siti Aminah", "ORD-2026-991"]
}
```

**Contoh Response (`202 Accepted`)**:
```json
{
  "success": true,
  "message": "Notifikasi berhasil dijadwalkan ke dalam antrean pengiriman WhatsApp.",
  "data": {
    "id": "9f1d2e3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
    "to": "6281234567890",
    "template": "catering_pesanan_siap",
    "status": "pending",
    "referenceId": "ORD-2026-991",
    "createdAt": "2026-11-08T00:20:10.000Z"
  }
}
```

---

### D. Memeriksa Status Pengiriman Pesan
Anda dapat memeriksa status pengiriman berdasarkan **`id` antrean** maupun **`referenceId`** milik aplikasi anak Anda:

- **Endpoint**: `GET /api/v1/waba/status/{id_atau_referenceId}`

**Contoh Response (`200 OK`)**:
```json
{
  "success": true,
  "data": {
    "id": "9f1d2e3a-4b5c-6d7e-8f9a-0b1c2d3e4f5a",
    "recipientPhone": "6281234567890",
    "templateName": "catering_pesanan_siap",
    "status": "delivered",
    "wamid": "wamid.HBgNNjI4MTIzNDU2Nzg5MBUCABEYEk...",
    "lastError": null,
    "referenceId": "ORD-2026-991",
    "sentAt": "2026-11-08T00:20:11.120Z",
    "deliveredAt": "2026-11-08T00:20:13.450Z",
    "readAt": null,
    "createdAt": "2026-11-08T00:20:10.000Z"
  }
}
```

**Siklus Hidup Status (`status`)**:
1. `pending` — Pesan tersimpan aman di antrean PostgreSQL dan siap diambil worker.
2. `processing` — Worker sedang mengirim pesan ke Meta Graph API.
3. `sent` — Pesan diterima oleh server WhatsApp Meta (Centang 1).
4. `delivered` — Pesan tiba di perangkat WhatsApp penerima (Centang 2 abu-abu).
5. `read` — Pesan telah dibuka/dibaca oleh penerima (Centang 2 biru).
6. `failed` — Pengiriman gagal setelah batas percobaan ulang (lihat detail di `lastError`).

---

## 4. Contoh Implementasi Kode pada Aplikasi Anak

### A. Next.js / Node.js (TypeScript Helper `src/lib/lim-waba.ts`)

```typescript
const WABA_BASE_URL = process.env.LIM_WABA_BASE_URL!;
const WABA_API_KEY = process.env.LIM_WABA_API_KEY!;

export interface SendWabaOptions {
  to: string;
  recipientName?: string;
  template: string;
  language?: string;
  referenceId?: string;
  parameters?: {
    header?: {
      type: "text" | "image" | "document";
      text?: string;
      mediaUrl?: string;
      filename?: string;
    };
    body?: string[];
    buttons?: Array<{
      index: number;
      type: "quick_reply" | "url";
      payload?: string;
      parameter?: string;
    }>;
  };
}

export async function sendWhatsAppNotification(options: SendWabaOptions) {
  const response = await fetch(`${WABA_BASE_URL}/api/v1/waba/send`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WABA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(options),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || `WABA Error (${response.status})`);
  }

  return result.data;
}

export async function submitWhatsAppTemplate(payload: {
  name: string;
  category?: "UTILITY" | "AUTHENTICATION" | "MARKETING";
  language?: string;
  headerFormat?: "NONE" | "TEXT" | "IMAGE" | "DOCUMENT";
  headerContent?: string;
  bodyText: string;
  footerText?: string;
  buttons?: Array<{ type: string; text: string; url?: string; example?: string[] }>;
}) {
  const response = await fetch(`${WABA_BASE_URL}/api/v1/waba/templates`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${WABA_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || `Gagal mengajukan template (${response.status})`);
  }

  return result.data;
}

export async function getWhatsAppDeliveryStatus(idOrReference: string) {
  const response = await fetch(
    `${WABA_BASE_URL}/api/v1/waba/status/${encodeURIComponent(idOrReference)}`,
    {
      headers: {
        Authorization: `Bearer ${WABA_API_KEY}`,
      },
      cache: "no-store",
    }
  );

  const result = await response.json();
  if (!response.ok || !result.success) {
    throw new Error(result.message || "Gagal memeriksa status notifikasi.");
  }

  return result.data;
}
```

### B. PHP / Laravel (`Http` Client)

```php
<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class LimWabaService
{
    public function sendNotification(string $phone, string $template, array $bodyParams = [], ?string $refId = null): array
    {
        $response = Http::withToken(config('services.lim_waba.key'))
            ->post(rtrim(config('services.lim_waba.url'), '/') . '/api/v1/waba/send', [
                'to'          => $phone,
                'template'    => $template,
                'language'    => 'id',
                'referenceId' => $refId,
                'parameters'  => [
                    'body' => $bodyParams,
                ],
            ]);

        if ($response->failed()) {
            throw new \RuntimeException($response->json('message') ?? 'Gagal mengirim WABA');
        }

        return $response->json('data');
    }
}
```

### C. Pengujian Cepat via `cURL`

```bash
curl -X POST "$LIM_WABA_BASE_URL/api/v1/waba/send" \
  -H "Authorization: Bearer $LIM_WABA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "081234567890",
    "recipientName": "Tester LIM",
    "template": "hello_world",
    "language": "en_US",
    "referenceId": "TEST-001"
  }'
```

---

## 5. Daftar Kode Status HTTP & Penanganan Error

| Kode HTTP | Makna | Solusi |
| :---: | :--- | :--- |
| `200` / `201` / `202` | Permintaan berhasil diproses / dijadwalkan. | Simpan `data.id` atau `referenceId` untuk pelacakan. |
| `400` | Validasi input gagal / ditolak oleh Meta Graph API. | Periksa format nomor tujuan, kelengkapan parameter, atau aturan variabel template Meta. |
| `401` | Kunci API tidak disertakan atau tidak cocok. | Periksa header `Authorization: Bearer <API_KEY>`. |
| `403` | Akses WABA aplikasi anak sedang dinonaktifkan. | Hubungi Super Admin Lingkar Ide Manajemen. |
| `409` | Nama template sudah dipakai aplikasi lain. | Tambahkan prefix unik aplikasi anak pada `name` template. |
| `429` | Melebihi batas *rate limit* per menit atau kuota harian. | Terapkan jeda pengiriman (*throttling*) atau ajukan kenaikan kuota di Portal Induk. |

