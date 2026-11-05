import { expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import LandingPage from '../src/pages/LandingPage'
import { server } from './setup'

const images = {
  top_left_url: '/uploads/kolase-kiri-baru.png',
  center_url: '/uploads/kolase-tengah-baru.webp',
  bottom_right_url: '/uploads/kolase-kanan-baru.jpg',
}
const positions = [
  ['Tim diskusi', 'top_left_url'],
  ['Kolaborasi', 'center_url'],
  ['Kemitraan', 'bottom_right_url'],
]

// API lain hanya fixture kosong; tidak ada request ke backend/database asli.
test('Beranda memakai tiga foto kolase admin tanpa mengubah enam kartu dan teks Mengapa Bergabung', async () => {
  let imageReads = 0
  server.use(
    http.get('*/api/public/homepage/join-images', () => {
      imageReads += 1
      return HttpResponse.json({ success: true, data: images })
    }),
    http.get('*/api/*', () => HttpResponse.json(
      { success: true, data: [], meta: { total: 0 } },
      { headers: { 'Access-Control-Allow-Origin': '*' } },
    )),
  )
  render(<LandingPage />)
  const section = screen.getByRole('heading', { name: 'Saatnya Bersama Beraksi' }).closest('section')
  const content = within(section)
  for (const [alt, key] of positions) {
    await waitFor(() => expect(content.getByAltText(alt).getAttribute('src')).toBe(images[key]))
  }
  expect(imageReads).toBe(1)
  expect(content.getByText('Mengapa Bergabung')).not.toBeNull()
  expect(content.getByText('Indonesia butuh pemuda generasi masa depan emas 2045.')).not.toBeNull()
  expect(content.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
    'Dunia Cepat Berubah',
    'Blue Ocean',
    'Ekonomi Inovasi Bikin Aksi',
    'Momentum Pergerakan',
    'Potensi Bangsa',
    'Investasi Masa Depan',
  ])
  expect(content.getByAltText('Tim diskusi').classList.contains('-rotate-6')).toBe(true)
  expect(content.getByAltText('Kemitraan').classList.contains('rotate-6')).toBe(true)
  expect(content.getByAltText('Kolaborasi').classList.contains('z-20')).toBe(true)
})

test('respons publik berskema huruf besar dirender sebagai URL absolut, bukan path rusak', async () => {
  server.use(
    http.get('*/api/public/homepage/join-images', () => HttpResponse.json({
      success: true,
      data: {
        top_left_url: 'HTTPS://images.example.test/kiri.png',
        center_url: 'HTTP://images.example.test/tengah.png',
        bottom_right_url: '/uploads/kanan.png',
      },
    })),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  render(<LandingPage />)
  const section = screen.getByRole('heading', { name: 'Saatnya Bersama Beraksi' }).closest('section')
  const content = within(section)
  await waitFor(() => expect(content.getByAltText('Tim diskusi').getAttribute('src')).toBe('https://images.example.test/kiri.png'))
  expect(content.getByAltText('Kolaborasi').getAttribute('src')).toBe('http://images.example.test/tengah.png')
  expect(content.getByAltText('Kemitraan').getAttribute('src')).toBe('/uploads/kanan.png')
})
