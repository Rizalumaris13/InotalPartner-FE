import { StrictMode } from 'react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import LandingPage from '../src/pages/LandingPage'
import * as bannersApi from '../src/api/homepageBanners'
import { server } from './setup'

const slides = [
  { id: 2, order: 2, is_active: true, title: 'Slide kedua', background_image: '/uploads/dua.jpg', buttons: [] },
  { id: 1, order: 1, is_active: true, title: 'Slide pertama', background_image: '/uploads/satu.jpg', buttons: [{ label: 'Buka program', url: '#program' }, { label: ' ', url: '#kosong' }, { label: 'Tidak ada URL', url: '' }] },
  { id: 9, order: 0, is_active: false, title: 'Slide nonaktif', buttons: [] },
  { id: 3, order: 2, is_active: true, title: 'Slide ketiga', buttons: [] },
]

beforeEach(() => {
  vi.useFakeTimers()
  server.use(http.get('*/api/*', () => HttpResponse.json({ success: true, data: [] })))
  vi.spyOn(bannersApi, 'getPublicBannersApi').mockResolvedValue({ data: slides })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function renderLanding(options) {
  let view
  await act(async () => { view = render(<LandingPage />, options) })
  return view
}

function expectSlide(title, index) {
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(title)
  expect(screen.getByRole('button', { name: `Slide ${index}` }).classList.contains('bg-sky-400')).toBe(true)
}

test('hero mengurutkan banner aktif, menyaring CTA kosong dan menjaga kontrol circular/dots', async () => {
  const { container } = await renderLanding()
  expectSlide('Slide pertama', 1)
  expect(screen.queryByText('Slide nonaktif')).toBeNull()
  expect(screen.getByRole('link', { name: 'Buka program' }).getAttribute('href')).toBe('#program')
  expect(screen.queryByRole('link', { name: 'Tidak ada URL' })).toBeNull()
  const backgrounds = [...container.querySelectorAll('section')[0].querySelectorAll('[style*="background-image"]')]
  expect(backgrounds.map((node) => node.style.backgroundImage)).toEqual([
    'url("http://localhost:8080/uploads/satu.jpg")',
    'url("http://localhost:8080/uploads/dua.jpg")',
  ])
  fireEvent.click(screen.getByRole('button', { name: 'Sebelumnya' }))
  expectSlide('Slide ketiga', 3)
  fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
  expectSlide('Slide pertama', 1)
  fireEvent.click(screen.getByRole('button', { name: 'Slide 2' }))
  expectSlide('Slide kedua', 2)
  expect(bannersApi.getPublicBannersApi).toHaveBeenCalledTimes(1)
})

test('hero autoplay 5000 ms tidak di-reset oleh klik manual dan interval dibersihkan saat unmount', async () => {
  const interval = vi.spyOn(window, 'setInterval')
  const clearInterval = vi.spyOn(window, 'clearInterval')
  const { unmount } = await renderLanding()
  expectSlide('Slide pertama', 1)
  act(() => vi.advanceTimersByTime(4999))
  expectSlide('Slide pertama', 1)
  fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
  expectSlide('Slide kedua', 2)
  act(() => vi.advanceTimersByTime(1))
  expectSlide('Slide ketiga', 3)
  act(() => vi.advanceTimersByTime(5000))
  expectSlide('Slide pertama', 1)
  const heroTimerIndex = interval.mock.calls.findIndex(([, delay]) => delay === 5000)
  expect(heroTimerIndex).toBeGreaterThanOrEqual(0)
  const timer = interval.mock.results[heroTimerIndex].value
  unmount()
  expect(clearInterval).toHaveBeenCalledWith(timer)
})

test.each([
  ['kosong', { data: [] }, 'Selamat Datang'],
  ['null', { data: null }, 'Selamat Datang'],
  ['satu', { data: [slides[1]] }, 'Slide pertama'],
  ['array langsung', [slides[1]], 'Slide pertama'],
])('hero %s tidak membuat kontrol atau autoplay yang tidak diperlukan', async (label, response, expected) => {
  bannersApi.getPublicBannersApi.mockResolvedValue(response)
  const interval = vi.spyOn(window, 'setInterval')
  const { unmount } = await renderLanding()
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(expected)
  expect(screen.queryByRole('button', { name: 'Sebelumnya' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Berikutnya' })).toBeNull()
  expect(screen.queryByRole('button', { name: 'Slide 1' })).toBeNull()
  expect(interval.mock.calls.filter(([, delay]) => delay === 5000)).toEqual([])
  unmount()
})

test('hero gagal memuat mempertahankan fallback dan pesan lama', async () => {
  bannersApi.getPublicBannersApi.mockRejectedValue(new Error('Slider sementara gagal'))
  const error = vi.spyOn(console, 'error').mockImplementation(() => {})
  await renderLanding()
  expect(screen.getByRole('heading', { name: 'Slider belum tersedia' })).not.toBeNull()
  expect(screen.getByText('Slider sementara gagal')).not.toBeNull()
  expect(error).toHaveBeenCalledWith('Gagal mengambil slider Landing Page:', expect.any(Error))
})

test('memuat ulang daftar lebih pendek setelah slide terakhir kembali ke slide pertama', async () => {
  const first = await renderLanding()
  fireEvent.click(screen.getByRole('button', { name: 'Slide 3' }))
  expectSlide('Slide ketiga', 3)
  first.unmount()
  bannersApi.getPublicBannersApi.mockResolvedValue({ data: [slides[1]] })
  await renderLanding()
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Slide pertama')
  expect(screen.queryByRole('button', { name: 'Slide 3' })).toBeNull()
})

test('respons banner dari effect lama tidak mengganti daftar yang lebih pendek pada StrictMode', async () => {
  let resolveOld
  bannersApi.getPublicBannersApi
    .mockReturnValueOnce(new Promise((resolve) => { resolveOld = resolve }))
    .mockResolvedValueOnce({ data: [slides[1]] })
  await renderLanding({ wrapper: StrictMode })
  expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Slide pertama')
  await act(async () => resolveOld({ data: slides }))
  expect(screen.queryByRole('button', { name: 'Slide 2' })).toBeNull()
  expect(bannersApi.getPublicBannersApi).toHaveBeenCalledTimes(2)
})

test('Landing tetap memasang satu listener scroll dengan ambang lebih dari 10 tanpa inisialisasi', async () => {
  vi.stubGlobal('scrollY', 100)
  const add = vi.spyOn(window, 'addEventListener')
  const remove = vi.spyOn(window, 'removeEventListener')
  const { unmount } = await renderLanding()
  const navbar = screen.getAllByRole('navigation')[0]
  expect(navbar.classList.contains('bg-transparent')).toBe(true)
  fireEvent.scroll(window)
  expect(navbar.classList.contains('bg-white/95')).toBe(true)
  vi.stubGlobal('scrollY', 10)
  fireEvent.scroll(window)
  expect(navbar.classList.contains('bg-transparent')).toBe(true)
  vi.stubGlobal('scrollY', 11)
  fireEvent.scroll(window)
  expect(navbar.classList.contains('bg-white/95')).toBe(true)
  const listeners = add.mock.calls.filter(([event]) => event === 'scroll')
  expect(listeners).toHaveLength(1)
  expect(listeners[0][2]).toEqual({ passive: true })
  unmount()
  expect(remove).toHaveBeenCalledWith('scroll', listeners[0][1])
})
