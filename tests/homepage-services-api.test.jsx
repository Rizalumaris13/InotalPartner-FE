import { expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { getHomepageServicesApi, getPublicHomepageServicesApi, saveHomepageServicesApi } from '../src/api/homepageServices'
import { DEFAULT_HOMEPAGE_SERVICES } from '../src/data/homepageServices'
import { SERVICE_ICONS } from '../src/data/partnershipServiceIcons'
import { isHomepageServicesRecord, toHomepageServicesPayload, validateHomepageServices } from '../src/utils/homepageServices'
import { server } from './setup'

const withChange = (patch) => ({ ...DEFAULT_HOMEPAGE_SERVICES, ...patch })
const withServices = (services) => withChange({ services })
const invalidRecords = [
  {}, [], 'teks',
  withChange({ eyebrow: '' }),
  withChange({ title: 'x'.repeat(81) }),
  withChange({ description: 'x'.repeat(501) }),
  withChange({ badge_value: '' }),
  withChange({ badge_value: '123456789' }),
  withChange({ badge_label: '' }),
  withChange({ photo_primary_url: 'javascript:alert(1)' }),
  withChange({ photo_primary_alt: '' }),
  withChange({ photo_secondary_url: '/uploads/../x.png' }),
  withServices(DEFAULT_HOMEPAGE_SERVICES.services.slice(1)),
  withServices([...DEFAULT_HOMEPAGE_SERVICES.services, DEFAULT_HOMEPAGE_SERVICES.services[0]]),
  withServices(DEFAULT_HOMEPAGE_SERVICES.services.map((s, i) => (i === 0 ? { ...s, icon: 'tidak-ada' } : s))),
  withServices(DEFAULT_HOMEPAGE_SERVICES.services.map((s, i) => (i === 1 ? { ...s, title: '' } : s))),
  withServices(DEFAULT_HOMEPAGE_SERVICES.services.map((s, i) => (i === 2 ? { ...s, description: 'x'.repeat(301) } : s))),
]

test.each(invalidRecords.map((data) => [data]))('record tidak valid ditolak validator dan API: %#', async (data) => {
  expect(isHomepageServicesRecord(data)).toBe(false)
  expect(Object.keys(validateHomepageServices(data)).length).toBeGreaterThan(0)
  server.use(
    http.get('*/api/homepage/services', () => HttpResponse.json({ success: true, data })),
    http.get('*/api/public/homepage/services', () => HttpResponse.json({ success: true, data })),
  )
  await expect(getHomepageServicesApi()).rejects.toThrow('kontrak')
  await expect(getPublicHomepageServicesApi()).rejects.toThrow('kontrak')
})

test('nilai bawaan valid dan semua ikon katalog diterima', () => {
  expect(validateHomepageServices(DEFAULT_HOMEPAGE_SERVICES)).toEqual({})
  expect(SERVICE_ICONS.length).toBeGreaterThanOrEqual(4)
  for (const icon of SERVICE_ICONS) {
    const record = withServices(DEFAULT_HOMEPAGE_SERVICES.services.map((service, i) => (i === 0 ? { ...service, icon: icon.value } : service)))
    expect(isHomepageServicesRecord(record)).toBe(true)
  }
})

test('data null berarti belum diatur, bukan error kontrak', async () => {
  server.use(
    http.get('*/api/homepage/services', () => HttpResponse.json({ success: true, data: null })),
    http.get('*/api/public/homepage/services', () => HttpResponse.json({ success: true, data: null })),
  )
  await expect(getHomepageServicesApi()).resolves.toBeNull()
  await expect(getPublicHomepageServicesApi()).resolves.toBeNull()
})

test('PUT hanya mengirim field kontrak, dirapikan, dan skema foto dinormalkan', async () => {
  let payload
  server.use(http.put('*/api/homepage/services', async ({ request }) => {
    payload = await request.json()
    return HttpResponse.json({ success: true })
  }))
  await saveHomepageServicesApi({
    ...DEFAULT_HOMEPAGE_SERVICES,
    eyebrow: '  Solusi  ',
    photo_primary_url: 'HTTPS://images.example.test/a.png',
    photo_secondary_url: ' HTTP://images.example.test/b.png ',
    services: DEFAULT_HOMEPAGE_SERVICES.services.map((service) => ({ ...service, title: ` ${service.title} ` })),
    id: 'jangan-kirim',
    role: 'admin',
    updated_at: '2026-01-01',
  })
  expect(payload.eyebrow).toBe('Solusi')
  expect(payload.photo_primary_url).toBe('https://images.example.test/a.png')
  expect(payload.photo_secondary_url).toBe('http://images.example.test/b.png')
  expect(payload.services[0].title).toBe(DEFAULT_HOMEPAGE_SERVICES.services[0].title)
  expect(Object.keys(payload).sort()).toEqual([
    'badge_label', 'badge_value', 'description', 'eyebrow', 'photo_primary_alt', 'photo_primary_url',
    'photo_secondary_alt', 'photo_secondary_url', 'services', 'title',
  ])
  expect(Object.keys(payload.services[0]).sort()).toEqual(['description', 'icon', 'title'])
})

test('respons publik dinormalkan sebelum dirender', async () => {
  server.use(http.get('*/api/public/homepage/services', () => HttpResponse.json({
    success: true,
    data: withChange({ photo_primary_url: 'HTTPS://images.example.test/a.png' }),
  })))
  const record = await getPublicHomepageServicesApi()
  expect(record.photo_primary_url).toBe('https://images.example.test/a.png')
})

test('success false dan respons tanpa konfirmasi bukan bukti tersimpan', async () => {
  server.use(http.put('*/api/homepage/services', () => HttpResponse.json({ success: false, message: 'Ditolak backend.' })))
  await expect(saveHomepageServicesApi(DEFAULT_HOMEPAGE_SERVICES)).rejects.toThrow('Ditolak backend.')
  server.use(http.put('*/api/homepage/services', () => HttpResponse.json({ data: DEFAULT_HOMEPAGE_SERVICES })))
  await expect(saveHomepageServicesApi(DEFAULT_HOMEPAGE_SERVICES)).rejects.toThrow('belum mengonfirmasi')
})

test('payload menolak record yang belum valid', () => {
  expect(() => saveHomepageServicesApi(undefined)).toThrow('belum valid')
  expect(toHomepageServicesPayload(undefined).services).toEqual([])
})
