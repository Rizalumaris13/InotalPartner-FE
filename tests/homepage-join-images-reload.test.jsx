import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import HomepageJoinImagesPage from '../src/pages/HomepageJoinImagesPage'
import { DEFAULT_JOIN_IMAGES } from '../src/data/homepageJoinImages'
import { server } from './setup'

const originalCreate = URL.createObjectURL
const originalRevoke = URL.revokeObjectURL
beforeEach(() => {
  URL.createObjectURL = vi.fn((file) => `blob:kolase-fixture-${file.name}`)
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => {
  cleanup()
  if (originalCreate) URL.createObjectURL = originalCreate
  else delete URL.createObjectURL
  if (originalRevoke) URL.revokeObjectURL = originalRevoke
  else delete URL.revokeObjectURL
})

const initial = {
  top_left_url: '/uploads/kiri-lama.png',
  center_url: '/uploads/tengah-lama.png',
  bottom_right_url: '/uploads/kanan-lama.png',
}

test('Muat Ulang membuang seluruh draf: pilihan file dan URL ketikan tidak bercampur data server', async () => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: initial })),
    http.put('*/api/homepage/join-images', () => { writes += 1; return HttpResponse.json({ success: true, data: initial }) }),
  )
  const user = userEvent.setup()
  render(<HomepageJoinImagesPage role="admin" />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  const preview = screen.getByRole('region', { name: 'Pratinjau kolase Mengapa Bergabung' })
  await user.upload(within(form).getByLabelText('Pilih foto kiri atas'), new File(['satu'], 'kiri.png', { type: 'image/png' }))
  const center = within(form).getByLabelText('URL foto tengah (utama)')
  await user.clear(center)
  await user.type(center, '/uploads/tengah-draf.png')
  expect(within(preview).getByAltText('Tim diskusi').getAttribute('src')).toBe('blob:kolase-fixture-kiri.png')
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  const reloaded = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  expect(within(reloaded).getByLabelText('URL foto kiri atas').value).toBe(initial.top_left_url)
  expect(within(reloaded).getByLabelText('URL foto tengah (utama)').value).toBe(initial.center_url)
  expect(within(reloaded).queryByText(/belum diunggah/)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Batal pilih foto kiri atas' })).toBeNull()
  const reloadedPreview = screen.getByRole('region', { name: 'Pratinjau kolase Mengapa Bergabung' })
  expect(within(reloadedPreview).getByAltText('Tim diskusi').getAttribute('src')).toBe(initial.top_left_url)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:kolase-fixture-kiri.png')
  await user.click(within(reloaded).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
  expect(writes).toBe(1)
})

test('Muat Ulang setelah upload pertama berhasil dan upload kedua gagal tidak menyisakan campuran draf', async () => {
  let record = initial
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: record })),
    http.post('*/api/uploads/image', async ({ request }) => {
      const filename = (await request.text()).match(/filename="([^"]+)"/)?.[1]
      if (filename === 'kanan-baru.png') return HttpResponse.json({ message: 'Upload terputus.' }, { status: 500 })
      return HttpResponse.json({ data: { url: `/uploads/${filename}` } }, { status: 201 })
    }),
    http.put('*/api/homepage/join-images', async ({ request }) => {
      writes += 1
      record = await request.json()
      return HttpResponse.json({ success: true, data: record })
    }),
  )
  const user = userEvent.setup()
  render(<HomepageJoinImagesPage role="admin" />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  await user.upload(within(form).getByLabelText('Pilih foto kiri atas'), new File(['kiri'], 'kiri-baru.png', { type: 'image/png' }))
  await user.upload(within(form).getByLabelText('Pilih foto kanan bawah'), new File(['kanan'], 'kanan-baru.png', { type: 'image/png' }))
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Upload terputus.')).not.toBeNull()
  expect(within(form).getByLabelText('URL foto kiri atas').value).toBe('/uploads/kiri-baru.png')
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  const reloaded = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  expect(within(reloaded).getByLabelText('URL foto kiri atas').value).toBe(initial.top_left_url)
  expect(within(reloaded).getByLabelText('URL foto kanan bawah').value).toBe(initial.bottom_right_url)
  expect(within(reloaded).queryByText(/belum diunggah/)).toBeNull()
  expect(writes).toBe(0)
})

test('skema URL huruf besar dinormalisasi agar tetap absolut pada pratinjau dan payload', async () => {
  let record = initial
  let payload
  server.use(
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: record })),
    http.put('*/api/homepage/join-images', async ({ request }) => {
      payload = await request.json()
      record = payload
      return HttpResponse.json({ success: true, data: payload })
    }),
  )
  const user = userEvent.setup()
  render(<HomepageJoinImagesPage role="admin" />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  const input = within(form).getByLabelText('URL foto kiri atas')
  await user.clear(input)
  await user.type(input, 'HTTPS://images.example.test/team.png')
  const preview = screen.getByRole('region', { name: 'Pratinjau kolase Mengapa Bergabung' })
  expect(within(preview).getByAltText('Tim diskusi').getAttribute('src')).toBe('https://images.example.test/team.png')
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
  expect(payload.top_left_url).toBe('https://images.example.test/team.png')
})

test('URL hasil upload berskema huruf besar tetap lolos verifikasi dan tidak mengunci editor', async () => {
  let record = initial
  let payload
  let reads = 0
  server.use(
    http.get('*/api/homepage/join-images', () => { reads += 1; return HttpResponse.json({ success: true, data: record }) }),
    http.post('*/api/uploads/image', () => HttpResponse.json({ data: { url: 'HTTPS://images.example.test/uploaded.png' } }, { status: 201 })),
    http.put('*/api/homepage/join-images', async ({ request }) => {
      payload = await request.json()
      record = payload
      return HttpResponse.json({ success: true, data: payload })
    }),
  )
  const user = userEvent.setup()
  render(<HomepageJoinImagesPage role="admin" />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  await user.upload(within(form).getByLabelText('Pilih foto kiri atas'), new File(['kiri'], 'kiri.png', { type: 'image/png' }))
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
  expect(payload.top_left_url).toBe('https://images.example.test/uploaded.png')
  expect(within(form).getByLabelText('URL foto kiri atas').value).toBe('https://images.example.test/uploaded.png')
  expect(within(form).getByLabelText('URL foto kiri atas').matches(':disabled')).toBe(false)
  expect(reads).toBe(2)
})

test('Muat Ulang yang gagal tetap mengosongkan draf, bukan menyisakan URL ketikan', async () => {
  let reads = 0
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-images', () => {
      reads += 1
      return reads === 1
        ? HttpResponse.json({ success: true, data: initial })
        : HttpResponse.json({ message: 'Server sedang sibuk.' }, { status: 500 })
    }),
    http.put('*/api/homepage/join-images', () => { writes += 1; return HttpResponse.json({ success: true, data: initial }) }),
  )
  const user = userEvent.setup()
  render(<HomepageJoinImagesPage role="admin" />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  const input = within(form).getByLabelText('URL foto kiri atas')
  await user.clear(input)
  await user.type(input, '/uploads/draf-sebelum-reload.png')
  await user.upload(within(form).getByLabelText('Pilih foto kanan bawah'), new File(['kanan'], 'kanan.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  expect(await screen.findByText('Server sedang sibuk.')).not.toBeNull()
  const failed = screen.getByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  expect(within(failed).getByLabelText('URL foto kiri atas').value).toBe(DEFAULT_JOIN_IMAGES.top_left_url)
  expect(within(failed).queryByText(/belum diunggah/)).toBeNull()
  expect(within(failed).getByRole('button', { name: 'Simpan Gambar' }).matches(':disabled')).toBe(true)
  await user.click(within(failed).getByRole('button', { name: 'Simpan Gambar' }))
  expect(writes).toBe(0)
})
