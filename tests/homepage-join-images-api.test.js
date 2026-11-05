import { expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { getJoinImagesApi, getPublicJoinImagesApi, saveJoinImagesApi } from '../src/api/homepageJoinImages'
import { server } from './setup'

const record = {
  top_left_url: '/uploads/kiri.png',
  center_url: 'https://images.example.test/tengah.webp',
  bottom_right_url: '/uploads/kanan.jpg',
}

test.each([
  { success: true, data: { ...record, top_left_url: 'javascript:alert(1)' } },
  { success: true, data: { ...record, center_url: 'data:image/svg+xml,<svg/>' } },
  { success: true, data: { ...record, center_url: 'blob:temporary-file' } },
  { success: true, data: { ...record, bottom_right_url: '//images.example.test/kanan.jpg' } },
  { success: true, data: { ...record, top_left_url: '/uploads/../private.png' } },
  { success: true, data: { ...record, top_left_url: '/uploads/%2e%2e/private.png' } },
  { success: true, data: { ...record, center_url: 'https://user:secret@example.test/image.png' } },
  { success: true, data: { ...record, center_url: 'https://example.test/with space.png' } },
  { success: true, data: { ...record, center_url: 'https://example.test\\image.png' } },
  { success: true, data: { ...record, center_url: null } },
  { success: true, data: { top_left_url: record.top_left_url } },
  { success: true, data: [record] },
  { success: true },
  { success: false, data: record },
  { data: record },
])('API kolase menolak respons tidak valid: %j', async (body) => {
  server.use(http.get('*/api/public/homepage/join-images', () => HttpResponse.json(body)))
  await expect(getPublicJoinImagesApi()).rejects.toThrow('kontrak')
})

test('API kolase menerima data null sebagai konfigurasi belum dibuat', async () => {
  server.use(http.get('*/api/public/homepage/join-images', () => HttpResponse.json({ success: true, data: null })))
  expect(await getPublicJoinImagesApi()).toBeNull()
})

test('PUT mengirim hanya tiga URL yang sudah dinormalisasi, bukan field banner atau role', async () => {
  let payload
  server.use(http.put('*/api/homepage/join-images', async ({ request }) => {
    payload = await request.json()
    return HttpResponse.json({ success: true, data: payload })
  }))
  await saveJoinImagesApi({
    ...record,
    top_left_url: ` ${record.top_left_url} `,
    center_url: record.center_url.replace('https://', 'HTTPS://'),
    title: 'Jangan kirim', role: 'admin', page: 'tentang',
  })
  expect(payload).toEqual(record)
})

test('read admin juga menolak respons invalid dan write tidak menganggap success false sebagai berhasil', async () => {
  server.use(
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: {} })),
    http.put('*/api/homepage/join-images', () => HttpResponse.json({ success: false, message: 'Simpan ditolak.' })),
  )
  await expect(getJoinImagesApi()).rejects.toThrow('kontrak')
  await expect(saveJoinImagesApi(record)).rejects.toThrow('Simpan ditolak.')
  expect(() => saveJoinImagesApi({ ...record, center_url: '' })).toThrow('harus valid')
})
