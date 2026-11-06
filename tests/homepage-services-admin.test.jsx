import { beforeAll, expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import DashboardPage from '../src/pages/DashboardPage'
import { DEFAULT_HOMEPAGE_SERVICES } from '../src/data/homepageServices'
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

const open = async (record = DEFAULT_HOMEPAGE_SERVICES) => {
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'admin', full_name: 'Admin Uji Layanan' }))
  const user = userEvent.setup()
  render(<DashboardPage onNavigate={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'Home Page', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Layanan Kami', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Kartu Layanan', exact: true }))
  const form = await screen.findByRole('form', { name: 'Kartu layanan Beranda' })
  return { form, user, record: () => record }
}

test('menu Home Page > Layanan Kami membuka editor dengan isi tersimpan', async () => {
  server.use(http.get('*/api/homepage/services', () => HttpResponse.json({ success: true, data: DEFAULT_HOMEPAGE_SERVICES })))
  const { form } = await open()
  expect(screen.getByText('Home Page / Layanan Kami / Kartu Layanan')).not.toBeNull()
  expect(within(form).getByLabelText('Label kecil').value).toBe(DEFAULT_HOMEPAGE_SERVICES.eyebrow)
  expect(within(form).getByLabelText('Angka badge').value).toBe(DEFAULT_HOMEPAGE_SERVICES.badge_value)
  expect(within(form).getByLabelText('Ikon kartu 1').value).toBe('monitor-cog')
  expect(within(form).getByLabelText('Judul kartu 4').value).toBe('SOFTWARE DEVELOPMENT')
  // Editor hanya mengubah bagian Layanan Kami; menu lain tetap ada.
  expect(screen.getByRole('button', { name: 'Mengapa Bergabung', exact: true })).not.toBeNull()
})

test('admin mengubah teks, badge, dan kartu; pratinjau ikut lalu tersimpan dan terbaca ulang', async () => {
  let record = DEFAULT_HOMEPAGE_SERVICES
  let writes = 0
  let reads = 0
  let payload
  server.use(
    http.get('*/api/homepage/services', () => { reads += 1; return HttpResponse.json({ success: true, data: record }) }),
    http.put('*/api/homepage/services', async ({ request }) => {
      writes += 1
      payload = await request.json()
      record = payload
      return HttpResponse.json({ success: true, data: payload })
    }),
  )
  const { form, user } = await open()

  await user.clear(within(form).getByLabelText('Label kecil'))
  await user.type(within(form).getByLabelText('Label kecil'), 'Solusi Kami')
  await user.clear(within(form).getByLabelText('Judul bagian'))
  await user.type(within(form).getByLabelText('Judul bagian'), 'Layanan Partnership')
  await user.clear(within(form).getByLabelText('Deskripsi bagian'))
  await user.type(within(form).getByLabelText('Deskripsi bagian'), 'Deskripsi versi admin.')
  await user.clear(within(form).getByLabelText('Angka badge'))
  await user.type(within(form).getByLabelText('Angka badge'), '12+')
  await user.clear(within(form).getByLabelText('Label badge'))
  await user.type(within(form).getByLabelText('Label badge'), 'Mitra Aktif')
  await user.selectOptions(within(form).getByLabelText('Ikon kartu 1'), 'cpu')
  await user.clear(within(form).getByLabelText('Judul kartu 1'))
  await user.type(within(form).getByLabelText('Judul kartu 1'), 'CLOUD MIGRATION')
  await user.clear(within(form).getByLabelText('Deskripsi kartu 1'))
  await user.type(within(form).getByLabelText('Deskripsi kartu 1'), 'Deskripsi kartu satu.')
  await user.clear(within(form).getByLabelText('Judul kartu 4'))
  await user.type(within(form).getByLabelText('Judul kartu 4'), 'PRODUCT LAUNCH')

  const preview = screen.getByRole('region', { name: 'Pratinjau kartu layanan' })
  expect(within(preview).getByText('Solusi Kami')).not.toBeNull()
  expect(within(preview).getByText('12+')).not.toBeNull()
  expect(within(preview).getByRole('heading', { name: 'CLOUD MIGRATION' })).not.toBeNull()
  expect(writes).toBe(0)

  await user.click(within(form).getByRole('button', { name: 'Simpan Layanan' }))
  expect(await screen.findByText('Layanan Beranda berhasil disimpan.')).not.toBeNull()
  expect(writes).toBe(1)
  expect(reads).toBe(2)
  expect(payload).toEqual({
    ...DEFAULT_HOMEPAGE_SERVICES,
    eyebrow: 'Solusi Kami',
    title: 'Layanan Partnership',
    description: 'Deskripsi versi admin.',
    badge_value: '12+',
    badge_label: 'Mitra Aktif',
    services: [
      { icon: 'cpu', title: 'CLOUD MIGRATION', description: 'Deskripsi kartu satu.' },
      DEFAULT_HOMEPAGE_SERVICES.services[1],
      DEFAULT_HOMEPAGE_SERVICES.services[2],
      { ...DEFAULT_HOMEPAGE_SERVICES.services[3], title: 'PRODUCT LAUNCH' },
    ],
  })
  expect(within(form).getByLabelText('Label kecil').matches(':disabled')).toBe(false)
})

test('foto utama dan kedua dipratinjau lokal, diunggah saat Simpan, dan skema huruf besar dinormalkan', async () => {
  let record = DEFAULT_HOMEPAGE_SERVICES
  let payload
  const uploads = []
  const createObjectURL = URL.createObjectURL
  URL.createObjectURL = vi.fn((file) => `blob:layanan-${file.name}`)
  URL.revokeObjectURL = vi.fn()
  server.use(
    http.get('*/api/homepage/services', () => HttpResponse.json({ success: true, data: record })),
    http.post('*/api/uploads/image', async ({ request }) => {
      const filename = (await request.text()).match(/filename="([^"]+)"/)?.[1]
      uploads.push(filename)
      return HttpResponse.json({ data: { url: `HTTPS://images.example.test/${filename}` } }, { status: 201 })
    }),
    http.put('*/api/homepage/services', async ({ request }) => {
      payload = await request.json()
      record = payload
      return HttpResponse.json({ success: true, data: payload })
    }),
  )
  try {
    const { form, user } = await open()
    const preview = screen.getByRole('region', { name: 'Pratinjau kartu layanan' })
    await user.upload(within(form).getByLabelText('Pilih foto utama'), new File(['a'], 'utama.png', { type: 'image/png' }))
    await user.upload(within(form).getByLabelText('Pilih foto kedua'), new File(['b'], 'kedua.png', { type: 'image/png' }))
    expect(within(preview).getByAltText(DEFAULT_HOMEPAGE_SERVICES.photo_primary_alt).getAttribute('src')).toBe('blob:layanan-utama.png')
    expect(uploads).toHaveLength(0)
    await user.click(within(form).getByRole('button', { name: 'Simpan Layanan' }))
    expect(await screen.findByText('Layanan Beranda berhasil disimpan.')).not.toBeNull()
    expect(uploads).toEqual(['utama.png', 'kedua.png'])
    expect(payload.photo_primary_url).toBe('https://images.example.test/utama.png')
    expect(payload.photo_secondary_url).toBe('https://images.example.test/kedua.png')
    expect(within(form).getByLabelText('URL foto utama').value).toBe('https://images.example.test/utama.png')
    expect(within(form).queryByText(/belum diunggah/)).toBeNull()
  } finally {
    URL.createObjectURL = createObjectURL
    delete URL.revokeObjectURL
  }
})

test('memilih foto kedua tidak mencabut pratinjau foto utama yang masih dipakai', async () => {
  const revoked = []
  const createObjectURL = URL.createObjectURL
  URL.createObjectURL = vi.fn((file) => `blob:layanan-${file.name}`)
  URL.revokeObjectURL = vi.fn((url) => revoked.push(url))
  server.use(http.get('*/api/homepage/services', () => HttpResponse.json({ success: true, data: DEFAULT_HOMEPAGE_SERVICES })))
  try {
    const { form, user } = await open()
    const preview = screen.getByRole('region', { name: 'Pratinjau kartu layanan' })
    await user.upload(within(form).getByLabelText('Pilih foto utama'), new File(['a'], 'utama.png', { type: 'image/png' }))
    await user.upload(within(form).getByLabelText('Pilih foto kedua'), new File(['b'], 'kedua.png', { type: 'image/png' }))
    expect(revoked).not.toContain('blob:layanan-utama.png')
    expect(within(preview).getByAltText(DEFAULT_HOMEPAGE_SERVICES.photo_primary_alt).getAttribute('src'))
      .toBe('blob:layanan-utama.png')
    expect(within(preview).getByAltText(DEFAULT_HOMEPAGE_SERVICES.photo_secondary_alt).getAttribute('src'))
      .toBe('blob:layanan-kedua.png')
  } finally {
    URL.createObjectURL = createObjectURL
    delete URL.revokeObjectURL
  }
})
