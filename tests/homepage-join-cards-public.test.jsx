import { expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import LandingPage from '../src/pages/LandingPage'
import { server } from './setup'

const cards = Array.from({ length: 6 }, (_, index) => ({
  position: index + 1,
  title: `Judul kartu ${String(index + 1).padStart(2, '0')} dari admin`,
  description: `Deskripsi kartu ${index + 1} yang disimpan admin.`,
}))

test('Beranda membaca judul/deskripsi keenam kartu dan mengurutkannya menurut posisi', async () => {
  let reads = 0
  server.use(
    http.get('*/api/public/homepage/join-cards', () => {
      reads += 1
      return HttpResponse.json({ success: true, data: [...cards].reverse() })
    }),
    http.get('*/api/*', () => HttpResponse.json(
      { success: true, data: [], meta: { total: 0 } },
      { headers: { 'Access-Control-Allow-Origin': '*' } },
    )),
  )
  render(<LandingPage />)
  const section = within(screen.getByRole('heading', { name: 'Saatnya Bersama Beraksi' }).closest('section'))
  await section.findByRole('heading', { name: cards[0].title })
  expect(section.getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(cards.map((card) => card.title))
  for (const card of cards) {
    expect(section.getByText(card.description)).not.toBeNull()
    expect(section.getByText(String(card.position).padStart(2, '0'))).not.toBeNull()
  }
  expect(section.getAllByRole('img')).toHaveLength(3)
  expect(section.getByText('Indonesia butuh pemuda generasi masa depan emas 2045.')).not.toBeNull()
  expect(reads).toBe(1)
})
