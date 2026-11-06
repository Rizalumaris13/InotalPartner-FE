# Kartu layanan Beranda (Layanan Kami / Partnership) — kontrak frontend

Status: editor admin dan integrasi Beranda sudah jalan dengan pengujian fixture. Resource berikut **usulan frontend** untuk tim backend; tidak ada file Go, autentikasi, atau database yang diubah.

## Cakupan

Menu **Home Page → Layanan Kami → Kartu Layanan** mengatur bagian “Layanan Kami / Partnership” di Beranda: label kecil, judul, deskripsi, dua foto bertumpuk, badge di atas foto, dan empat kartu layanan (ikon + judul + deskripsi).

Tidak termasuk: banner hero, slider, bagian “Mengapa Bergabung”, event, berita, dan footer.

Role pengelola: `admin` dan `super_admin`. Backend tetap wajib menegakkan otorisasi sendiri.

## API

| Metode | Path | Hasil |
| --- | --- | --- |
| GET | `/api/homepage/services` | `{ "success": true, "data": Record }` untuk admin |
| PUT | `/api/homepage/services` | Upsert satu dokumen; 200/201 `success: true` |
| GET | `/api/public/homepage/services` | `{ "success": true, "data": Record }` untuk publik |

`data: null` berarti belum pernah diatur (bukan error). Format lain yang tidak sesuai adalah error kontrak.

```json
{
  "eyebrow": "Layanan Kami",
  "title": "Partnership",
  "description": "Empat pilar layanan yang kami rancang ...",
  "badge_value": "7+",
  "badge_label": "Partnership Aktif",
  "photo_primary_url": "/uploads/layanan-utama.jpg",
  "photo_primary_alt": "Tim berdiskusi",
  "photo_secondary_url": "/uploads/layanan-kedua.jpg",
  "photo_secondary_alt": "Jabat tangan kemitraan bisnis",
  "services": [
    { "icon": "monitor-cog", "title": "IT CONSULTANT", "description": "..." },
    { "icon": "layers", "title": "SYSTEM INTEGRATION", "description": "..." },
    { "icon": "settings-2", "title": "RESOURCE MANAGEMENT", "description": "..." },
    { "icon": "code", "title": "SOFTWARE DEVELOPMENT", "description": "..." }
  ]
}
```

Ketentuan:

- `services` tepat 4 elemen, urut sesuai posisi tampil: indeks 0–1 kolom kiri, 2–3 kolom kanan (kanan diberi offset di desktop).
- `icon` hanya nilai yang ada di katalog `src/data/partnershipServiceIcons.js` (12 pilihan).
- Foto: URL http/https tanpa kredensial atau satu basename aman di `/uploads/` (JPG/JPEG/PNG/WEBP), maksimal 2048 karakter; normalisasi skema dilakukan frontend.
- Batas teks: label kecil 60, judul bagian 80, deskripsi bagian 500, angka badge 8, label badge 40, judul kartu 60, deskripsi kartu 300, alt foto 160.
- PUT hanya berisi field di atas (tanpa ID/role/timestamp) dan idempoten.

## Perilaku frontend

- Beranda memakai GET publik; `null`, 404, 500, atau respons invalid menampilkan konten bawaan (`src/data/homepageServices.js`).
- Editor memuat GET admin lebih dulu; 404/500/invalid memblokir Simpan, `null` boleh diinisialisasi lewat PUT.
- Foto baru dipratinjau lokal (blob) dan baru diunggah lewat `POST /api/uploads/image` saat Simpan; hasil upload dinormalkan dan divalidasi sebelum dipakai.
- Setelah PUT diterima, editor GET ulang dan membandingkan seluruh field; pesan berhasil hanya muncul bila cocok. Bila verifikasi gagal, **Verifikasi Ulang** hanya mengirim GET.
- **Muat Ulang** membuang draf dan mengembalikan formulir ke nilai bawaan.
- Pratinjau memakai lebar desktop tetap 1280px lalu diskalakan (`ScaledPreview`), karena breakpoint Tailwind mengikuti viewport, bukan lebar panel.
- 401 pada `/api/public/...` tidak mengakhiri sesi pengunjung (lihat `src/api/axios.js`).
