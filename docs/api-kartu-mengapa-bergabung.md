# Kartu teks Mengapa Bergabung — kontrak frontend

Status: editor dan integrasi frontend dengan pengujian fixture. Resource berikut perlu disediakan tim backend; dokumen ini bukan bukti endpoint/database sudah tersedia. Tidak ada perubahan backend, autentikasi, atau database.

## Cakupan

Menu **Home Page → Mengapa Bergabung → Kartu Teks** mengatur judul dan deskripsi enam kartu Beranda, nomor 01–06, di sekitar kolase pada bagian **Saatnya Bersama Beraksi**.

- Posisi 1–3: kiri foto pada desktop; 4–6: kanan foto. Pada HP mengikuti susunan vertikal yang sudah ada.
- Nomor dan jumlah kartu tetap; bukan fitur tambah/hapus/pindah kartu.
- Foto tetap dikelola lewat menu/resource **Gambar Kolase** yang terpisah. Judul bagian, subjudul, banner, dan **Kartu Tentang** tidak termasuk resource ini.
- Role pengelola: `admin` dan `super_admin`. Backend wajib menegakkan otorisasi; penyembunyian menu frontend bukan pengamanan API.

## API

| Metode | Path | Data |
| --- | --- | --- |
| GET | `/api/homepage/join-cards` | `{ "success": true, "data": Card[] }` untuk admin |
| PUT | `/api/homepage/join-cards` | Upsert atomik seluruh enam kartu, body `{ "cards": Card[] }` |
| GET | `/api/public/homepage/join-cards` | `{ "success": true, "data": Card[] }` untuk publik |

`Card` hanya berisi `position` (integer 1..6), `title` (judul), dan `description` (deskripsi). Contoh satu elemen dari array enam kartu:

```json
{
  "position": 1,
  "title": "Dunia Cepat Berubah",
  "description": "Perubahan teknologi dan pasar terjadi begitu cepat — mereka yang adaptif akan memimpin gelombang berikutnya."
}
```

Array wajib tepat enam elemen dengan posisi unik dan lengkap 1..6. Urutan array respons boleh berbeda; frontend mengurutkan berdasarkan posisi. Tidak ada pagination atau ID di payload. Judul boleh sama antarkartu; identitas mengikuti posisi, bukan judul.

GET dengan `data: null` berarti belum pernah diatur dan bisa diinisialisasi lewat PUT. Array kosong, posisi duplikat/hilang, serta respons tidak valid adalah error kontrak, bukan konfigurasi kosong. HTTP 404 diperlakukan sebagai endpoint tidak tersedia.

PUT berhasil: HTTP 200/201 dengan `success: true`, dianjurkan mengembalikan array tersimpan. Error: status yang sesuai dan `{ "success": false, "message": "Pesan yang dapat dipahami pengguna." }`. PUT harus idempoten dan tidak mengubah foto, banner, atau resource halaman lain.

## Validasi dan tampilan

Sumber field/batas/teks bawaan: `src/data/homepageJoinCards.js`.

- `title`: string wajib, tidak hanya spasi, maksimal 150.
- `description`: string wajib, tidak hanya spasi, maksimal 600; baris baru dipertahankan.
- Batas frontend mengikuti `String.length` / HTML `maxlength` (unit UTF-16).
- Spasi awal/akhir dibuang saat membentuk body PUT. Hanya tiga field yang diizinkan per kartu; role, ID, dan URL gambar tidak dikirim.
- Teks dirender sebagai teks React, bukan HTML. Tidak ada editor rich text, eksekusi markup, atau penyimpanan konten ke localStorage.
- Komponen `HomepageJoinCard` dipakai di publik dan pratinjau editor. Teks bawaan lama tetap sama; teks panjang dibungkus agar tidak meluber.

## Simpan, gagal, dan verifikasi

Editor harus memuat GET valid sebelum Simpan diaktifkan. GET 404/500/respons invalid menampilkan error dan memblokir simpan, tetapi isian tetap dapat dicoba untuk pratinjau lokal.

Setelah PUT diterima, editor GET ulang target yang sama. Keenam posisi, judul, dan deskripsi harus cocok dengan payload sebelum pesan berhasil tampil. Bila PUT gagal, draf tidak dibuang dan dapat dikirim ulang. Bila PUT sudah diterima tetapi verifikasi gagal, tombol **Verifikasi Ulang** hanya melakukan GET, tanpa PUT ulang; isian dikunci sampai hasil terverifikasi.

**Muat Ulang** mengambil ulang konfigurasi server dan membuang seluruh draf teks yang belum tersimpan; label ini tidak dipakai untuk memulihkan draf yang gagal.
Formulir kembali ke teks bawaan saat Muat Ulang dimulai, sehingga kegagalan GET tidak menyisakan draf lama yang bisa disalahartikan sebagai data server.

GET publik null/error/invalid memakai enam teks bawaan agar bagian Beranda tidak kosong. Ini fallback tampilan, bukan klaim penyimpanan berhasil. **Muat Ulang** mengambil ulang konfigurasi server; draf pratinjau yang belum tersimpan bukan data permanen.

Respons 401 dari path `/api/public/...` tidak lagi menghapus sesi atau memindahkan pengunjung ke `#login` (lihat `src/api/axios.js`); halaman publik memakai teks bawaan. 401 pada resource admin tetap mengakhiri sesi.

## Verifikasi frontend

Tes komponen memakai MSW; browser terisolasi memakai intersepsi API. Skenario mencakup keenam judul/deskripsi, urutan, role, validasi, pratinjau, simpan/baca ulang, gagal/retry, dan layout desktop/HP. Tidak ada pembuatan akun atau penulisan ke backend asli. Integrasi database nyata tetap menunggu resource backend tersedia.

Lihat juga `api-gambar-kolase-beranda.md` untuk resource foto.
