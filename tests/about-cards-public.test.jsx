import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import TentangPage from '../src/pages/FrontPage/TentangPage'
import PublicAboutCards from '../src/components/PublicAboutCards'
import { server } from './setup'

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
})
afterEach(() => vi.unstubAllGlobals())

test('halaman Tentang membaca kartu dari API dan mengikuti posisi admin', async () => {
  const cards = [
    {
      id: 7,
      title: 'Kartu Kedua Uji',
      description: 'Deskripsi kartu kedua dari admin.',
      icon: 'award',
      url: 'https://example.test/tujuan',
      sort_order: 2,
    },
    {
      id: 8,
      title: 'Kartu Pertama Uji',
      description: 'Deskripsi kartu pertama dari admin.',
      icon: 'lightbulb',
      url: '#program',
      sort_order: 1,
    },
  ]
  server.use(
    http.get('*/api/public/about/cards', () =>
      HttpResponse.json({ success: true, data: cards }),
    ),
  )
  render(<TentangPage onNavigate={() => {}} />)

  expect(
    await screen.findByRole('heading', { name: 'Kartu Pertama Uji' }),
  ).not.toBeNull()
  const section = screen
    .getByRole('heading', { name: 'Memberdayakan Bisnis dengan Keahlian.' })
    .closest('section')
  const articles = within(section).getAllByRole('article')
  expect(
    articles.map((article) => within(article).getByRole('heading').textContent),
  ).toEqual(['Kartu Pertama Uji', 'Kartu Kedua Uji'])
  expect(within(articles[0]).getByText('01')).not.toBeNull()
  expect(within(articles[1]).getByText('02')).not.toBeNull()
  expect(within(articles[0]).getByRole('link').getAttribute('href')).toBe(
    '#program',
  )
  expect(within(articles[1]).getByRole('link').getAttribute('target')).toBe(
    '_blank',
  )
  expect(within(articles[1]).getByRole('link').getAttribute('rel')).toContain(
    'noopener',
  )
})

test('kartu lokal mengikuti navigasi halaman yang dipilih admin', async () => {
  const navigate = vi.fn()
  server.use(
    http.get('*/api/public/about/cards', () =>
      HttpResponse.json({
        success: true,
        data: [
          {
            id: 1,
            title: 'Kartu Navigasi',
            description: 'Deskripsi navigasi dari admin.',
            icon: 'handshake',
            url: '/#partnership',
            sort_order: 1,
          },
        ],
      }),
    ),
  )
  render(<PublicAboutCards onNavigate={navigate} />)
  const link = await screen.findByRole('link', {
    name: 'Selengkapnya: Kartu Navigasi',
  })
  await userEvent.setup().click(link)
  expect(navigate).toHaveBeenCalledWith('partnership')
  expect(link.getAttribute('target')).toBeNull()
})

test('respons publik kosong tidak menghidupkan kartu contoh', async () => {
  server.use(
    http.get('*/api/public/about/cards', () =>
      HttpResponse.json({ success: true, data: [] }),
    ),
  )
  render(<PublicAboutCards />)
  expect(
    await screen.findByText('Belum ada kartu pada bagian ini.'),
  ).not.toBeNull()
  expect(screen.queryByRole('article')).toBeNull()
  expect(screen.queryByText('Solusi Terukur')).toBeNull()
})

test('404 publik menampilkan pratinjau kartu lama dengan label jelas', async () => {
  server.use(
    http.get(
      '*/api/public/about/cards',
      () => new HttpResponse(null, { status: 404 }),
    ),
  )
  render(<PublicAboutCards />)
  expect(await screen.findByText(/Pratinjau kartu lama/)).not.toBeNull()
  expect(screen.getAllByRole('article')).toHaveLength(3)
  expect(
    screen
      .getByRole('link', { name: 'Selengkapnya: Solusi Terukur' })
      .getAttribute('href'),
  ).toBe('#program')
})

test('error publik tidak ditutupi contoh dan Coba Lagi membaca data baru', async () => {
  server.use(
    http.get('*/api/public/about/cards', () =>
      HttpResponse.json(
        { success: false, message: 'Backend sedang bermasalah.' },
        { status: 500 },
      ),
    ),
  )
  render(<PublicAboutCards />)
  expect(await screen.findByRole('alert')).not.toBeNull()
  expect(screen.queryByRole('article')).toBeNull()
  expect(screen.queryByText('Solusi Terukur')).toBeNull()
  server.use(
    http.get('*/api/public/about/cards', () =>
      HttpResponse.json({
        success: true,
        data: [
          {
            id: 1,
            title: 'Kartu Setelah Retry',
            description: 'Deskripsi setelah muat ulang.',
            icon: 'users',
            url: '#kontak',
            sort_order: 1,
          },
        ],
      }),
    ),
  )
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Coba Lagi' }))
  expect(
    await screen.findByRole('heading', { name: 'Kartu Setelah Retry' }),
  ).not.toBeNull()
})

test('URL berbahaya dari API tidak dirender menjadi tautan', async () => {
  server.use(
    http.get('*/api/public/about/cards', () =>
      HttpResponse.json({
        success: true,
        data: [
          {
            id: 1,
            title: 'Kartu Invalid',
            description: 'Deskripsi kartu berbahaya.',
            icon: 'users',
            url: 'javascript:alert(1)',
            sort_order: 1,
          },
        ],
      }),
    ),
  )
  render(<PublicAboutCards />)
  expect(await screen.findByRole('alert')).not.toBeNull()
  expect(screen.queryByRole('link')).toBeNull()
})

test('semua kartu API tampil termasuk kartu keempat dan konten tetap teks biasa', async () => {
  const cards = Array.from({ length: 4 }, (_, index) => ({
    id: index + 1,
    title: `Kartu ${index + 1} <img>`,
    description: '<script>alert(1)</script> bukan HTML.',
    icon: 'globe',
    url: '#kontak',
    sort_order: index + 1,
  }))
  server.use(
    http.get('*/api/public/about/cards', () =>
      HttpResponse.json({ success: true, data: cards }),
    ),
  )
  const { container } = render(<PublicAboutCards />)
  expect(
    await screen.findByRole('heading', { name: 'Kartu 4 <img>' }),
  ).not.toBeNull()
  expect(screen.getAllByRole('article')).toHaveLength(4)
  expect(screen.getAllByRole('link')).toHaveLength(cards.length)
  expect(screen.getByText('04')).not.toBeNull()
  expect(container.querySelector('script,img')).toBeNull()
})
