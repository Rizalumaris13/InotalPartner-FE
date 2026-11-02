# Kontrak API Kartu Tentang

## Batas dan sumber kontrak

Frontend + kontrak. Backend Go sudah diimplementasikan di `InotalPartner-BE` (branch `akuh`): model `about_cards`, repository transaksional, service validasi, handler, route admin/publik, dan AutoMigrate. Dokumen ini tetap menjadi acuan semantik yang dipakai kedua sisi.

Bentuk data utama: `src/contracts/aboutCard.schema.json`. Frontend membaca field, batas panjang dan enum dari schema ini. Dokumen ini menjelaskan semantik koleksi dan URL. Tidak ada penyimpanan konten ke localStorage; localStorage hanya tetap untuk sesi autentikasi.

## Area dan akses

- Publik: hanya kartu “Pilih yang Terbaik / Memberdayakan Bisnis dengan Keahlian” di halaman Tentang. Jumlah mengikuti data, bukan dibatasi tiga.
- Judul seksi, profil, tim, statistik, FAQ dan halaman lain tidak dikelola resource ini.
- Dashboard: “Kartu Tentang”, sesudah Kemitraan dan sebelum Users.
- Pengelola: admin/super_admin. Semua endpoint admin wajib AuthMiddleware + AdminOrAbove; menu tersembunyi bukan pengganti otorisasi server.
- Ikon dari katalog lokal dengan pratinjau, tanpa upload/HTML/SVG mentah.

## Data

Respons record wajib memuat `id`, `title`, `description`, `icon`, `url`, `sort_order`. Timestamp/field tambahan boleh untuk kompatibilitas maju. Payload tambah/edit tidak mengandung ID, timestamp atau key tambahan.

- id: integer positif aman JavaScript, dibuat backend.
- title: teks biasa, trim tepi, 2–150 karakter Unicode.
- description: teks biasa, trim tepi, 10–2000 karakter Unicode; bukan HTML.
- icon: key enum schema, dipetakan frontend ke lucide-react yang sudah terpasang.
- url: wajib, trim tepi, maksimal 2048 karakter; aturan berikut.
- sort_order: posisi berbasis satu, integer dalam rentang koleksi; bukan bobot bebas.

Jangan memakai omitempty untuk field utama. Koleksi kosong harus `[]`, bukan null.

Katalog key — label:

lightbulb — Lampu; award — Penghargaan; headset — Pendampingan;
handshake — Kemitraan; target — Target; rocket — Inovasi;
shield-check — Keamanan; users — Tim; trending-up — Pertumbuhan;
code — Teknologi; briefcase — Bisnis; globe — Jaringan.

## URL tujuan

Diterima:

- URL absolut http:// atau https:// dengan hostname, tanpa username/password atau whitespace/kontrol di dalam URL.
- Route publik `#landing`, `#tentang`, `#program`, `#event`, `#berita`, `#artikel`, `#partnership`, `#kontak`; bentuk `/#program` juga diterima.
- Detail berita `#berita/<slug>` atau `/#berita/<slug>`; slug satu segmen huruf, angka, underscore atau tanda minus.

Tolak javascript:, data:, file:, tel:, mailto:, //host, #dashboard/#login, path relatif sembarang, URL berkredensial dan whitespace/kontrol. Route lokal memakai navigasi SPA/tab sama. URL absolut dibuka di tab baru dengan rel="noopener noreferrer".

## Posisi dan angka kartu

GET mengirim seluruh koleksi. Posisi unik dan kontigu 1..N. Frontend mengurutkan defensif sesuai sort_order; nomor 01, 02, ... mengikuti posisi, bukan ID/input terpisah.

Transaksi backend:

- POST posisi p dalam 1..N+1: sisipkan pada p; geser posisi p dan sesudahnya.
- PUT posisi p dalam 1..N: pindahkan ke p; geser kartu dalam interval posisi lama/baru.
- DELETE: hapus target lalu rapatkan posisi.
- Field dan seluruh pergeseran dalam satu transaksi; serialisasikan perubahan bersamaan agar tidak ada posisi duplikat.
- Posisi di luar rentang atau konflik koleksi: 409 + pesan Indonesia; jangan diam-diam meng-clamp.
- GET tidak menyembunyikan limit/pagination server. Pencarian/pagination dashboard dilakukan klien.

## Endpoint

| Method | Path                    | Respons                                            |
| ------ | ----------------------- | -------------------------------------------------- |
| GET    | /api/about/cards        | 200 `{success:true,data:AboutCard[]}`              |
| POST   | /api/about/cards        | 201 `{success:true,data:AboutCard}`                |
| PUT    | /api/about/cards/:id    | 200 `{success:true,data:AboutCard}` dengan ID sama |
| DELETE | /api/about/cards/:id    | 200 `{success:true,data:null}` atau 204 tanpa body |
| GET    | /api/public/about/cards | 200 `{success:true,data:AboutCard[]}` tanpa login  |

Semua selain GET publik memerlukan JWT admin/super_admin. ID di path, bukan body. POST dapat mengirim Location: /api/about/cards/<id>.

Contoh kontrak, bukan data resmi:

```json
{
  "title": "Solusi Terukur",
  "description": "Kolaborasi dimulai dari pemetaan kebutuhan mitra.",
  "icon": "lightbulb",
  "url": "#program",
  "sort_order": 1
}
```

Respons simpan harus mencerminkan payload dengan ID valid. Frontend menolak success:false, record tidak valid, ID edit berbeda atau perubahan tidak tercermin. Setelah mutasi, GET ulang dan verifikasi target sebelum sukses. Bila readback gagal setelah write diterima, retry hanya GET, bukan ulang POST/DELETE; input dipertahankan dan status verifikasi dijelaskan.

## Error dan backend belum siap

Status: 400 validasi, 401 sesi, 403 role, 404 record/route, 409 konflik posisi, 500 internal. Body `{success:false,message:"Pesan Indonesia"}`; opsional `errors` per field. Jangan bocorkan SQL/stack trace.

- GET admin gagal: tampil error dan endpoint. Form tambah tetap bisa ditinjau, tanpa sukses palsu.
- Simpan gagal: input tidak hilang/form tidak ditutup otomatis.
- GET publik 404: kartu lama sebagai pratinjau berlabel; URL #program/#partnership/#kontak hanya contoh yang harus diganti admin.
- GET publik 200 []: kosong, tanpa fallback.
- Error jaringan/502/500/data invalid: error + coba lagi, bukan data contoh.

## Verifikasi

Frontend: npm test, npm run build, ESLint file perubahan; tes CRUD, payload, readback, posisi, ikon, URL, role, kosong/error dan pratinjau.

Integrasi Go: server dijalankan pada PostgreSQL sementara, lalu 37 pemeriksaan API lolos (401 tanpa token, 403 operator, validasi, insert/pindah/hapus dengan posisi kontigu, 409 rentang, enam POST paralel pada posisi 1, konsistensi database) dan CRUD dashboard diuji lewat browser pada backend yang sama. Database sementara dihapus setelah pengujian.
