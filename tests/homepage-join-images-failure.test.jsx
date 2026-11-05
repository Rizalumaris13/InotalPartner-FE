import { expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import HomepageJoinImagesPage from '../src/pages/HomepageJoinImagesPage'
import { DEFAULT_JOIN_IMAGES, JOIN_IMAGE_SLOTS } from '../src/data/homepageJoinImages'
import { server } from './setup'

const original = {
  top_left_url: '/uploads/kiri.png', center_url: '/uploads/tengah.png', bottom_right_url: '/uploads/kanan.png',
}
const json = (data) => HttpResponse.json({ success: true, data })
async function openEditor(role = 'admin') {
  const view = render(<HomepageJoinImagesPage role={role} />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  return { ...view, form, user: userEvent.setup() }
}

test.each(['guest', 'operator', undefined])('role %s tidak dapat membaca atau mengubah kolase', (role) => {
  let reads = 0
  server.use(http.get('*/api/homepage/join-images', () => { reads += 1; return json(original) }))
  render(<HomepageJoinImagesPage role={role} />)
  expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  expect(screen.queryByRole('form')).toBeNull()
  expect(reads).toBe(0)
})

test.each([404, 500])('GET %s tidak dianggap konfigurasi kosong dan tidak mengaktifkan simpan', async (status) => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: false, message: 'Server belum siap.' }, { status })),
    http.put('*/api/homepage/join-images', () => { writes += 1; return json(original) }),
  )
  const { form, user } = await openEditor()
  const save = within(form).getByRole('button', { name: 'Simpan Gambar' })
  expect(screen.getByRole('alert')).not.toBeNull()
  expect(save.matches(':disabled')).toBe(true)
  await user.clear(within(form).getByLabelText('URL foto kiri atas'))
  await user.type(within(form).getByLabelText('URL foto kiri atas'), '/uploads/draft.png')
  await user.click(save)
  expect(writes).toBe(0)
  expect(within(form).getByAltText('Tim diskusi').getAttribute('src')).toBe('/uploads/draft.png')
  expect(Object.keys(localStorage)).toEqual([])
})

test('GET null dapat diinisialisasi oleh super_admin tanpa mengubah jumlah posisi foto', async () => {
  let record = null
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-images', () => json(record)),
    http.put('*/api/homepage/join-images', async ({ request }) => {
      writes += 1
      record = await request.json()
      return json(record)
    }),
  )
  const { form, user } = await openEditor({ name: 'super_admin' })
  expect(screen.getByText(/Kolase belum diatur/)).not.toBeNull()
  expect(screen.queryByText('Gambar kolase berhasil disimpan.')).toBeNull()
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
  expect(record).toEqual(DEFAULT_JOIN_IMAGES)
  expect(writes).toBe(1)
})

test('PUT gagal mempertahankan URL draft dan bisa dicoba lagi', async () => {
  let record = original
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-images', () => json(record)),
    http.put('*/api/homepage/join-images', async ({ request }) => {
      writes += 1
      if (writes === 1) return HttpResponse.json({ success: false, message: 'Gagal menyimpan foto.' }, { status: 500 })
      record = await request.json()
      return json(record)
    }),
  )
  const { form, user } = await openEditor()
  const input = within(form).getByLabelText('URL foto tengah (utama)')
  await user.clear(input)
  await user.type(input, '/uploads/utama-baru.png')
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Gagal menyimpan foto.')).not.toBeNull()
  expect(input.value).toBe('/uploads/utama-baru.png')
  expect(screen.queryByText('Gambar kolase berhasil disimpan.')).toBeNull()
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
  expect(record.center_url).toBe('/uploads/utama-baru.png')
  expect(writes).toBe(2)
})

test('PUT diterima tetapi GET gagal: retry hanya GET, tanpa mengirim ulang atau kehilangan draft', async () => {
  let stored = original
  let writes = 0
  let reads = 0
  let verificationFails = true
  server.use(
    http.get('*/api/homepage/join-images', () => {
      reads += 1
      return writes && verificationFails
        ? HttpResponse.json({ success: false, message: 'Verifikasi tertunda.' }, { status: 503 })
        : json(stored)
    }),
    http.put('*/api/homepage/join-images', async ({ request }) => {
      writes += 1
      stored = await request.json()
      return json(stored)
    }),
  )
  const { form, user } = await openEditor()
  const input = within(form).getByLabelText('URL foto kiri atas')
  await user.clear(input)
  await user.type(input, '/uploads/draft-terkirim.png')
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Verifikasi tertunda.')).not.toBeNull()
  expect(input.value).toBe('/uploads/draft-terkirim.png')
  expect(within(form).getByRole('button', { name: 'Simpan Gambar' }).matches(':disabled')).toBe(true)
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect(await screen.findByText('Verifikasi tertunda.')).not.toBeNull()
  verificationFails = false
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
  expect(reads).toBe(4)
  expect(writes).toBe(1)
})

test.each(JOIN_IMAGE_SLOTS)('hasil baca ulang lama pada $key tidak dianggap berhasil', async ({ key, label }) => {
  server.use(
    http.get('*/api/homepage/join-images', () => json(original)),
    http.put('*/api/homepage/join-images', async ({ request }) => json(await request.json())),
  )
  const { form, user } = await openEditor()
  const input = within(form).getByLabelText(`URL ${label.toLowerCase()}`)
  await user.clear(input)
  await user.type(input, `/uploads/${key}-baru.png`)
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText(/hasil baca ulang belum sesuai/)).not.toBeNull()
  expect(screen.queryByText('Gambar kolase berhasil disimpan.')).toBeNull()
  expect(input.value).toBe(`/uploads/${key}-baru.png`)
})

test('URL tidak aman tidak dirender pada pratinjau dan tidak dikirim', async () => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-images', () => json(original)),
    http.put('*/api/homepage/join-images', () => { writes += 1; return json(original) }),
  )
  const { form, user } = await openEditor()
  const input = within(form).getByLabelText('URL foto kiri atas')
  await user.clear(input)
  await user.type(input, 'javascript:alert(1)')
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(within(form).getByRole('alert').textContent).toContain('Pilih foto atau isi URL')
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(within(form).getByAltText('Tim diskusi').getAttribute('src')).toBe(DEFAULT_JOIN_IMAGES.top_left_url)
  expect(writes).toBe(0)
})
