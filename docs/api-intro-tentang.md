# Intro Tentang — kontrak frontend

Status: editor admin + integrasi halaman publik sudah jalan dengan pengujian fixture. Resource berikut **masih usulan frontend** untuk tim backend; tidak ada file Go, autentikasi, atau database yang diubah.

## Cakupan

Menu **About → Intro Tentang → Intro & Misi Visi** mengatur bagian “Kenal Kami Lebih Dekat” di halaman Tentang: label kecil, judul utama + aksen biru, foto, kartu progres, kartu Misi & Visi, dan tombol CTA.

Yang **tidak** termasuk resource ini: banner hero halaman Tentang, kartu “Pilih yang Terbaik”, Tim Kami, video profil, FAQ, statistik, dan footer.

Role pengelola: `admin` dan `super_admin`. Backend tetap wajib menegakkan otorisasi sendiri.

## API

| Metode | Path | Hasil |
| --- | --- | --- |
| GET | `/api/about/intro` | `{ "success": true, "data": Intro }` untuk admin |
| PUT | `/api/about/intro` | Upsert satu dokumen; 200/201 `success: true` |
| GET | `/api/public/about/intro` | `{ "success": true, "data": Intro }` untuk publik |

Data `null` berarti belum pernah diatur (bukan error). Array kosong/format lain adalah error kontrak.

```json
{
  "eyebrow": "Kenal Kami Lebih Dekat",
  "headline": "Menggerakkan kolaborasi yang berdampak untuk",
  "headline_accent": "pertumbuhan bersama.",
  "photo_url": "/uploads/intro-tentang.jpg",
  "photo_alt": "Tim INOTAL Partner dalam sesi diskusi kolaborasi",
  "progress_title": "Progres Kemitraan",
  "progress": [
    { "label": "Kolaborasi berjalan", "percent": 82 },
    { "label": "Kepuasan mitra", "percent": 90 }
  ],
  "mission": {
    "title": "Misi Kami",
    "description": "Memberdayakan mitra melalui solusi kolaborasi yang terukur dan layanan yang sungguh-sungguh.",
    "items": ["Kejelasan arah sejak awal", "Komunikasi tanpa birokrasi", "Program yang dituntaskan"]
  },
  "vision": {
    "title": "Visi Kami",
    "description": "Menjadi ekosistem kemitraan teknologi paling dipercaya di Indonesia.",
    "items": ["Ekosistem mitra terbesar di Indonesia", "Dampak nyata lintas industri", "Pertumbuhan bersama jangka panjang"]
  },
  "cta_label": "Lihat Program Kami",
  "cta_target": "program"
}
```

Ketentuan:

- `progress` tepat 2 baris; `percent` bilangan bulat 0–100.
- `mission.items` dan `vision.items` tepat 3 poin.
- `cta_target` hanya salah satu dari `program`, `event`, `berita`, `artikel`, `partnership`, `kontak`, `tentang`, `landing`.
- `photo_url` berupa URL http/https tanpa kredensial atau satu basename aman di `/uploads/` (JPG/JPEG/PNG/WEBP), maksimal 2048 karakter.
- Batas teks: label kecil 60, judul 160, aksen 80, alt foto 160, judul progres 60, label progres 50, judul kartu 60, deskripsi kartu 300, poin 120, label tombol 60.

PUT hanya boleh berisi field di atas (tanpa ID, role, atau timestamp) dan harus idempoten.

## Perilaku frontend

- Halaman publik memakai GET publik. `null`, 404, 500, atau respons tidak valid menampilkan teks/foto bawaan (`src/data/aboutIntro.js`) supaya bagian tidak kosong.
- URL foto pada respons dinormalkan (`HTTPS://` → `https://`) sebelum dirender, karena `resolveImageUrl` hanya mengenali skema huruf kecil.
- Editor memuat GET admin lebih dulu; 404/500/invalid menampilkan error dan menonaktifkan Simpan. `null` boleh diinisialisasi lewat PUT.
- Foto baru dipratinjau lokal (blob) dan baru diunggah lewat `POST /api/uploads/image` saat Simpan.
- Setelah PUT diterima, editor GET ulang dan membandingkan seluruh field; pesan berhasil hanya muncul bila cocok. Bila verifikasi gagal, **Verifikasi Ulang** hanya mengirim GET.
- **Muat Ulang** membuang seluruh draf dan mengembalikan formulir ke teks bawaan; bila GET gagal, error tampil bersama nilai bawaan dan Simpan tetap nonaktif.
- 401 pada `/api/public/...` tidak mengakhiri sesi pengunjung (lihat `src/api/axios.js`).
- Pratinjau admin dirender pada lebar desktop tetap 1280px lalu diskalakan (`ScaledPreview`), karena breakpoint Tailwind mengikuti lebar viewport, bukan lebar panel. Tanpa ini panel sempit memaksa dua kolom selebar ±100px sehingga teks gepeng; pratinjau juga memakai `preview` agar tata letak desktop dipakai konsisten di layar kecil.
