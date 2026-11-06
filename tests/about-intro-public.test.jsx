import { beforeAll, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { delay, http, HttpResponse } from 'msw'
import AboutIntroSection from '../src/components/AboutIntroSection'
import TentangPage from '../src/pages/FrontPage/TentangPage'
import { DEFAULT_ABOUT_INTRO } from '../src/data/aboutIntro'
import { server } from './setup'

// jsdom tidak punya IntersectionObserver; animasi reveal cukup dianggap terlihat.
beforeAll(() => {
  if (!globalThis.IntersectionObserver) {
    globalThis.IntersectionObserver = class {
      constructor(callback) { this.callback = callback }
      observe(element) { this.callback([{ isIntersecting: true, target: element }]) }
      disconnect() {}
      unobserve() {}
    }
  }
})

const edited = {
  ...DEFAULT_ABOUT_INTRO,
  eyebrow: 'Label dari admin',
  headline: 'Judul utama versi admin untuk',
  headline_accent: 'dampak yang nyata.',
  photo_url: '/uploads/intro-baru.png',
  photo_alt: 'Foto tim versi admin',
  progress_title: 'Progres Program',
  progress: [{ label: 'Program berjalan', percent: 64 }, { label: 'Mitra puas', percent: 97 }],
  mission: {
    title: 'Misi Baru',
    description: 'Deskripsi misi dari admin.',
    items: ['Poin misi satu', 'Poin misi dua', 'Poin misi tiga'],
  },
  vision: {
    title: 'Visi Baru',
    description: 'Deskripsi visi dari admin.',
    items: ['Poin visi satu', 'Poin visi dua', 'Poin visi tiga'],
  },
  cta_label: 'Lihat Program Terbaru',
  cta_target: 'event',
}

test('komponen intro merender semua teks, foto, progres, dan meneruskan klik tombol', async () => {
  const navigate = vi.fn()
  const user = userEvent.setup()
  render(<AboutIntroSection intro={edited} onNavigate={navigate} animate={false} />)
  expect(screen.getByText(edited.eyebrow)).not.toBeNull()
  expect(screen.getByRole('heading', { level: 2 }).textContent).toContain(edited.headline)
  expect(screen.getByRole('heading', { level: 2 }).textContent).toContain(edited.headline_accent)
  const photo = screen.getByAltText(edited.photo_alt)
  expect(photo.getAttribute('src')).toBe(edited.photo_url)
  expect(screen.getByText(edited.progress_title)).not.toBeNull()
  for (const row of edited.progress) {
    expect(screen.getByText(row.label)).not.toBeNull()
    expect(screen.getByText(`${row.percent}%`)).not.toBeNull()
  }
  for (const card of [edited.mission, edited.vision]) {
    expect(screen.getByRole('heading', { level: 3, name: card.title })).not.toBeNull()
    expect(screen.getByText(card.description)).not.toBeNull()
    for (const item of card.items) expect(screen.getByText(item)).not.toBeNull()
  }
  await user.click(screen.getByRole('button', { name: new RegExp(edited.cta_label) }))
  expect(navigate).toHaveBeenCalledWith('event')
})

test('halaman Tentang memakai data intro dari resource publik', async () => {
  let reads = 0
  server.use(
    http.get('*/api/public/about/intro', () => { reads += 1; return HttpResponse.json({ success: true, data: edited }) }),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  render(<TentangPage onNavigate={() => {}} />)
  await waitFor(() => expect(reads).toBe(1))
  expect(await screen.findByText(edited.eyebrow)).not.toBeNull()
  const heading = screen.getByRole('heading', { level: 2, name: new RegExp(edited.headline) })
  expect(heading.textContent).toContain(edited.headline_accent)
  expect(screen.getByAltText(edited.photo_alt).getAttribute('src')).toBe(edited.photo_url)
  expect(screen.getByText(edited.progress_title)).not.toBeNull()
  expect(screen.getByText('Mitra puas')).not.toBeNull()
  expect(screen.getByText('97%')).not.toBeNull()
  expect(screen.getByRole('heading', { level: 3, name: 'Misi Baru' })).not.toBeNull()
  expect(screen.getByText('Poin visi tiga')).not.toBeNull()
  expect(screen.getByRole('button', { name: new RegExp(edited.cta_label) })).not.toBeNull()
})

test.each([
  ['404', () => HttpResponse.json({ message: 'Belum ada.' }, { status: 404 })],
  ['500', () => HttpResponse.json({ message: 'Server error.' }, { status: 500 })],
  ['respons invalid', () => HttpResponse.json({ success: true, data: { eyebrow: 'x' } })],
  ['null', () => HttpResponse.json({ success: true, data: null })],
])('respons publik %s menampilkan teks bawaan, bukan halaman kosong', async (label, handler) => {
  server.use(
    http.get('*/api/public/about/intro', handler),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  render(<TentangPage onNavigate={() => {}} />)
  expect(await screen.findByText(DEFAULT_ABOUT_INTRO.eyebrow)).not.toBeNull()
  expect(screen.getByRole('heading', { level: 3, name: DEFAULT_ABOUT_INTRO.mission.title })).not.toBeNull()
  expect(screen.getByText(DEFAULT_ABOUT_INTRO.mission.items[0])).not.toBeNull()
  expect(screen.getByText(DEFAULT_ABOUT_INTRO.progress_title)).not.toBeNull()
})

test('respons invalid yang datang terlambat tetap jatuh ke teks bawaan setelah respons selesai', async () => {
  let settled = 0
  server.use(
    http.get('*/api/public/about/intro', async () => {
      await delay(60)
      settled += 1
      return HttpResponse.json({ success: true, data: { eyebrow: 'rusak' } })
    }),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  render(<TentangPage onNavigate={() => {}} />)
  expect(screen.getByText(DEFAULT_ABOUT_INTRO.eyebrow)).not.toBeNull()
  await waitFor(() => expect(settled).toBe(1))
  expect(screen.getByText(DEFAULT_ABOUT_INTRO.eyebrow)).not.toBeNull()
  expect(screen.queryByText('rusak')).toBeNull()
  expect(screen.getByText(DEFAULT_ABOUT_INTRO.mission.items[0])).not.toBeNull()
})
