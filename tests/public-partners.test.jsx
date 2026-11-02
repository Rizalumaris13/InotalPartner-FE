import { expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import LandingPage from '../src/pages/LandingPage'
import { server } from './setup'

const heading = 'Bergabunglah dengan Ekosistem Kami, Akselerasi Kemitraan Anda!'

function mockLanding(partners) {
  server.use(
    http.get('*/api/public/homepage/banners', () =>
      HttpResponse.json(
        { data: [] },
        { headers: { 'Access-Control-Allow-Origin': 'http://localhost:3000' } },
      ),
    ),
    ...['news', 'events', 'articles'].map((type) =>
      http.get(`*/api/public/${type}`, () =>
        HttpResponse.json({ data: { data: [], total: 0 } }),
      ),
    ),
    http.get('*/api/public/homepage/partners', () =>
      HttpResponse.json({ data: partners }),
    ),
  )
}

test('beranda memakai data mitra aktif dari API dengan urutan dan tautan yang aman', async () => {
  mockLanding([
    {
      id: 1,
      name: 'Mitra Publik Kedua',
      logo_url: '/uploads/kedua.png',
      website_url: 'https://second.example.test',
      sort_order: 2,
      is_active: true,
    },
    {
      id: 2,
      name: 'Mitra Publik Pertama',
      logo_url: '',
      website_url: 'https://first.example.test',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 3,
      name: 'Mitra Nonaktif Uji',
      logo_url: '',
      website_url: '',
      sort_order: 0,
      is_active: false,
    },
  ])
  render(<LandingPage onNavigate={() => {}} />)
  expect(
    await screen.findByRole('link', { name: 'Mitra Publik Pertama' }),
  ).not.toBeNull()
  const region = screen.getByRole('region', { name: heading })
  const links = within(region).getAllByRole('link')
  expect(links.map((link) => link.getAttribute('aria-label'))).toEqual([
    'Mitra Publik Pertama',
    'Mitra Publik Kedua',
  ])
  expect(links[0].getAttribute('href')).toBe('https://first.example.test')
  expect(links[0].getAttribute('rel')).toContain('noopener')
  expect(links[0].getAttribute('target')).toBe('_blank')
  expect(
    within(region)
      .getByRole('img', { name: 'Logo Mitra Publik Kedua' })
      .getAttribute('src'),
  ).toBe('/uploads/kedua.png')
  expect(within(region).queryByText('Mitra Nonaktif Uji')).toBeNull()
  expect(within(region).queryByText('Kementerian Kominfo')).toBeNull()
})
