import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import TentangPage from '../src/pages/FrontPage/TentangPage'
import * as aboutApi from '../src/api/about'
import * as aboutCardsApi from '../src/api/aboutCards'
import * as aboutIntroApi from '../src/api/aboutIntro'
import * as aboutEmpoweringApi from '../src/api/aboutEmpowering'
import * as pageBannersApi from '../src/api/pageBanners'
import * as statisticsApi from '../src/api/statistics'
import * as joinInvitationApi from '../src/api/joinInvitation'
import { server } from './setup'

const team = [{ id: 1, name: 'Tim dari API', photo_url: '/uploads/tim.png', position: 'Koordinator' }]
const faqs = [{ id: 1, question: 'FAQ dari API?', answer: 'Jawaban dari API.' }]
const videos = [
  { id: 9, title: 'Video terbaru', video_url: 'https://youtu.be/video-baru' },
  { id: 3, title: 'Video lama', video_url: 'https://youtu.be/video-lama' },
]
const highlights = [{ id: 1, icon: 'film', title: 'Highlight dari API', description: 'Uraian highlight.' }]
const defaultDescription = 'Keripitannya kami tampilkan apa adanya: obrolan panjang, request yang berubah, sampai proses panjang yang berakhir sesuai rencana. Video ini rekaman, bukan brosur.'

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  })
  server.use(http.get('*/api/*', () => HttpResponse.json({ success: true, data: null })))
  vi.spyOn(aboutApi, 'getPublicAboutSettingApi').mockResolvedValue({ data: null })
  vi.spyOn(aboutApi, 'getPublicTeamMembersApi').mockResolvedValue({ data: [] })
  vi.spyOn(aboutApi, 'getPublicAboutFAQsApi').mockResolvedValue({ data: [] })
  vi.spyOn(aboutApi, 'getPublicAboutVideosApi').mockResolvedValue({ data: [] })
  vi.spyOn(aboutApi, 'getPublicAboutVideoSettingApi').mockResolvedValue({ data: null })
  vi.spyOn(aboutApi, 'getPublicAboutVideoHighlightsApi').mockResolvedValue({ data: [] })
  vi.spyOn(statisticsApi, 'getPublicStatisticsApi').mockResolvedValue([])
  vi.spyOn(joinInvitationApi, 'getPublicJoinInvitationApi').mockResolvedValue(null)
})

afterEach(() => {
  // Unmount before restoring globals: cleanup also flushes pending React effects.
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

async function settled() {
  await waitFor(() => expect(screen.queryByText('Memuat video profil...')).toBeNull())
  expect(screen.queryByText('Memuat pertanyaan umum...')).toBeNull()
}

test.each([
  ['array', (rows) => rows],
  ['data', (rows) => ({ data: rows })],
  ['data didahulukan atas array luar', (rows) => Object.assign([{ title: 'Jangan pilih array luar' }], { data: rows })],
])('Tentang menerima daftar %s tanpa mengubah urutan video dan filter tim', async (label, wrap) => {
  aboutApi.getPublicTeamMembersApi.mockResolvedValue(wrap([...team, { name: 'Tanpa foto' }, { photo_url: '/uploads/no-name.png' }]))
  aboutApi.getPublicAboutFAQsApi.mockResolvedValue(wrap(faqs))
  aboutApi.getPublicAboutVideosApi.mockResolvedValue(wrap(videos))
  aboutApi.getPublicAboutVideoHighlightsApi.mockResolvedValue(wrap(highlights))
  aboutApi.getPublicAboutSettingApi.mockResolvedValue({ data: { team_title: '  Tim pilihan admin  ' }, team_title: 'Jangan pilih luar' })
  aboutApi.getPublicAboutVideoSettingApi.mockResolvedValue({ data: {
    section_label: '  Dari admin  ', section_title: '  Video pilihan admin  ', section_description: '  Uraian pilihan admin  ',
  } })
  const user = userEvent.setup()
  render(<TentangPage />)
  await settled()
  expect(screen.getByRole('heading', { name: 'Tim pilihan admin' }).textContent).toBe('Tim pilihan admin')
  expect(screen.getByRole('heading', { name: team[0].name })).not.toBeNull()
  expect(screen.queryByText('Tanpa foto')).toBeNull()
  expect(screen.getByAltText(team[0].name).getAttribute('src')).toBe('/uploads/tim.png')
  const faq = screen.getByRole('button', { name: faqs[0].question })
  expect(faq.getAttribute('aria-expanded')).toBe('true')
  expect(faq.querySelector('.lucide-minus')).not.toBeNull()
  expect(screen.getByText(faqs[0].answer)).not.toBeNull()
  expect(screen.getByText('Dari admin')).not.toBeNull()
  expect(screen.getByRole('heading', { name: 'Video pilihan admin' })).not.toBeNull()
  expect(screen.getByText('Uraian pilihan admin')).not.toBeNull()
  expect(screen.getByRole('heading', { name: highlights[0].title })).not.toBeNull()
  expect(screen.getByText(highlights[0].description)).not.toBeNull()
  expect(screen.queryByText('Video lama')).toBeNull()
  expect(screen.queryByTitle('Video terbaru')).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Putar video: Video terbaru' }))
  expect(screen.getByTitle('Video terbaru').getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/video-baru?autoplay=1&rel=0&modestbranding=1')
})

test.each([
  ['null', null],
  ['malformed', { data: { items: [] } }],
])('daftar %s mempertahankan tim contoh dan state kosong FAQ/video/highlight', async (label, response) => {
  aboutApi.getPublicTeamMembersApi.mockResolvedValue(response)
  aboutApi.getPublicAboutFAQsApi.mockResolvedValue(response)
  aboutApi.getPublicAboutVideosApi.mockResolvedValue(response)
  aboutApi.getPublicAboutVideoHighlightsApi.mockResolvedValue(response)
  render(<TentangPage />)
  await settled()
  for (const name of ['Andini Prameswari', 'Bagas Nugraha', 'Citra Maharani', 'Dimas Saputra']) {
    expect(screen.getByRole('heading', { name })).not.toBeNull()
  }
  expect(screen.getByText('Belum ada pertanyaan yang tersedia saat ini.')).not.toBeNull()
  expect(screen.getByText('Video Profil Belum Tersedia')).not.toBeNull()
  expect(screen.queryByText('Rekaman sesi & acara')).toBeNull()
  expect(screen.queryByText('Suara dari mitra')).toBeNull()
})

test.each([
  ['data null', { data: null }],
  ['data kosong', { data: {} }],
  ['teks kosong', { data: { section_label: ' ', section_title: '', section_description: '\n' } }],
  ['setting luar diabaikan', { section_label: 'Abaikan', section_title: 'Abaikan', section_description: 'Abaikan' }],
])('setting video %s mempertahankan teks bawaan persis', async (label, response) => {
  aboutApi.getPublicAboutVideoSettingApi.mockResolvedValue(response)
  render(<TentangPage />)
  await settled()
  expect(screen.getByText('Video Profil')).not.toBeNull()
  expect(screen.getByRole('heading', { name: 'Lihat sendiri bagaimana kolaborasi bekerja.' })).not.toBeNull()
  expect(screen.getByText(defaultDescription)).not.toBeNull()
  expect(screen.queryByText('Abaikan')).toBeNull()
})

test.each([
  ['pesan backend', { response: { data: { message: 'FAQ belum siap' } }, message: 'pesan umum' }, 'FAQ belum siap'],
  ['pesan error', { message: 'Koneksi FAQ terputus' }, 'Koneksi FAQ terputus'],
  ['fallback', {}, 'Gagal memuat pertanyaan FAQ saat ini.'],
])('mixed failure memakai %s FAQ sambil mempertahankan video dan highlight sukses', async (label, failure, expected) => {
  aboutApi.getPublicTeamMembersApi.mockRejectedValue(new Error('tim gagal'))
  aboutApi.getPublicAboutFAQsApi.mockRejectedValue(failure)
  aboutApi.getPublicAboutVideosApi.mockResolvedValue({ data: videos })
  aboutApi.getPublicAboutVideoHighlightsApi.mockResolvedValue({ data: highlights })
  render(<TentangPage />)
  await settled()
  expect(screen.getByText(expected)).not.toBeNull()
  expect(screen.getByRole('heading', { name: 'Andini Prameswari' })).not.toBeNull()
  expect(screen.getByRole('button', { name: 'Putar video: Video terbaru' })).not.toBeNull()
  expect(screen.getByRole('heading', { name: highlights[0].title })).not.toBeNull()
})

test('allSettled menunggu resource terakhir meskipun FAQ sudah sukses dan tim gagal', async () => {
  let resolveVideo
  const pending = new Promise((resolve) => { resolveVideo = resolve })
  aboutApi.getPublicAboutVideosApi.mockReturnValue(pending)
  aboutApi.getPublicAboutFAQsApi.mockResolvedValue({ data: faqs })
  aboutApi.getPublicTeamMembersApi.mockRejectedValue(new Error('tim gagal'))
  render(<TentangPage />)
  await act(async () => {})
  expect(screen.getByText('Memuat pertanyaan umum...')).not.toBeNull()
  expect(screen.queryByRole('button', { name: faqs[0].question })).toBeNull()
  await act(async () => resolveVideo({ data: videos }))
  await settled()
  expect(screen.getByRole('button', { name: faqs[0].question })).not.toBeNull()
  expect(aboutApi.getPublicAboutVideosApi).toHaveBeenCalledTimes(1)
})

test('unmount mengabaikan penyelesaian data Tentang yang terlambat', async () => {
  let resolveVideo
  const pending = new Promise((resolve) => { resolveVideo = resolve })
  aboutApi.getPublicAboutVideosApi.mockReturnValue(pending)
  const { unmount, container } = render(<TentangPage />)
  unmount()
  let reads = 0
  await act(async () => resolveVideo({ get data() { reads += 1; return videos } }))
  expect(reads).toBe(0)
  expect(container.childElementCount).toBe(0)
})

test('statistik mempertahankan threshold dan fallback 1600 ms dengan reduced motion', async () => {
  // Isolate the observer clock from unrelated HTTP/abort timers.
  vi.spyOn(aboutCardsApi, 'getPublicAboutCardsApi').mockResolvedValue([])
  vi.spyOn(aboutIntroApi, 'getPublicAboutIntroApi').mockResolvedValue(null)
  vi.spyOn(aboutEmpoweringApi, 'getPublicAboutEmpoweringApi').mockResolvedValue(null)
  vi.spyOn(pageBannersApi, 'getPublicPageBannerApi').mockResolvedValue(null)
  vi.useFakeTimers()
  const observers = []
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback, options) { this.options = options; observers.push(this) }
    observe(element) { this.element = element }
    disconnect() {}
  })
  vi.stubGlobal('matchMedia', () => ({ matches: true }))
  const raf = []
  vi.stubGlobal('requestAnimationFrame', (callback) => { raf.push(callback); return raf.length })
  vi.stubGlobal('cancelAnimationFrame', vi.fn())
  const { unmount } = render(<TentangPage />)
  try {
    await act(async () => {})
    const stat = observers.find((entry) => entry.options.threshold === 0.35)
    expect(stat).not.toBeUndefined()
    expect(within(stat.element).getByText('0.0')).not.toBeNull()
    act(() => vi.advanceTimersByTime(1599))
    expect(raf).toHaveLength(0)
    act(() => vi.advanceTimersByTime(1))
    expect(raf).toHaveLength(4)
    act(() => raf.forEach((callback) => callback()))
    expect(within(stat.element).getByText('25.5')).not.toBeNull()
    unmount()
    expect(vi.getTimerCount()).toBe(0)
  } finally {
    unmount()
    vi.useRealTimers()
  }
})

test('statistik tim tampil berurutan, memfilter nonaktif, dan membatasi presisi agar tidak crash', async () => {
  statisticsApi.getPublicStatisticsApi.mockResolvedValue([
    { id: 3, title: 'Statistik ketiga', icon: 'TrendingUp', statistic_value: `1.${'1'.repeat(150)}`, display_order: 2 },
    { id: 2, title: 'Statistik kedua', icon: 'createLucideIcon', statistic_value: 'Infinity', display_order: 1 },
    { id: 4, title: 'Statistik nonaktif', statistic_value: '50', is_active: false },
    { id: 5, title: {}, statistic_value: '60' },
  ])
  const { container } = render(<TentangPage />)
  await settled()
  const labels = [...container.querySelectorAll('p')].filter((node) => /^Statistik (kedua|ketiga)$/.test(node.textContent))
  expect(labels.map((node) => node.textContent)).toEqual(['Statistik kedua', 'Statistik ketiga'])
  expect(screen.queryByText('Statistik nonaktif')).toBeNull()
  expect(screen.queryByText('Kolaborasi Dituntaskan')).toBeNull()
  expect(screen.getByText('0.000000')).not.toBeNull()
})

test.each([
  ['/kontak', 'kontak'], ['#partnership', 'partnership'],
])('CTA tim memakai rute internal %s', async (url, target) => {
  joinInvitationApi.getPublicJoinInvitationApi.mockResolvedValue({
    id: 1, section_label: 'Ajakan dari tim', title: 'Judul CTA tim', button_text: 'Tombol CTA tim', button_url: url,
  })
  const onNavigate = vi.fn()
  render(<TentangPage onNavigate={onNavigate} />)
  await settled()
  expect(screen.getByRole('heading', { name: 'Judul CTA tim' })).not.toBeNull()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tombol CTA tim' }))
  expect(onNavigate).toHaveBeenCalledExactlyOnceWith(target)
})

test('CTA eksternal memakai noopener/noreferrer tanpa berpindah route internal', async () => {
  const url = 'https://example.test/bergabung'
  joinInvitationApi.getPublicJoinInvitationApi.mockResolvedValue({
    id: 1, title: 'Ajakan tim', button_text: 'Buka situs tim', button_url: url,
  })
  const open = vi.spyOn(window, 'open').mockImplementation(() => null)
  const onNavigate = vi.fn()
  render(<TentangPage onNavigate={onNavigate} />)
  await settled()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Buka situs tim' }))
  expect(open).toHaveBeenCalledExactlyOnceWith(url, '_blank', 'noopener,noreferrer')
  expect(onNavigate).not.toHaveBeenCalled()
})

test.each(['javascript:alert(1)', 'data:text/html,unsafe', '//example.test/unsafe', '/\\example.test/unsafe'])('CTA tidak menavigasikan URL berbahaya %s', async (url) => {
  joinInvitationApi.getPublicJoinInvitationApi.mockResolvedValue({
    id: 1, title: 'Ajakan tim', button_text: 'Tombol uji URL', button_url: url,
  })
  const open = vi.spyOn(window, 'open').mockImplementation(() => null)
  const onNavigate = vi.fn()
  render(<TentangPage onNavigate={onNavigate} />)
  await settled()
  await userEvent.setup().click(screen.getByRole('button', { name: 'Tombol uji URL' }))
  expect(open).not.toHaveBeenCalled()
  expect(onNavigate).not.toHaveBeenCalled()
})
