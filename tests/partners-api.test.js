import { expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import {
  createPartnerApi,
  deletePartnerApi,
  getPublicPartnersApi,
  listPartnersApi,
  updatePartnerApi,
} from '../src/api/partners'
import { server } from './setup'

const partner = {
  id: 1,
  name: 'Mitra Uji',
  logo_url: '',
  website_url: '',
  sort_order: 0,
  is_active: false,
}
const payload = {
  name: 'Mitra Uji',
  logo_url: '',
  website_url: '',
  sort_order: 0,
  is_active: false,
}

test.each([listPartnersApi, getPublicPartnersApi])(
  'API daftar menolak format yang tidak sesuai kontrak',
  async (load) => {
    server.use(
      http.get('*/api/homepage/partners', () =>
        HttpResponse.json({ data: { items: [partner] } }),
      ),
      http.get('*/api/public/homepage/partners', () =>
        HttpResponse.json({ data: { items: [partner] } }),
      ),
    )
    await expect(load()).rejects.toThrow(
      'Format data mitra dari backend tidak sesuai kontrak.',
    )
  },
)

test('API daftar menolak tipe status string agar false tidak dianggap aktif', async () => {
  server.use(
    http.get('*/api/homepage/partners', () =>
      HttpResponse.json({ data: [{ ...partner, is_active: 'false' }] }),
    ),
  )
  await expect(listPartnersApi()).rejects.toThrow(
    'Format data mitra dari backend tidak sesuai kontrak.',
  )
})

test('create tidak mengaku berhasil ketika respons tidak berisi mitra tersimpan', async () => {
  server.use(
    http.post('*/api/homepage/partners', () =>
      HttpResponse.json({ success: true }, { status: 201 }),
    ),
  )
  await expect(createPartnerApi(payload)).rejects.toThrow(
    'Respons penyimpanan mitra tidak sesuai kontrak.',
  )
})

test('update menolak respons dengan ID mitra lain', async () => {
  server.use(
    http.put('*/api/homepage/partners/1', () =>
      HttpResponse.json({ data: { ...partner, id: 2 } }),
    ),
  )
  await expect(updatePartnerApi(1, payload)).rejects.toThrow(
    'ID mitra pada respons backend tidak sesuai.',
  )
})

test('delete tidak mengaku berhasil saat backend menolak pada HTTP 200', async () => {
  server.use(
    http.delete('*/api/homepage/partners/1', () =>
      HttpResponse.json({ success: false, message: 'Penghapusan ditolak.' }),
    ),
  )
  await expect(deletePartnerApi(1)).rejects.toThrow('Penghapusan ditolak.')
})

test('admin mengirim JWT dan mengambil seluruh koleksi tanpa batas tersembunyi', async () => {
  localStorage.setItem('inotal_token', 'token-khusus-pengujian')
  let authorization
  let query
  server.use(
    http.get('*/api/homepage/partners', ({ request }) => {
      authorization = request.headers.get('authorization')
      query = new URL(request.url).search
      return HttpResponse.json({ data: [partner] })
    }),
  )
  expect(await listPartnersApi()).toEqual([partner])
  expect(authorization).toBe('Bearer token-khusus-pengujian')
  expect(query).toBe('')
})
