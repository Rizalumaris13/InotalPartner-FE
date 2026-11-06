import { beforeAll, expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { delay, http, HttpResponse } from 'msw'
import HomepageServicesSection from '../src/components/HomepageServicesSection'
import LandingPage from '../src/pages/LandingPage'
import { DEFAULT_HOMEPAGE_SERVICES } from '../src/data/homepageServices'
import { server } from './setup'

beforeAll(() => {
  if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver = class {
      constructor(callback) { this.callback = callback }
      observe(element) { this.callback([{ isIntersecting: true, target: element }]) }
      disconnect() {}
      unobserve() {}
    }
  }
})

const edited = {
  ...DEFAULT_HOMEPAGE_SERVICES,
  eyebrow: 'Solusi Kami',
  title: 'Layanan Partnership',
  description: 'Empat pilar layanan versi admin.',
  badge_value: '12+',
  badge_label: 'Mitra Aktif',
  photo_primary_url: '/uploads/layanan-utama.png',
  photo_primary_alt: 'Foto utama versi admin',
  photo_secondary_url: 'HTTPS://images.example.test/layanan-kedua.png',
  photo_secondary_alt: 'Foto kedua versi admin',
  services: [
    { icon: 'cpu', title: 'CLOUD MIGRATION', description: 'Deskripsi kartu satu.' },
    { icon: 'database', title: 'DATA PLATFORM', description: 'Deskripsi kartu dua.' },
    { icon: 'shield-check', title: 'SECURITY REVIEW', description: 'Deskripsi kartu tiga.' },
    { icon: 'rocket', title: 'PRODUCT LAUNCH', description: 'Deskripsi kartu empat.' },
  ],
}

test('komponen layanan merender label, foto, badge, dan empat kartu', () => {
  render(<HomepageServicesSection services={edited} preview />)
  const section = within(screen.getByRole('region', { name: 'Layanan Kami' }))
  expect(section.getByText('Solusi Kami')).not.toBeNull()
  expect(section.getByRole('heading', { name: 'Layanan Partnership' })).not.toBeNull()
  expect(section.getByText('Empat pilar layanan versi admin.')).not.toBeNull()
  expect(section.getByText('12+')).not.toBeNull()
  expect(section.getByText('Mitra Aktif')).not.toBeNull()
  expect(section.getByAltText('Foto utama versi admin').getAttribute('src')).toBe('/uploads/layanan-utama.png')
  // Skema huruf besar dinormalkan oleh lapisan API, jadi komponen menerima URL apa adanya.
  for (const service of edited.services) {
    expect(section.getByRole('heading', { name: service.title })).not.toBeNull()
    expect(section.getByText(service.description)).not.toBeNull()
  }
})

test('Beranda memakai data layanan dari resource publik dan mempertahankan bagian lain', async () => {
  let reads = 0
  server.use(
    http.get('*/api/public/homepage/services', () => { reads += 1; return HttpResponse.json({ success: true, data: edited }) }),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  render(<LandingPage />)
  await waitFor(() => expect(reads).toBe(1))
  const section = within(await screen.findByRole('region', { name: 'Layanan Kami' }))
  expect(section.getByText('Solusi Kami')).not.toBeNull()
  expect(section.getByRole('heading', { name: 'Layanan Partnership' })).not.toBeNull()
  expect(section.getByText('12+')).not.toBeNull()
  expect(section.getByAltText('Foto utama versi admin').getAttribute('src')).toBe('/uploads/layanan-utama.png')
  for (const service of edited.services) {
    expect(section.getByRole('heading', { name: service.title })).not.toBeNull()
  }
  // Bagian lain Beranda tetap ada.
  expect(screen.getByRole('heading', { name: 'Saatnya Bersama Beraksi' })).not.toBeNull()
})

test.each([
  ['404', () => HttpResponse.json({ message: 'Belum ada.' }, { status: 404 })],
  ['500', () => HttpResponse.json({ message: 'Server error.' }, { status: 500 })],
  ['null', () => HttpResponse.json({ success: true, data: null })],
  ['invalid', () => HttpResponse.json({ success: true, data: { eyebrow: 'x' } })],
])('respons publik %s menampilkan layanan bawaan', async (label, handler) => {
  server.use(
    http.get('*/api/public/homepage/services', handler),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  render(<LandingPage />)
  const section = within(await screen.findByRole('region', { name: 'Layanan Kami' }))
  expect(section.getByRole('heading', { name: DEFAULT_HOMEPAGE_SERVICES.title })).not.toBeNull()
  expect(section.getByText(DEFAULT_HOMEPAGE_SERVICES.badge_label)).not.toBeNull()
  expect(section.getByRole('heading', { name: DEFAULT_HOMEPAGE_SERVICES.services[0].title })).not.toBeNull()
})

test('respons invalid yang terlambat tetap jatuh ke layanan bawaan', async () => {
  let settled = 0
  server.use(
    http.get('*/api/public/homepage/services', async () => {
      await delay(60)
      settled += 1
      return HttpResponse.json({ success: true, data: { eyebrow: 'rusak' } })
    }),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  render(<LandingPage />)
  const section = within(screen.getByRole('region', { name: 'Layanan Kami' }))
  expect(section.getByText(DEFAULT_HOMEPAGE_SERVICES.eyebrow)).not.toBeNull()
  await waitFor(() => expect(settled).toBe(1))
  expect(section.getByText(DEFAULT_HOMEPAGE_SERVICES.eyebrow)).not.toBeNull()
  expect(section.queryByText('rusak')).toBeNull()
})
