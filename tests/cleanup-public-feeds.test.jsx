import { afterEach, expect, test, vi } from 'vitest'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import LandingPage from '../src/pages/LandingPage'
import * as postsApi from '../src/api/posts'
import { server } from './setup'

afterEach(() => vi.restoreAllMocks())

function section(name) {
  return within(screen.getByRole('heading', { name, level: 2 }).closest('section'))
}

function emptyOtherResources() {
  server.use(http.get('*/api/*', () => HttpResponse.json(
    { success: true, data: [] },
    { headers: { 'Access-Control-Allow-Origin': '*' } },
  )))
}

const fixtures = {
  news: { id: 1, slug: 'berita-uji', title: 'Berita utama uji', categories: [{ name: 'Kategori utama' }], category: { name: 'Kategori lama' }, excerpt: 'Ringkasan berita.', thumbnail_url: 'uploads/news.jpg', created_at: '2026-09-29T22:30:00Z' },
  events: { id: 2, slug: 'event-uji', title: 'Event uji', event_date: '2026-09-30T12:00:00Z', event_time: '19:45:22', event_location: 'Bandung', thumbnail_url: '/uploads/event.jpg' },
  articles: { id: 3, slug: 'artikel-uji', title: 'Artikel uji', categories: [], category: { name: 'Kategori artikel' }, excerpt: 'Ringkasan artikel.', thumbnail_url: '/uploads/article.jpg', created_at: '2026-10-01T12:00:00Z' },
}

function localDate(iso) {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

test('tiga feed memuat independen, masing-masing sekali dengan parameter dan mapping lama', async () => {
  emptyOtherResources()
  const requests = []
  const resolvers = {}
  for (const resource of ['news', 'events', 'articles']) {
    const pending = new Promise((resolve) => { resolvers[resource] = resolve })
    server.use(http.get(`*/api/public/${resource}`, async ({ request }) => {
      const url = new URL(request.url)
      requests.push(`${resource}${url.search}`)
      await pending
      return HttpResponse.json({ success: true, data: { data: [fixtures[resource]], total: 1, page: 1, limit: resource === 'news' ? 5 : 9 } })
    }))
  }
  render(<LandingPage />)
  expect(section('Informasi & Berita').getByText('Memuat berita...')).not.toBeNull()
  expect(section('Event Update').getByText('Memuat event...')).not.toBeNull()
  expect(section('Article').getByText('Memuat artikel...')).not.toBeNull()
  await waitFor(() => expect(requests.slice().sort()).toEqual(['articles?page=1&limit=9', 'events?page=1&limit=9', 'news?page=1&limit=5']))

  await act(async () => resolvers.news())
  expect(await section('Informasi & Berita').findByRole('heading', { name: fixtures.news.title })).not.toBeNull()
  expect(section('Event Update').getByText('Memuat event...')).not.toBeNull()
  expect(section('Article').getByText('Memuat artikel...')).not.toBeNull()
  expect(section('Informasi & Berita').getByText('Kategori utama')).not.toBeNull()
  expect(section('Informasi & Berita').queryByText('Kategori lama')).toBeNull()
  expect(section('Informasi & Berita').getByText(fixtures.news.excerpt)).not.toBeNull()
  expect(section('Informasi & Berita').getByText(localDate(fixtures.news.created_at))).not.toBeNull()
  expect(section('Informasi & Berita').getByAltText(fixtures.news.title).getAttribute('src')).toBe('/uploads/news.jpg')

  await act(async () => resolvers.events())
  expect(await section('Event Update').findByRole('heading', { name: fixtures.events.title })).not.toBeNull()
  expect(section('Event Update').getByText(`${localDate(fixtures.events.event_date)} · 19:45`)).not.toBeNull()
  expect(section('Event Update').getByText('Bandung')).not.toBeNull()
  expect(section('Event Update').getByAltText(fixtures.events.title).getAttribute('src')).toBe('/uploads/event.jpg')
  expect(section('Article').getByText('Memuat artikel...')).not.toBeNull()

  await act(async () => resolvers.articles())
  expect(await section('Article').findByRole('heading', { name: fixtures.articles.title })).not.toBeNull()
  expect(section('Article').getByText('Kategori artikel')).not.toBeNull()
  expect(section('Article').getByText(fixtures.articles.excerpt)).not.toBeNull()
  expect(section('Article').getByText(localDate(fixtures.articles.created_at))).not.toBeNull()
  expect(section('Article').getByAltText(fixtures.articles.title).getAttribute('src')).toBe('/uploads/article.jpg')
  expect(requests).toHaveLength(3)
})

test.each([
  ['news', 'Informasi & Berita', 'berita'],
  ['events', 'Event Update', 'event'],
  ['articles', 'Article', 'artikel'],
])('kegagalan %s tidak menahan feed lain dan memakai pesan backend persis', async (resource, heading, label) => {
  emptyOtherResources()
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  for (const feed of ['news', 'events', 'articles']) {
    server.use(http.get(`*/api/public/${feed}`, () => feed === resource
      ? HttpResponse.json({ message: `Pesan backend ${label}` }, { status: 500 })
      : HttpResponse.json({ success: true, data: { data: [fixtures[feed]] } })))
  }
  render(<LandingPage />)
  expect(await section(heading).findByText(`Pesan backend ${label}`)).not.toBeNull()
  expect(section(heading).queryByRole('heading', { name: fixtures[resource].title })).toBeNull()
  for (const feed of ['news', 'events', 'articles'].filter((feed) => feed !== resource)) {
    expect(await screen.findByRole('heading', { name: fixtures[feed].title })).not.toBeNull()
  }
  expect(log).toHaveBeenCalledWith(`Gagal mengambil ${label}:`, expect.any(Error))
})

test.each([
  ['news', 'Informasi & Berita', 'berita'],
  ['events', 'Event Update', 'event'],
  ['articles', 'Article', 'artikel'],
])('kegagalan %s tanpa message memakai fallback, bukan error.message axios', async (resource, heading, label) => {
  emptyOtherResources()
  vi.spyOn(console, 'error').mockImplementation(() => {})
  server.use(http.get(`*/api/public/${resource}`, () => HttpResponse.json({}, { status: 500 })))
  render(<LandingPage />)
  expect(await section(heading).findByText(`Gagal mengambil ${label}`)).not.toBeNull()
  expect(section(heading).queryByText(/status code/)).toBeNull()
})

test.each([
  ['kosong dua tingkat', { data: { data: [] } }],
  ['array satu tingkat tidak dipakai', { data: [{ title: 'Tidak dipakai' }] }],
  ['data null', { data: null }],
])('envelope %s mempertahankan state kosong setiap feed', async (label, response) => {
  emptyOtherResources()
  for (const resource of ['news', 'events', 'articles']) {
    server.use(http.get(`*/api/public/${resource}`, () => HttpResponse.json(response)))
  }
  render(<LandingPage />)
  for (const [heading, name] of [['Informasi & Berita', 'berita'], ['Event Update', 'event'], ['Article', 'artikel']]) {
    expect(await section(heading).findByText(`Belum ada ${name} yang dipublikasikan.`)).not.toBeNull()
    expect(section(heading).queryByText('Tidak dipakai')).toBeNull()
  }
})

test('field kosong mempertahankan kategori default, gambar kosong, dan waktu event tersembunyi tanpa tanggal', async () => {
  emptyOtherResources()
  for (const resource of ['news', 'events', 'articles']) {
    server.use(http.get(`*/api/public/${resource}`, () => HttpResponse.json({ data: { data: [{ id: 1, title: `${resource} minimal`, event_time: '19:45:22' }] } })))
  }
  render(<LandingPage />)
  for (const [heading, resource] of [['Informasi & Berita', 'news'], ['Event Update', 'events'], ['Article', 'articles']]) {
    const scope = section(heading)
    await scope.findByRole('heading', { name: `${resource} minimal` })
    expect(scope.getByText('Tidak ada gambar')).not.toBeNull()
  }
  expect(section('Informasi & Berita').getByText('Berita')).not.toBeNull()
  expect(section('Article').getByText('Article', { selector: 'p' })).not.toBeNull()
  expect(section('Event Update').queryByText(/19:45/)).toBeNull()
})

test('envelope dua tingkat non-array tetap menjadi error per resource, bukan konten contoh', async () => {
  emptyOtherResources()
  const log = vi.spyOn(console, 'error').mockImplementation(() => {})
  for (const resource of ['news', 'events', 'articles']) {
    server.use(http.get(`*/api/public/${resource}`, () => HttpResponse.json({ data: { data: {} } })))
  }
  render(<LandingPage />)
  for (const [heading, label] of [['Informasi & Berita', 'berita'], ['Event Update', 'event'], ['Article', 'artikel']]) {
    expect(await section(heading).findByText(`Gagal mengambil ${label}`)).not.toBeNull()
    expect(log).toHaveBeenCalledWith(`Gagal mengambil ${label}:`, expect.any(TypeError))
  }
})

test('penyelesaian feed setelah unmount tidak mengubah halaman baru atau membuat request ulang', async () => {
  emptyOtherResources()
  const resolvers = []
  const loaders = ['getPublicNewsApi', 'getPublicEventsApi', 'getPublicArticlesApi']
  for (const loader of loaders) {
    const pending = new Promise((resolve) => { resolvers.push(resolve) })
    vi.spyOn(postsApi, loader).mockReturnValue(pending)
  }
  const { unmount, container } = render(<LandingPage />)
  unmount()
  await act(async () => resolvers.forEach((resolve) => resolve({ data: { data: [fixtures.news] } })))
  expect(container.childElementCount).toBe(0)
  for (const loader of loaders) expect(postsApi[loader]).toHaveBeenCalledTimes(1)
})
