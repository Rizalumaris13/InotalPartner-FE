# Kontrak API Kemitraan

## Batas pekerjaan

Frontend menu Kemitraan dan bagian mitra di beranda sudah disambungkan ke kontrak berikut. Endpoint CRUD kemitraan belum ada di backend Go; dokumen ini adalah kontrak untuk latihan backend, bukan keterangan bahwa endpoint sudah berjalan.

Tidak ada penyimpanan mitra ke localStorage atau respons sukses palsu. localStorage hanya tetap dipakai oleh autentikasi yang sudah ada.

## Tujuan dan akses

- Menu dashboard: Kemitraan, setelah Slider dan sebelum Users.
- Role yang boleh mengelola: admin dan super_admin.
- Bagian publik: “Bergabunglah dengan Ekosistem Kami, Akselerasi Kemitraan Anda!”.
- Pengelolaan ini adalah konten/logo mitra di beranda, bukan CRUD akun perusahaan.
- Gunakan middleware AuthMiddleware dan AdminOrAbove yang sudah ada untuk semua endpoint admin. Menyembunyikan menu di frontend bukan pengganti otorisasi backend.

## Bentuk Partner

Semua key utama pada respons wajib hadir, termasuk logo_url, website_url, dan is_active. URL boleh kosong tetapi tetap string, bukan null atau key yang dihilangkan. Jangan memakai omitempty pada field utama sehingga nilai false atau string kosong hilang. Path logo lokal harus /uploads/ diikuti satu nama file aman, tanpa subfolder, .., backslash, atau encoding traversal.

| Field       | Tipe JSON | Aturan                                                                        |
| ----------- | --------- | ----------------------------------------------------------------------------- |
| id          | number    | Integer positif, dibuat backend, tidak diubah lewat payload                   |
| name        | string    | Wajib, trim spasi tepi, 2–150 karakter                                        |
| logo_url    | string    | Opsional; string kosong, URL http/https, atau path /uploads/ dengan nama file |
| website_url | string    | Opsional; string kosong atau URL http/https absolut yang valid                |
| sort_order  | number    | Integer nol atau lebih, masih dalam rentang integer aman JavaScript           |
| is_active   | boolean   | Wajib eksplisit; hanya true yang boleh tampil di beranda                      |
| created_at  | string    | Timestamp backend, opsional bagi frontend saat ini                            |
| updated_at  | string    | Timestamp backend, opsional bagi frontend saat ini                            |

Tolak javascript:, data:, file:, URL relatif untuk website, status string seperti "false", dan nilai urutan kosong/negatif/pecahan. Ulangi validasi di backend, bukan hanya di form frontend.

Urutan pengambilan data: sort_order ASC, id ASC. Frontend juga mengurutkan defensif dan tidak merotasi mitra secara acak, supaya pengaturan urutan admin dihormati.

## Endpoint

| Method | Path                          | Akses               | Respons sukses                                             |
| ------ | ----------------------------- | ------------------- | ---------------------------------------------------------- |
| GET    | /api/homepage/partners        | admin, super_admin  | 200, data berupa seluruh array Partner                     |
| POST   | /api/homepage/partners        | admin, super_admin  | 201, data berupa Partner yang tersimpan                    |
| PUT    | /api/homepage/partners/:id    | admin, super_admin  | 200, data berupa Partner dengan ID yang sama               |
| DELETE | /api/homepage/partners/:id    | admin, super_admin  | 200, success true, data null; 204 tanpa body juga diterima |
| GET    | /api/public/homepage/partners | publik, tanpa login | 200, data berupa array Partner aktif                       |

GET admin mengembalikan seluruh koleksi, tanpa limit tersembunyi. Pencarian nama/website, filter status, dan pagination 10 baris dilakukan frontend. Jumlah pada tab dihitung dari koleksi; jumlah pada footer mengikuti hasil pencarian/filter.

GET publik harus memfilter is_active = true di database, bukan sekadar mengandalkan frontend. Array kosong yang valid tetap harus dikembalikan sebagai [], bukan null atau contoh data lama.

### Payload tambah/edit

Nama “Mitra Contoh” dan URL example.com berikut hanya contoh kontrak, bukan data resmi.

```json
{
  "name": "Mitra Contoh",
  "logo_url": "/uploads/nama-file.png",
  "website_url": "https://example.com",
  "sort_order": 0,
  "is_active": false
}
```

Form baru default nonaktif. Memilih “Tampilkan di beranda” mengirim is_active true. Toggle status memakai PUT dengan seluruh identitas mitra tetap utuh; hanya is_active berubah. ID berada di path, bukan body.

### Respons satu mitra

```json
{
  "success": true,
  "message": "Mitra berhasil disimpan",
  "data": {
    "id": 1,
    "name": "Mitra Contoh",
    "logo_url": "/uploads/nama-file.png",
    "website_url": "https://example.com",
    "sort_order": 0,
    "is_active": false
  }
}
```

Frontend menolak respons penyimpanan tanpa objek mitra yang valid atau dengan ID berbeda saat edit. Setelah mutasi, daftar diambil ulang dari backend; bukan hanya memasukkan payload ke state lokal.

### Respons daftar

```json
{
  "success": true,
  "data": []
}
```

Jika ada data, data tetap array objek dengan bentuk Partner di atas. Wrapper data.items atau data.data tidak dipakai pada resource ini.

### Error

Gunakan status 400 untuk validasi, 401 untuk sesi tidak valid, 403 untuk role yang tidak berhak, 404 untuk mitra yang tidak ditemukan, dan 500 untuk kegagalan internal. Jangan mengirim success false pada HTTP sukses sebagai pola normal; frontend tetap menolaknya jika terjadi.

```json
{
  "success": false,
  "message": "Nama mitra wajib diisi"
}
```

Pesan yang tampil ke pengguna harus Bahasa Indonesia. Hindari mengirim detail SQL atau stack trace.

## Upload logo — endpoint sudah tersedia

Frontend memakai ulang uploadImageApi dari src/api/posts.js, bukan membuat endpoint upload baru.

- POST /api/uploads/image, multipart/form-data, nama field image.
- Role yang diizinkan endpoint upload saat ini: operator, admin, super_admin.
- Format JPG/PNG/WEBP, maksimal 5 × 1024 × 1024 byte.
- Backend memeriksa tipe dari isi file, bukan sekadar ekstensi.
- Respons 201 yang sudah ada memuat data.url dan url, misalnya /uploads/nama-file.png.
- Frontend menolak respons upload tanpa URL logo yang valid, menyimpan URL pada form, lalu menunggu admin menekan tombol simpan.
- Jika unggah gagal, URL logo sebelumnya tidak dihapus; file yang sama bisa dipilih ulang.
- Mengunggah file belum berarti mitra dipublikasikan atau disimpan.

URL relatif ditampilkan melalui proxy /uploads yang sudah ada. Deployment dapat mengatur VITE_FILE_BASE_URL seperti resource gambar lain; tidak ada hostname backend baru yang di-hardcode.

## Perilaku jika backend belum siap

- Menu dan form tetap dapat dibuka untuk meninjau UI.
- GET admin yang 404 menampilkan nama endpoint yang perlu dibuat.
- Simpan yang gagal mempertahankan isi form dan tidak menampilkan sukses. Pesan JSON backend diprioritaskan, termasuk 404 karena mitra sudah dihapus/tidak ditemukan. Form tidak ditutup otomatis supaya perubahan dapat disalin sebelum membatalkan dan memuat ulang daftar.
- Saat GET publik 404, nama contoh dari beranda lama dipertahankan sebagai pratinjau dengan label jelas. Daftarnya ada di src/data/partners.js dan harus diganti data resmi melalui API.
- Respons publik 200 dengan [] tidak memakai fallback.
- Error selain 404 tidak ditutupi dengan contoh lama; tampil pesan dan tombol coba lagi.
- Logo gagal dimuat ditampilkan sebagai nama mitra, bukan gambar rusak. Tautan berbahaya dari data API tidak dijadikan link.

## Verifikasi frontend

```sh
npm test
npm run build
```

Tes Vitest/React Testing Library memakai MSW sebagai backend uji yang terisolasi. Hasil tes tidak membuktikan endpoint Go sudah tersedia. Untuk uji integrasi backend setelah latihan selesai, gunakan akun uji, bukan mutasi akun/data produksi.

Checklist backend: buat model, repository, service, handler, migrasi, lalu daftarkan endpoint admin/publik di routes/routes.go mengikuti pola homepage banner yang sudah ada. Tidak ada file Go yang diubah oleh pekerjaan frontend ini.
