import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import PublicNavbar from '../src/components/PublicNavbar'
import PublicFooter from '../src/components/PublicFooter'
import ArtikelPage from '../src/pages/FrontPage/ArtikelPage'
import BeritaPage from '../src/pages/FrontPage/BeritaPage'
import DetailBeritaPage from '../src/pages/FrontPage/DetailBeritaPage'
import EventPage from '../src/pages/FrontPage/EventPage'
import KontakPage from '../src/pages/FrontPage/KontakPage'
import TentangPage from '../src/pages/FrontPage/TentangPage'
import { server } from './setup'

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  })
})

afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test.each(['artikel', 'berita', 'event', 'kontak', 'tentang'])('navbar %s tetap solid dengan menu terbuka dan semua nilai scrolled', async (activePage) => {
  const navigate = vi.fn()
  const user = userEvent.setup()
  const { rerender } = render(<PublicNavbar activePage={activePage} onNavigate={navigate} />)
  const navbar = screen.getByRole('navigation')
  const initialClass = navbar.className
  expect(navbar.classList.contains('bg-white/95')).toBe(true)
  for (const scrolled of [false, true, undefined]) {
    rerender(<PublicNavbar activePage={activePage} onNavigate={navigate} scrolled={scrolled} />)
    expect(navbar.className).toBe(initialClass)
  }
  await user.click(screen.getByRole('button', { name: 'Toggle menu' }))
  expect(navbar.className).toBe(initialClass)
  await user.click(screen.getAllByRole('button', { name: 'Kontak' }).at(-1))
  expect(navigate).toHaveBeenCalledWith('kontak')
  expect(screen.getAllByRole('button', { name: 'Kontak' })).toHaveLength(1)
  expect(navbar.className).toBe(initialClass)
})

test('navbar Landing tetap transparan sebelum scroll, solid saat scroll atau menu terbuka', async () => {
  const user = userEvent.setup()
  const { rerender } = render(<PublicNavbar activePage="landing" scrolled={false} />)
  const navbar = screen.getByRole('navigation')
  expect(navbar.classList.contains('bg-transparent')).toBe(true)
  await user.click(screen.getByRole('button', { name: 'Toggle menu' }))
  expect(navbar.classList.contains('bg-white/95')).toBe(true)
  await user.click(screen.getByRole('button', { name: 'Toggle menu' }))
  expect(navbar.classList.contains('bg-transparent')).toBe(true)
  rerender(<PublicNavbar activePage="landing" scrolled />)
  expect(navbar.classList.contains('bg-white/95')).toBe(true)
})

test('kolom footer mempertahankan urutan, href, preventDefault, dan label kapital untuk navigasi', () => {
  const navigate = vi.fn()
  render(<PublicFooter onNavigate={navigate} />)
  const footer = screen.getByRole('contentinfo')
  const columns = within(footer).getAllByRole('heading', { level: 4 })
  expect(columns.map((column) => column.textContent.trim())).toEqual(['Profil', 'Partnership'])
  const labels = [
    ['Tentang', 'Visi Misi', 'Kemitraan', 'Event'],
    ['Bergabung Sekarang', 'InotalHub Tech', 'Group & Div', 'Kontak'],
  ]
  columns.forEach((heading, index) => {
    const links = within(heading.parentElement).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(labels[index])
    for (const link of links) {
      expect(link.getAttribute('href')).toBe('#')
      expect(fireEvent.click(link)).toBe(false)
      expect(navigate).toHaveBeenLastCalledWith(link.textContent)
    }
  })
  expect(navigate.mock.calls.map(([label]) => label)).toEqual(labels.flat())
  const social = within(footer).getByRole('navigation', { name: 'Media sosial' })
  expect(social.parentElement.lastElementChild).toBe(social)
})

const pages = [
  ['artikel', ArtikelPage],
  ['berita', BeritaPage],
  ['detail berita', DetailBeritaPage],
  ['event', EventPage],
  ['kontak', KontakPage],
  ['tentang', TentangPage],
]

test.each(pages)('halaman %s tetap solid setelah scroll tanpa memasang listener scroll yang tak terpakai', async (label, Page) => {
  let reads = 0
  server.use(http.get('*/api/*', () => {
    reads += 1
    return HttpResponse.json({ success: true, data: [] })
  }))
  const addListener = vi.spyOn(window, 'addEventListener')
  const { unmount } = render(<Page slug="uji" onNavigate={() => {}} />)
  await waitFor(() => expect(reads).toBeGreaterThan(0))
  const navbar = screen.getAllByRole('navigation')[0]
  const classBefore = navbar.className
  fireEvent.scroll(window)
  expect(navbar.className).toBe(classBefore)
  expect(navbar.classList.contains('bg-white/95')).toBe(true)
  const scrollListeners = addListener.mock.calls.filter(([event]) => event === 'scroll')
  unmount()
  expect(scrollListeners).toEqual([])
})
