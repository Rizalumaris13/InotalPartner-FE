import { expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import PageBannerPage from '../src/pages/PageBannerPage'
import { DEFAULT_PAGE_BANNERS } from '../src/data/pageBanners'
import { server } from './setup'

const saved = {
  page: 'tentang',
  label: 'SIAPA KAMI — SEJAK 2019',
  title: 'Tentang Kami',
  description: 'Ekosistem kemitraan teknologi INOTAL.',
  image_url: '/uploads/banner-tentang.webp',
}

const json = (record) => HttpResponse.json({ success: true, data: record })

function openAdmin(pageKey = 'tentang', role = 'admin') {
  render(<PageBannerPage pageKey={pageKey} role={role} />)
  return userEvent.setup()
}

test('admin melihat form terisi dan pratinjau banner tersimpan', async () => {
  server.use(http.get('*/api/page-banners/tentang', () => json(saved)))
  openAdmin()
  const form = await screen.findByRole('form', { name: 'Banner Tentang' })
  expect(within(form).getByLabelText('Label').value).toBe(saved.label)
  expect(within(form).getByLabelText('Judul').value).toBe(saved.title)
  expect(within(form).getByLabelText('Deskripsi').value).toBe(saved.description)
  const preview = within(form).getByRole('region', { name: 'Pratinjau banner' })
  expect(within(preview).getByRole('heading', { name: 'Tentang Kami' })).not.toBeNull()
  expect(preview.textContent).toContain('SIAPA KAMI — SEJAK 2019')
})

test('konfigurasi kosong menawarkan teks bawaan halaman tanpa mengklaim tersimpan', async () => {
  server.use(http.get('*/api/page-banners/event', () => json(null)))
  const user = openAdmin('event')
  const form = await screen.findByRole('form', { name: 'Banner Event' })
  expect(screen.getByText(/belum diatur/i)).not.toBeNull()
  await user.click(within(form).getByRole('button', { name: 'Isi Teks Bawaan' }))
  expect(within(form).getByLabelText('Label').value).toBe('Agenda Ecosystem')
  expect(within(form).getByLabelText('Judul').value).toBe('Event')
  expect(within(form).getByLabelText('Deskripsi').value).toContain('Workshop, webinar, dan meetup')
})

test('simpan banner baru mengirim empat field lalu membaca ulang target', async () => {
  let payload
  let reads = 0
  server.use(
    http.get('*/api/page-banners/tentang', () => {
      reads += 1
      return json(reads === 1 ? null : saved)
    }),
    http.post('*/api/page-banners/tentang', async ({ request }) => {
      payload = await request.json()
      return json(saved, { status: 201 })
    }),
  )
  const user = openAdmin()
  const form = await screen.findByRole('form', { name: 'Banner Tentang' })
  await user.type(within(form).getByLabelText('Label'), saved.label)
  await user.type(within(form).getByLabelText('Judul'), saved.title)
  await user.type(within(form).getByLabelText('Deskripsi'), saved.description)
  await user.type(within(form).getByLabelText('URL Gambar'), saved.image_url)
  await user.click(within(form).getByRole('button', { name: 'Simpan Banner' }))
  expect(await screen.findByText('Banner berhasil disimpan.')).not.toBeNull()
  expect(payload).toEqual({
    label: saved.label,
    title: saved.title,
    description: saved.description,
    image_url: saved.image_url,
  })
  expect(reads).toBe(2)
})

test('simpan perubahan memakai PUT dan mempertahankan isian bila gagal', async () => {
  let method = ''
  let payload
  server.use(
    http.get('*/api/page-banners/berita', () => json({ ...saved, page: 'berita', title: 'Berita' })),
    http.put('*/api/page-banners/berita', async ({ request }) => {
      method = 'PUT'
      payload = await request.json()
      return HttpResponse.json({ success: false, message: 'Gagal menyimpan di server.' }, { status: 500 })
    }),
  )
  const user = openAdmin('berita')
  const form = await screen.findByRole('form', { name: 'Banner Berita' })
  await user.clear(within(form).getByLabelText('Judul'))
  await user.type(within(form).getByLabelText('Judul'), 'Berita Terbaru')
  await user.click(within(form).getByRole('button', { name: 'Simpan Banner' }))
  expect(await screen.findByText('Gagal menyimpan di server.')).not.toBeNull()
  expect(method).toBe('PUT')
  expect(payload.title).toBe('Berita Terbaru')
  expect(within(form).getByLabelText('Judul').value).toBe('Berita Terbaru')
})

test('field wajib divalidasi sebelum mengirim request', async () => {
  let writes = 0
  server.use(
    http.get('*/api/page-banners/artikel', () => json(null)),
    http.post('*/api/page-banners/artikel', () => {
      writes += 1
      return HttpResponse.json({ success: true, data: null })
    }),
  )
  const user = openAdmin('artikel')
  const form = await screen.findByRole('form', { name: 'Banner Artikel' })
  await user.click(within(form).getByRole('button', { name: 'Simpan Banner' }))
  expect(await within(form).findByText('Label wajib diisi.')).not.toBeNull()
  expect(writes).toBe(0)
})

test('banner 404 dapat dibuat lewat POST lalu diverifikasi dengan GET', async () => {
  let record = null
  let payload
  let reads = 0
  server.use(
    http.get('*/api/page-banners/kontak', () => {
      reads += 1
      return record
        ? json(record)
        : HttpResponse.json({ success: false, message: 'Not Found' }, { status: 404 })
    }),
    http.post('*/api/page-banners/kontak', async ({ request }) => {
      payload = await request.json()
      record = { page: 'kontak', ...payload }
      return HttpResponse.json({ success: true, data: record }, { status: 201 })
    }),
  )
  const user = openAdmin('kontak')
  const form = await screen.findByRole('form', { name: 'Banner Kontak' })
  expect(await screen.findByText(/belum diatur/i)).not.toBeNull()
  await user.click(within(form).getByRole('button', { name: 'Isi Teks Bawaan' }))
  const save = within(form).getByRole('button', { name: 'Simpan Banner' })
  expect(save.matches(':disabled')).toBe(false)
  await user.click(save)
  expect(await screen.findByText('Banner berhasil disimpan.')).not.toBeNull()
  expect(payload).toEqual(DEFAULT_PAGE_BANNERS.kontak)
  expect(reads).toBe(2)
})

test('unggah gambar memakai field image dan URL hasil unggah disimpan sebagai image_url', async () => {
  let payload
  let uploadField
  server.use(
    http.get('*/api/page-banners/kontak', () => json(null)),
    http.post('*/api/uploads/image', async ({ request }) => {
      const body = await request.text()
      uploadField = body.match(/name="image"; filename="([^"]+)"/)?.[1]
      return HttpResponse.json({ data: { url: '/uploads/kontak-baru.png' } }, { status: 201 })
    }),
    http.post('*/api/page-banners/kontak', async ({ request }) => {
      payload = await request.json()
      return HttpResponse.json(
        { success: true, data: { page: 'kontak', ...payload } },
        { status: 201 },
      )
    }),
  )
  const user = openAdmin('kontak')
  const form = await screen.findByRole('form', { name: 'Banner Kontak' })
  await user.type(within(form).getByLabelText('Label'), 'Kontak — Kami Siap Membantu')
  await user.type(within(form).getByLabelText('Judul'), 'Hubungi Kami')
  await user.type(within(form).getByLabelText('Deskripsi'), 'Tim kami merespons setiap pesan.')
  await user.upload(
    within(form).getByLabelText('Unggah Gambar'),
    new File(['fixture-banner'], 'kontak.png', { type: 'image/png' }),
  )
  await waitFor(() =>
    expect(within(form).getByLabelText('URL Gambar').value).toBe('/uploads/kontak-baru.png'),
  )
  await user.click(within(form).getByRole('button', { name: 'Simpan Banner' }))
  await waitFor(() => expect(payload).toBeDefined())
  expect(uploadField).toBe('kontak.png')
  expect(payload.image_url).toBe('/uploads/kontak-baru.png')
})

test('hapus banner meminta konfirmasi lalu memastikan data kembali kosong', async () => {
  let deleted = 0
  let reads = 0
  server.use(
    http.get('*/api/page-banners/tentang', () => {
      reads += 1
      return json(reads === 1 ? saved : null)
    }),
    http.delete('*/api/page-banners/tentang', () => {
      deleted += 1
      return HttpResponse.json({ success: true, data: null })
    }),
  )
  const user = openAdmin()
  await screen.findByRole('form', { name: 'Banner Tentang' })
  await user.click(screen.getByRole('button', { name: 'Hapus Banner' }))
  const dialog = screen.getByRole('alertdialog', { name: 'Hapus Banner?' })
  expect(deleted).toBe(0)
  await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
  expect(deleted).toBe(0)
  await user.click(screen.getByRole('button', { name: 'Hapus Banner' }))
  await user.click(
    within(screen.getByRole('alertdialog', { name: 'Hapus Banner?' })).getByRole('button', {
      name: 'Ya, Hapus Banner',
    }),
  )
  expect(await screen.findByText('Banner berhasil dihapus.')).not.toBeNull()
  expect(deleted).toBe(1)
  expect(reads).toBe(2)
})

test('operator tidak dapat membuka pengelolaan banner', () => {
  openAdmin('tentang', 'operator')
  expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  expect(screen.queryByRole('form')).toBeNull()
})
