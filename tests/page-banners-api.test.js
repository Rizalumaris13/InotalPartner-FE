import { expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './setup'

const banner = {
  page: 'tentang',
  label: 'SIAPA KAMI — SEJAK 2019',
  title: 'Tentang Kami',
  description: 'Ekosistem kemitraan teknologi INOTAL.',
  image_url: '/uploads/banner-tentang.webp',
}

test('read banner admin/publik memakai resource halaman sendiri dan menerima data null', async () => {
  const { getPageBannerApi, getPublicPageBannerApi } = await import('../src/api/pageBanners')
  server.use(
    http.get('*/api/page-banners/tentang', () => HttpResponse.json({ success: true, data: banner })),
    http.get('*/api/public/page-banners/event', () => HttpResponse.json({ success: true, data: null })),
  )
  expect(await getPageBannerApi('tentang')).toEqual(banner)
  expect(await getPublicPageBannerApi('event')).toBeNull()
})

test.each([
  { success: true, data: { ...banner, page: 'event' } },
  { success: true, data: { ...banner, description: null } },
  { success: true, data: { ...banner, title: ' ' } },
  { success: true, data: { ...banner, image_url: 'javascript:alert(1)' } },
  { success: true, data: { ...banner, image_url: '/uploads/%2e%2e/secret.png' } },
  { success: true },
  { data: banner },
])('read menolak respons yang tidak sesuai halaman/kontrak: %j', async (response) => {
  const { getPageBannerApi } = await import('../src/api/pageBanners')
  server.use(http.get('*/api/page-banners/tentang', () => HttpResponse.json(response)))
  await expect(getPageBannerApi('tentang')).rejects.toThrow('kontrak')
})

test('read tidak menutupi success false dan menolak key halaman asing sebelum request', async () => {
  const { getPageBannerApi } = await import('../src/api/pageBanners')
  server.use(http.get('*/api/page-banners/tentang', () => HttpResponse.json({ success: false, message: 'Akses ditolak.', data: banner })))
  await expect(getPageBannerApi('tentang')).rejects.toThrow('Akses ditolak.')
  for (const page of ['news', '../event', 'EVENT', '', null]) {
    expect(() => getPageBannerApi(page)).toThrow('halaman')
  }
})

test('tulis banner menolak respons yang tidak mencerminkan payload atau halaman lain', async () => {
  const { createPageBannerApi, updatePageBannerApi, deletePageBannerApi } = await import('../src/api/pageBanners')
  const payload = { label: banner.label, title: 'Judul Baru', description: banner.description, image_url: banner.image_url }
  server.use(
    http.post('*/api/page-banners/tentang', () => HttpResponse.json({ success: true, data: { ...banner, title: 'Judul Lama' } }, { status: 201 })),
  )
  await expect(createPageBannerApi('tentang', payload)).rejects.toThrow('belum mencerminkan')
  server.use(
    http.put('*/api/page-banners/tentang', () => HttpResponse.json({ success: true, data: { ...banner, page: 'event' } })),
  )
  await expect(updatePageBannerApi('tentang', payload)).rejects.toThrow('kontrak')
  server.use(
    http.delete('*/api/page-banners/tentang', () => HttpResponse.json({ success: false, message: 'Tidak diizinkan.' })),
  )
  await expect(deletePageBannerApi('tentang')).rejects.toThrow('tidak mengonfirmasi')
  server.use(
    http.delete('*/api/page-banners/tentang', () => new HttpResponse(null, { status: 204 })),
  )
  await expect(deletePageBannerApi('tentang')).resolves.toBeNull()
  expect(() => createPageBannerApi('tentang', { ...payload, image_url: 'javascript:alert(1)' })).toThrow()
})
