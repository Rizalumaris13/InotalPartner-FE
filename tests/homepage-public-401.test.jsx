import { expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import LandingPage from '../src/pages/LandingPage'
import HomepageJoinCardsPage from '../src/pages/HomepageJoinCardsPage'
import { getPublicJoinCardsApi } from '../src/api/homepageJoinCards'
import { DEFAULT_JOIN_CARDS } from '../src/data/homepageJoinCards'
import { server } from './setup'

const seedSession = () => {
  localStorage.setItem('inotal_token', 'token-tamu-uji')
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'operator', full_name: 'Tamu Uji' }))
  window.location.hash = ''
}

test('401 pada resource publik tidak menghapus sesi dan tidak memaksa pindah ke login', async () => {
  seedSession()
  let reads = 0
  server.use(
    http.get('*/api/public/homepage/join-cards', () => { reads += 1; return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 }) }),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  // Panggilan langsung menunggu interceptor selesai, bukan sekadar request masuk.
  await expect(getPublicJoinCardsApi()).rejects.toBeTruthy()
  expect(localStorage.getItem('inotal_token')).toBe('token-tamu-uji')
  expect(window.location.hash).toBe('')
  reads = 0
  render(<LandingPage />)
  const section = within(screen.getByRole('heading', { name: 'Saatnya Bersama Beraksi' }).closest('section'))
  await waitFor(() => expect(reads).toBeGreaterThan(0))
  expect(section.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent))
    .toEqual(DEFAULT_JOIN_CARDS.map((card) => card.title))
  expect(localStorage.getItem('inotal_token')).toBe('token-tamu-uji')
  expect(localStorage.getItem('inotal_user')).toContain('Tamu Uji')
  expect(window.location.hash).toBe('')
})

test.each([
  '/api/public/homepage/join-cards',
  '/api/public/homepage/join-cards?page=1',
  `${window.location.origin}/api/public/homepage/join-cards`,
])('401 publik tidak mengakhiri sesi untuk URL %s', async (url) => {
  seedSession()
  let seen = ''
  server.use(http.get('*', ({ request }) => {
    seen = request.url
    return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })
  }))
  const api = (await import('../src/api/axios')).default
  await expect(api.get(url)).rejects.toBeTruthy()
  expect(seen).not.toBe('')
  expect(localStorage.getItem('inotal_token')).toBe('token-tamu-uji')
  expect(window.location.hash).toBe('')
})

test('path bersegmen "Public" bukan endpoint publik, jadi sesi tetap berakhir', async () => {
  seedSession()
  server.use(http.get('*', () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })))
  const api = (await import('../src/api/axios')).default
  await expect(api.get('/api/Public/homepage/join-cards')).rejects.toBeTruthy()
  expect(window.location.hash).toBe('#login')
  expect(localStorage.getItem('inotal_token')).toBeNull()
})

test('401 pada resource admin tetap mengakhiri sesi dan mengarahkan ke login', async () => {
  seedSession()
  server.use(http.get('*/api/homepage/join-cards', () => HttpResponse.json({ message: 'Sesi kedaluwarsa.' }, { status: 401 })))
  render(<HomepageJoinCardsPage role="admin" />)
  await waitFor(() => expect(window.location.hash).toBe('#login'))
  expect(localStorage.getItem('inotal_token')).toBeNull()
  expect(localStorage.getItem('inotal_user')).toBeNull()
  expect(screen.getByRole('alert').textContent).toContain('Sesi kedaluwarsa.')
})
