import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import BeritaPage from '../src/pages/FrontPage/BeritaPage'
import DetailBeritaPage from '../src/pages/FrontPage/DetailBeritaPage'
import { server } from './setup'

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  })
})
afterEach(() => vi.unstubAllGlobals())

const news = {
  id: 1, slug: 'berita-uji', title: 'Berita uji lintas hari WIB',
  published_at: '2026-09-29T22:30:00Z', created_at: '2026-01-01T00:00:00Z',
  view_count: 1200, category: { id: 1, name: 'Teknologi' }, tags: [{ id: 1, name: 'AI' }],
  content: '<p>Isi berita uji.</p>',
}

function handlers(items) {
  const requests = []
  server.use(
    http.get('*/api/public/news/:slug', ({ params }) => {
      requests.push(params.slug)
      return HttpResponse.json({ success: true, data: news })
    }),
    http.get('*/api/public/news', () => HttpResponse.json({ success: true, data: { data: items } })),
    http.get('*/api/public/popular/news', () => HttpResponse.json({ success: true, data: { data: [news] } })),
    http.get('*/api/public/page-banners/:page', () => HttpResponse.json({ success: true, data: null })),
  )
  return requests
}

test('daftar berita mempertahankan tanggal/waktu WIB, view, h-full dan navigasi slug', async () => {
  handlers([news])
  const navigate = vi.fn()
  const user = userEvent.setup()
  render(<BeritaPage onNavigate={navigate} />)
  const headings = await screen.findAllByRole('heading', { name: news.title })
  const card = headings[0].closest('article')
  expect(within(card).getByText('30 September 2026')).not.toBeNull()
  expect(within(card).getByText('05.30')).not.toBeNull()
  expect(screen.getAllByText(/1\.200/).length).toBeGreaterThan(0)
  expect(card.parentElement.classList.contains('h-full')).toBe(true)
  await user.click(card)
  expect(navigate).toHaveBeenCalledWith('berita/berita-uji')
})

test('detail memilih kategori sama lalu bonus tag dan popularitas tanpa mengulang request detail', async () => {
  const items = [
    news,
    { id: 2, slug: 'satu', title: 'Kategori sama dengan tag', category_id: 1, tags: [{ slug: 'ai' }], view_count: 2 },
    { id: 3, slug: 'dua', title: 'Kategori sama populer', category_id: 1, tags: [], view_count: 2000 },
    { id: 4, slug: 'tiga', title: 'Kategori sama lainnya', category_id: 1, tags: [], view_count: 1 },
    { id: 5, slug: 'luar', title: 'Kategori lain amat populer', category_id: 2, tags: [{ id: 1 }], view_count: 999999 },
  ]
  const requests = handlers(items)
  const navigate = vi.fn()
  const user = userEvent.setup()
  render(<DetailBeritaPage slug={news.slug} onNavigate={navigate} />)
  await screen.findByRole('heading', { name: news.title })
  expect(screen.getByText('30 September 2026')).not.toBeNull()
  expect(screen.getByText('05.30')).not.toBeNull()
  expect(screen.getByText('1.200 views')).not.toBeNull()
  expect(screen.getByText('Isi berita uji.')).not.toBeNull()
  const sidebar = screen.getByRole('complementary')
  expect(within(sidebar).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent.trim()))
    .toEqual(['Kategori sama dengan tag', 'Kategori sama populer', 'Kategori sama lainnya'])
  await user.click(within(sidebar).getAllByRole('button')[0])
  expect(navigate).toHaveBeenCalledWith('berita/satu')
  expect(requests).toEqual([news.slug])
})

test('detail tanpa kategori sama memakai popularitas murni, bukan skor tag', async () => {
  handlers([
    { id: 2, title: 'Paling ramai', category_id: 2, view_count: 90 },
    { id: 3, title: 'Ramai kedua', category_id: 2, view_count: 70 },
    { id: 4, title: 'Tag cocok kurang ramai', category_id: 3, tags: [{ id: 1 }], view_count: 2 },
    { id: 5, title: 'Ramai ketiga', category_id: 3, view_count: 40 },
  ])
  render(<DetailBeritaPage slug={news.slug} />)
  await screen.findByRole('heading', { name: news.title })
  expect(within(screen.getByRole('complementary')).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent.trim()))
    .toEqual(['Paling ramai', 'Ramai kedua', 'Ramai ketiga'])
})
