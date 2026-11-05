import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import HomepageJoinImagesPage from '../src/pages/HomepageJoinImagesPage'
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
const slots = [
  ['foto kiri atas', 'top_left_url', 'Tim diskusi'],
  ['foto tengah (utama)', 'center_url', 'Kolaborasi'],
  ['foto kanan bawah', 'bottom_right_url', 'Kemitraan'],
]

test.each(slots)('admin memilih %s, melihat pratinjau lokal, lalu mengunggah saat Simpan', async (label, key, alt) => {
  let record = initial
  let uploads = 0
  let writes = 0
  let payload
  const uploaded = `/uploads/${key}-unggahan.png`
  server.use(
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: record })),
    http.post('*/api/uploads/image', async ({ request }) => {
      uploads += 1
      expect(await request.text()).toContain('name="image"; filename="foto.png"')
      return HttpResponse.json({ data: { url: uploaded } }, { status: 201 })
    }),
    http.put('*/api/homepage/join-images', async ({ request }) => {
      writes += 1
      payload = await request.json()
      record = payload
      return HttpResponse.json({ success: true, data: record })
    }),
  )
  const user = userEvent.setup()
  render(<HomepageJoinImagesPage role="admin" />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  await user.upload(within(form).getByLabelText(`Pilih ${label}`), new File(['test-image'], 'foto.png', { type: 'image/png' }))
  const preview = screen.getByRole('region', { name: 'Pratinjau kolase Mengapa Bergabung' })
  expect(within(preview).getByAltText(alt).getAttribute('src')).toBe('blob:kolase-fixture-foto.png')
  expect(uploads).toBe(0)
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
  expect(payload).toEqual({ ...initial, [key]: uploaded })
  expect(uploads).toBe(1)
  expect(writes).toBe(1)
  expect(within(preview).getByAltText(alt).getAttribute('src')).toBe(uploaded)
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:kolase-fixture-foto.png')
})

test('retry setelah sebagian upload gagal tidak mengunggah ulang foto yang sudah berhasil', async () => {
  let record = initial
  let writes = 0
  const uploads = []
  let failOnce = true
  server.use(
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: record })),
    http.post('*/api/uploads/image', async ({ request }) => {
      const body = await request.text()
      const filename = body.match(/filename="([^"]+)"/)?.[1]
      uploads.push(filename)
      if (filename === 'bottom_right_url.png' && failOnce) {
        failOnce = false
        return HttpResponse.json({ message: 'Upload terputus.' }, { status: 500 })
      }
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
  for (const [label, key] of slots) {
    await user.upload(within(form).getByLabelText(`Pilih ${label}`), new File(['fixture'], `${key}.png`, { type: 'image/png' }))
  }
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Upload terputus.')).not.toBeNull()
  expect(writes).toBe(0)
  expect(within(form).getByLabelText('URL foto kiri atas').value).toBe('/uploads/top_left_url.png')
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
  expect(writes).toBe(1)
  expect(uploads.filter((name) => name === 'top_left_url.png')).toHaveLength(1)
  expect(uploads.filter((name) => name === 'bottom_right_url.png')).toHaveLength(2)
  expect(uploads.filter((name) => name === 'center_url.png')).toHaveLength(1)
  expect(record).toEqual(Object.fromEntries(slots.map(([, key]) => [key, `/uploads/${key}.png`])))
})

test('URL upload tidak valid tidak diteruskan ke PUT dan pratinjau pilihan tetap ada', async () => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: initial })),
    http.post('*/api/uploads/image', () => HttpResponse.json({ data: { url: 'javascript:alert(1)' } })),
    http.put('*/api/homepage/join-images', () => { writes += 1; return HttpResponse.json({ success: true }) }),
  )
  const user = userEvent.setup()
  render(<HomepageJoinImagesPage role="admin" />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  await user.upload(within(form).getByLabelText('Pilih foto tengah (utama)'), new File(['fixture'], 'utama.png', { type: 'image/png' }))
  await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
  expect(await screen.findByText(/tidak mengembalikan URL foto yang valid/)).not.toBeNull()
  expect(within(form).getByAltText('Kolaborasi').getAttribute('src')).toBe('blob:kolase-fixture-utama.png')
  expect(writes).toBe(0)
})

test('URL blob dibersihkan saat foto diganti, dibatalkan, dan editor ditutup', async () => {
  server.use(http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: initial })))
  const user = userEvent.setup()
  const view = render(<HomepageJoinImagesPage role="admin" />)
  const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  const picker = within(form).getByLabelText('Pilih foto kiri atas')
  await user.upload(picker, new File(['one'], 'satu.png', { type: 'image/png' }))
  await user.upload(picker, new File(['two'], 'dua.png', { type: 'image/png' }))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:kolase-fixture-satu.png')
  await user.click(within(form).getByRole('button', { name: 'Batal pilih foto kiri atas' }))
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:kolase-fixture-dua.png')
  expect(within(form).getByAltText('Tim diskusi').getAttribute('src')).toBe(initial.top_left_url)
  await user.upload(picker, new File(['three'], 'tiga.png', { type: 'image/png' }))
  view.unmount()
  expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:kolase-fixture-tiga.png')
})
