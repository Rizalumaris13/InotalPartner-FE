import { beforeAll, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import DashboardPage from '../src/pages/DashboardPage'
import { DEFAULT_ABOUT_INTRO } from '../src/data/aboutIntro'
import { server } from './setup'

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

vi.mock('../src/components/MonthlyActivityChart', () => ({ default: () => null }))
vi.mock('../src/components/ServiceDistributionChart', () => ({ default: () => null }))

const admin = { role: 'admin', full_name: 'Admin Uji Intro' }

const open = async (record = DEFAULT_ABOUT_INTRO) => {
  localStorage.setItem('inotal_user', JSON.stringify(admin))
  const user = userEvent.setup()
  render(<DashboardPage onNavigate={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'About', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Intro Tentang', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Intro & Misi Visi', exact: true }))
  const form = await screen.findByRole('form', { name: 'Intro Tentang' })
  return { form, user, record: () => record }
}

test('admin membuka Intro Tentang, melihat isi tersimpan, dan label breadcrumb benar', async () => {
  server.use(http.get('*/api/about/intro', () => HttpResponse.json({ success: true, data: DEFAULT_ABOUT_INTRO })))
  const { form } = await open()
  expect(screen.getByText('About / Intro Tentang / Intro & Misi Visi')).not.toBeNull()
  expect(within(form).getByLabelText('Label kecil').value).toBe(DEFAULT_ABOUT_INTRO.eyebrow)
  expect(within(form).getByLabelText('Judul utama').value).toBe(DEFAULT_ABOUT_INTRO.headline)
  expect(within(form).getByLabelText('Judul misi').value).toBe(DEFAULT_ABOUT_INTRO.mission.title)
  expect(within(form).getByLabelText('Poin visi 3').value).toBe(DEFAULT_ABOUT_INTRO.vision.items[2])
  expect(within(form).getByLabelText('Halaman tujuan tombol').value).toBe('program')
})

test('admin mengubah seluruh bagian, pratinjau ikut berubah, lalu tersimpan dan terbaca ulang', async () => {
  let record = DEFAULT_ABOUT_INTRO
  let writes = 0
  let reads = 0
  let payload
  server.use(
    http.get('*/api/about/intro', () => { reads += 1; return HttpResponse.json({ success: true, data: record }) }),
    http.put('*/api/about/intro', async ({ request }) => {
      writes += 1
      payload = await request.json()
      record = payload
      return HttpResponse.json({ success: true, data: payload })
    }),
  )
  const { form, user } = await open()

  await user.clear(within(form).getByLabelText('Label kecil'))
  await user.type(within(form).getByLabelText('Label kecil'), 'Kenal Kami Sekarang')
  await user.clear(within(form).getByLabelText('Judul utama'))
  await user.type(within(form).getByLabelText('Judul utama'), 'Bergerak bersama untuk')
  await user.clear(within(form).getByLabelText('Judul aksen (warna biru)'))
  await user.type(within(form).getByLabelText('Judul aksen (warna biru)'), 'hasil yang nyata.')
  await user.clear(within(form).getByLabelText('URL foto intro'))
  await user.type(within(form).getByLabelText('URL foto intro'), '/uploads/intro-admin.png')
  await user.clear(within(form).getByLabelText('Teks alternatif foto'))
  await user.type(within(form).getByLabelText('Teks alternatif foto'), 'Foto dari admin')
  await user.clear(within(form).getByLabelText('Judul kartu progres'))
  await user.type(within(form).getByLabelText('Judul kartu progres'), 'Progres Kemitraan 2026')
  await user.clear(within(form).getByLabelText('Label progres 1'))
  await user.type(within(form).getByLabelText('Label progres 1'), 'Kolaborasi aktif')
  await user.clear(within(form).getByLabelText('Persentase progres 1'))
  await user.type(within(form).getByLabelText('Persentase progres 1'), '75')
  await user.clear(within(form).getByLabelText('Persentase progres 2'))
  await user.type(within(form).getByLabelText('Persentase progres 2'), '88')
  await user.clear(within(form).getByLabelText('Deskripsi misi'))
  await user.type(within(form).getByLabelText('Deskripsi misi'), 'Misi baru dari admin.')
  await user.clear(within(form).getByLabelText('Poin misi 2'))
  await user.type(within(form).getByLabelText('Poin misi 2'), 'Poin misi kedua yang baru')
  await user.clear(within(form).getByLabelText('Deskripsi visi'))
  await user.type(within(form).getByLabelText('Deskripsi visi'), 'Visi baru dari admin.')
  await user.clear(within(form).getByLabelText('Label tombol'))
  await user.type(within(form).getByLabelText('Label tombol'), 'Gabung Sekarang')
  await user.selectOptions(within(form).getByLabelText('Halaman tujuan tombol'), 'kontak')

  const preview = screen.getByRole('region', { name: 'Pratinjau intro Tentang' })
  expect(within(preview).getByText('Kenal Kami Sekarang')).not.toBeNull()
  expect(within(preview).getByText('Progres Kemitraan 2026')).not.toBeNull()
  expect(within(preview).getByText('75%')).not.toBeNull()
  expect(within(preview).getByText('Misi baru dari admin.')).not.toBeNull()
  expect(within(preview).getByRole('button', { name: /Gabung Sekarang/ })).not.toBeNull()
  // Pratinjau memakai lebar desktop tetap supaya tidak gepeng di panel sempit.
  const scaled = preview.querySelector('div[style*="width: 1280px"]')
  expect(scaled).not.toBeNull()
  expect(scaled.querySelector('.grid-cols-2')).not.toBeNull()
  expect(writes).toBe(0)

  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(await screen.findByText('Intro Tentang berhasil disimpan.')).not.toBeNull()
  expect(writes).toBe(1)
  expect(reads).toBe(2)
  expect(payload).toEqual({
    ...DEFAULT_ABOUT_INTRO,
    eyebrow: 'Kenal Kami Sekarang',
    headline: 'Bergerak bersama untuk',
    headline_accent: 'hasil yang nyata.',
    photo_url: '/uploads/intro-admin.png',
    photo_alt: 'Foto dari admin',
    progress_title: 'Progres Kemitraan 2026',
    progress: [{ label: 'Kolaborasi aktif', percent: 75 }, { label: DEFAULT_ABOUT_INTRO.progress[1].label, percent: 88 }],
    mission: { ...DEFAULT_ABOUT_INTRO.mission, description: 'Misi baru dari admin.', items: [DEFAULT_ABOUT_INTRO.mission.items[0], 'Poin misi kedua yang baru', DEFAULT_ABOUT_INTRO.mission.items[2]] },
    vision: { ...DEFAULT_ABOUT_INTRO.vision, description: 'Visi baru dari admin.' },
    cta_label: 'Gabung Sekarang',
    cta_target: 'kontak',
  })
  expect(within(form).getByLabelText('Label kecil').matches(':disabled')).toBe(false)
  expect(Object.keys(localStorage).sort()).toEqual(['inotal_user'])
})

test('foto baru dipratinjau lokal dan baru diunggah saat Simpan', async () => {
  let record = DEFAULT_ABOUT_INTRO
  let uploads = 0
  let payload
  const createObjectURL = URL.createObjectURL
  URL.createObjectURL = vi.fn((file) => `blob:intro-${file.name}`)
  URL.revokeObjectURL = vi.fn()
  server.use(
    http.get('*/api/about/intro', () => HttpResponse.json({ success: true, data: record })),
    http.post('*/api/uploads/image', async ({ request }) => {
      uploads += 1
      expect(await request.text()).toContain('name="image"; filename="intro.png"')
      return HttpResponse.json({ data: { url: 'HTTPS://images.example.test/intro-unggah.png' } }, { status: 201 })
    }),
    http.put('*/api/about/intro', async ({ request }) => {
      payload = await request.json()
      record = payload
      return HttpResponse.json({ success: true, data: payload })
    }),
  )
  try {
    const { form, user } = await open()
    const preview = screen.getByRole('region', { name: 'Pratinjau intro Tentang' })
    await user.upload(within(form).getByLabelText('Pilih foto intro'), new File(['foto'], 'intro.png', { type: 'image/png' }))
    expect(within(preview).getByAltText(DEFAULT_ABOUT_INTRO.photo_alt).getAttribute('src')).toBe('blob:intro-intro.png')
    expect(uploads).toBe(0)
    await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
    expect(await screen.findByText('Intro Tentang berhasil disimpan.')).not.toBeNull()
    expect(uploads).toBe(1)
    expect(payload.photo_url).toBe('https://images.example.test/intro-unggah.png')
    expect(within(form).getByLabelText('URL foto intro').value).toBe('https://images.example.test/intro-unggah.png')
    expect(within(form).queryByText(/belum diunggah/)).toBeNull()
  } finally {
    URL.createObjectURL = createObjectURL
    delete URL.revokeObjectURL
  }
})

test('tombol pada pratinjau tidak mengirim form, mengunggah, atau menyimpan', async () => {
  let writes = 0
  let uploads = 0
  server.use(
    http.get('*/api/about/intro', () => HttpResponse.json({ success: true, data: DEFAULT_ABOUT_INTRO })),
    http.post('*/api/uploads/image', () => { uploads += 1; return HttpResponse.json({ data: { url: '/uploads/x.png' } }) }),
    http.put('*/api/about/intro', () => { writes += 1; return HttpResponse.json({ success: true, data: DEFAULT_ABOUT_INTRO }) }),
  )
  const { form, user } = await open()
  const preview = screen.getByRole('region', { name: 'Pratinjau intro Tentang' })
  const cta = within(preview).getByRole('button', { name: new RegExp(DEFAULT_ABOUT_INTRO.cta_label) })
  expect(cta.getAttribute('type')).toBe('button')
  await user.clear(within(form).getByLabelText('Label kecil'))
  await user.type(within(form).getByLabelText('Label kecil'), 'Draf belum disimpan')
  await user.click(cta)
  expect(writes).toBe(0)
  expect(uploads).toBe(0)
  expect(screen.queryByText('Intro Tentang berhasil disimpan.')).toBeNull()
  expect(within(form).getByLabelText('Label kecil').value).toBe('Draf belum disimpan')
})

test.each(['-1', '2.5', '1e2', 'abc', '150'])('persentase tidak sah "%s" ditolak tanpa diubah diam-diam', async (value) => {
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => HttpResponse.json({ success: true, data: DEFAULT_ABOUT_INTRO })),
    http.put('*/api/about/intro', () => { writes += 1; return HttpResponse.json({ success: true, data: DEFAULT_ABOUT_INTRO }) }),
  )
  const { form, user } = await open()
  const percent = within(form).getByLabelText('Persentase progres 1')
  await user.clear(percent)
  await user.type(percent, value)
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(within(form).getByText('Persentase progres 1 harus bilangan bulat 0–100.')).not.toBeNull()
  expect(writes).toBe(0)
})

test('URL ketikan huruf besar langsung dinormalkan pada pratinjau', async () => {
  server.use(http.get('*/api/about/intro', () => HttpResponse.json({ success: true, data: DEFAULT_ABOUT_INTRO })))
  const { form, user } = await open()
  const input = within(form).getByLabelText('URL foto intro')
  await user.clear(input)
  await user.type(input, 'HTTPS://images.example.test/intro.png')
  const preview = screen.getByRole('region', { name: 'Pratinjau intro Tentang' })
  expect(within(preview).getByAltText(DEFAULT_ABOUT_INTRO.photo_alt).getAttribute('src'))
    .toBe('https://images.example.test/intro.png')
  expect(input.value).toBe('HTTPS://images.example.test/intro.png')
})
