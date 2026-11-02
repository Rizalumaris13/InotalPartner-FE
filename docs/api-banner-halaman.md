# Banner Halaman — kontrak frontend untuk Rijal

Status: UI/frontend saja. Endpoint di bawah adalah kontrak yang diusulkan untuk backend Rijal, bukan endpoint yang sudah diimplementasikan. Tidak ada perubahan Go, database, atau persistensi localStorage untuk banner.

## Scope yang diminta

Admin/super_admin mengelola banner paling atas pada lima halaman: Tentang, Event, Berita, Artikel, dan Kontak. Menu **Banner Halaman** berada langsung di sidebar, di luar Settings, dengan lima submenu CRUD yang terpisah. Tidak mengubah Slider beranda, inbox Kontak, kartu Tentang, atau konten Post.

Setiap halaman memiliki satu konfigurasi banner independen. Form berisi Label (teks kecil seperti “SIAPA KAMI — SEJAK 2019”), Judul, Deskripsi, dan Unggah Gambar. Pratinjau memakai pola hero navy yang sudah ada: gambar ber-overlay, judul kiri, deskripsi kanan, breadcrumb otomatis dari halaman. Komponen form dibagi pakai untuk menjaga konsistensi; data tetap dipisahkan berdasarkan key halaman.

## Resource

Key halaman persis: `tentang`, `event`, `berita`, `artikel`, `kontak`. Simpan key Indonesia ini apa adanya. Backend perlu constraint unik pada `page`. Tidak ada beberapa banner, urutan, atau status aktif per halaman.

Respons record:

```json
{
  "success": true,
  "data": {
    "page": "tentang",
    "label": "SIAPA KAMI — SEJAK 2019",
    "title": "Tentang Kami",
    "description": "Ekosistem kemitraan teknologi INOTAL.",
    "image_url": "/uploads/banner-tentang.webp"
  }
}
```

`id` atau timestamp tambahan di respons boleh ada, tetapi frontend menggunakan `page` sebagai identitas. Keempat field konten wajib berupa string trim, tidak kosong. Batas karakter Unicode: label 120, title 150, description 600, image_url 2048. Sumber batas dan enum: `src/contracts/pageBanner.schema.json`.

## Endpoint yang perlu disediakan

| Method | Path | Perilaku |
| --- | --- | --- |
| GET | `/api/page-banners/:page` | Admin; satu record atau `{ "success": true, "data": null }` bila belum ada. |
| POST | `/api/page-banners/:page` | Admin; membuat konfigurasi baru; 201 + record. Sudah ada: 409. |
| PUT | `/api/page-banners/:page` | Admin; mengganti keempat field; 200 + record. Belum ada: 404. |
| DELETE | `/api/page-banners/:page` | Admin; menghapus konfigurasi halaman ini saja; 204 atau 200 `{ "success": true, "data": null }`. |
| GET | `/api/public/page-banners/:page` | Publik tanpa login; satu record atau data null, kontrak sama. |
| POST | `/api/uploads/image` | Unggah yang sudah digunakan FE; multipart field `image`; 201 `{ "data": { "url": "/uploads/nama.webp" } }`. |

Body POST/PUT hanya `{ "label", "title", "description", "image_url" }`. `page` hanya di URL. Kirim semua field secara eksplisit; jangan mengandalkan default provider. Key halaman tidak dikenal: 400/404. Admin endpoints harus menegakkan JWT dan role `admin`/`super_admin` di backend; penyembunyian menu bukan otorisasi.

Error JSON: `{ "success": false, "message": "Pesan Bahasa Indonesia." }`. Gunakan 400 untuk validasi, 401 untuk sesi tidak valid, 403 untuk role, 404 untuk record/route, 409 untuk create yang sudah ada, 500 untuk kegagalan internal. Jangan membocorkan SQL/path sistem.

## Gambar

JPG, PNG, atau WEBP; file tidak kosong dan maksimal 5 MiB. Backend tetap perlu memvalidasi isi file, tidak hanya ekstensi/MIME browser, menghasilkan nama aman, dan melayani Content-Type gambar yang benar. URL yang disimpan hanya HTTP(S) tanpa kredensial atau satu basename aman di `/uploads/`; bukan data/blob/SVG, path traversal, protocol-relative, atau protokol aktif. Ukuran sekitar 1600 × 500 disarankan, bukan kewajiban.

File pilihan dipratinjau lokal dan baru diunggah ketika Simpan. Blob preview tidak dikirim sebagai `image_url`, tidak disimpan di localStorage, dan dibersihkan saat form ditutup. Jika upload sudah sukses tetapi penyimpanan banner gagal, URL upload dipertahankan untuk retry tanpa upload ulang. Cleanup gambar yatim menjadi kebijakan backend; DELETE konfigurasi bukan izin menghapus file yang mungkin dipakai resource lain.

## Kondisi frontend

- GET admin valid dengan data null: tampilkan state kosong dan aksi Tambah Banner.
- GET admin 404/jaringan/error/kontrak invalid: tampilkan pesan nyata; form tetap dapat ditinjau, tetapi Simpan nonaktif sampai GET valid. Tidak ada sukses palsu atau fallback data demo admin.
- Mutasi harus menghasilkan record untuk halaman yang tepat dan semua field sesuai payload. Setelah write, GET ulang target yang sama; baru tampilkan sukses bila isi cocok. Setelah DELETE, GET harus data null. Bila verifikasi gagal, tampilkan status belum terverifikasi dan retry GET saja, bukan ulang POST/DELETE; jangan hilangkan isian.
- Tidak ada konten banner yang dipersistenkan ke localStorage. Penyimpanan sesi login lama tidak berubah.
- Header publik menggunakan GET resource halaman masing-masing, bukan resource slider. Ketika konfigurasi tidak ada (data null), endpoint belum tersedia (404), atau kegagalan lain, komponen `PublicPageBanner` memakai teks bawaan halaman. Halaman tidak boleh kehilangan judul/breadcrumb-nya karena backend banner mati. Yang perlu dijaga: kegagalan itu tidak boleh ditampilkan sebagai "banner berhasil dimuat"; dashboard admin tetap menampilkan pesan error yang nyata.

## Verifikasi yang harus dicakup

Uji sidebar/role dan lima target terpisah; read/create/edit/delete; validasi field/unggah; konfirmasi hapus; kegagalan API/kontrak dan read-back; pratinjau; pemisahan state saat pindah submenu; header publik kelima halaman; layout desktop/mobile. Fixture dan server simulasi hanya untuk pengujian, bukan backend produksi.
