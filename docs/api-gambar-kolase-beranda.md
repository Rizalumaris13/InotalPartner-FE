# Gambar kolase Beranda — kontrak frontend

Status: frontend dan pengujian dengan fixture. Dokumen ini mengusulkan resource untuk tim backend; bukan klaim endpoint atau penyimpanan database sudah tersedia. Tidak ada perubahan Go, database, atau konfigurasi backend.

## Target yang tepat

Hanya tiga foto bertumpuk di tengah bagian **Mengapa Bergabung / Saatnya Bersama Beraksi** pada Beranda. Bukan hero/banner halaman dan bukan Slider. Label, judul, deskripsi, enam kartu, urutan kartu, ukuran, rotasi, dan lapisan foto tetap seperti sebelumnya.

Editor: **Home Page → Mengapa Bergabung → Gambar Kolase**. Hanya admin dan super_admin. Tiga posisi tetap:

| Field | Posisi |
| --- | --- |
| `top_left_url` | Kiri atas, di belakang foto utama |
| `center_url` | Tengah, foto utama di depan |
| `bottom_right_url` | Kanan bawah, di belakang foto utama |

Sumber posisi dan gambar bawaan: `src/data/homepageJoinImages.js`. Halaman publik dan pratinjau admin memakai renderer yang sama di `src/components/HomepageJoinImages.jsx`.

## Resource khusus

| Metode | Path | Respons |
| --- | --- | --- |
| GET | `/api/homepage/join-images` | Admin: `{ "success": true, "data": record }`, atau data null jika belum diatur |
| PUT | `/api/homepage/join-images` | Admin: upsert satu konfigurasi; HTTP 200/201 dengan `success: true`; dianjurkan mengembalikan record |
| GET | `/api/public/homepage/join-images` | Publik: kontrak record yang sama, atau data null |
| POST | `/api/uploads/image` | Helper upload yang sudah dipakai frontend; multipart field `image`, respons `{ "data": { "url": "/uploads/foto.png" } }` |

Record dan body PUT hanya berisi URL untuk tiga posisi:

```json
{
  "top_left_url": "/uploads/diskusi.png",
  "center_url": "/uploads/kolaborasi.webp",
  "bottom_right_url": "/uploads/kemitraan.jpg"
}
```

Tidak mengirim judul, kartu, role, page, ID, atau pengaturan banner. PUT harus menyimpan ketiga URL sebagai satu konfigurasi secara atomik. Penggantian foto tidak mengizinkan penghapusan file lama yang mungkin masih digunakan resource lain.

Backend tetap wajib menegakkan autentikasi dan role admin/super_admin; menyembunyikan menu bukan otorisasi. Error JSON: `{ "success": false, "message": "Pesan yang dapat dipahami pengguna." }`. Bedakan data null dari route tidak tersedia (404).

## Validasi dan upload

- Ketiga URL wajib valid, maksimal 2048 karakter. URL HTTP(S) tanpa kredensial atau satu basename aman di `/uploads/` dengan ekstensi JPG/JPEG/PNG/WEBP.
- Tolak protokol aktif, protocol-relative URL, spasi/kontrol mentah, backslash, traversal lokal, serta URL blob/data pada payload.
- File JPG/PNG/WEBP, tidak kosong, maksimal 5 MiB per foto. Backend perlu memeriksa isi file, bukan hanya MIME yang dikirim browser.
- File yang dipilih dipratinjau lokal dahulu. Upload baru dilakukan ketika Simpan Gambar ditekan.
- URL blob hanya untuk pratinjau, dibersihkan saat diganti, dibatalkan, berhasil diunggah, atau halaman ditutup. Tidak ada persistensi foto ke localStorage.
- Upload yang sudah berhasil dipertahankan sebagai URL jika upload berikutnya atau PUT gagal, sehingga retry tidak mengunggah file yang sama lagi.
- Skema absolut pada URL dinormalisasi ke huruf kecil (`HTTPS://` → `https://`) saat membentuk payload dan pratinjau, karena helper `resolveImageUrl` hanya mengenali skema huruf kecil. Tanpa ini URL valid tampil sebagai path relatif rusak.
- Normalisasi yang sama berlaku pada URL hasil unggahan dan pada respons GET (admin maupun publik), supaya nilai yang disimpan, diverifikasi, dan dirender selalu identik.

## Perilaku frontend

- GET admin dengan data null mengisi foto bawaan sebagai titik awal, dengan penanda belum diatur. PUT dapat menginisialisasi konfigurasi.
- GET admin 404/500/jaringan/format tidak valid menampilkan error nyata dan menonaktifkan Simpan. Pratinjau URL/file lokal tetap bisa dicoba tanpa membuat penyimpanan palsu.
- Setelah PUT diterima, GET ulang resource yang sama dan cocokkan ketiga URL. Pesan berhasil hanya muncul setelah nilai cocok.
- Jika verifikasi gagal, draft tetap ada dan tombol Verifikasi Ulang hanya mengirim GET, bukan upload atau PUT ulang.
- **Muat Ulang** adalah permintaan data server: seluruh draf lokal (URL ketikan maupun pilihan file yang belum diunggah) dibuang bersama, supaya URL hasil unggahan lama tidak bercampur dengan file yang masih menunggu. Ini juga berlaku saat pemulihan dari GET yang gagal.
- Saat Muat Ulang dimulai, formulir kembali ke gambar bawaan; jika GET gagal, banner error tampil bersama nilai bawaan tersebut dan Simpan tetap nonaktif — tidak ada draf lama yang tersisa diam-diam.
- GET publik null/404/error menggunakan tiga foto bawaan agar layout Beranda tidak kosong. Ini fallback tampilan, bukan bukti penyimpanan berhasil.
- 401 pada path `/api/public/...` juga jatuh ke foto bawaan tanpa mengakhiri sesi pengunjung; hanya 401 resource admin yang memicu logout.

## Pengujian

Vitest + React Testing Library + MSW mencakup menu, tiga posisi gambar, hak akses, validasi respons/URL/file, upload, pembacaan ulang, kegagalan dan retry. Browser QA memakai context terisolasi dengan seluruh request API diintersep fixture; tidak membuat akun atau menulis ke backend/database asli. Verifikasi live tetap menunggu resource backend tersedia.
