import { beforeAll, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import HomepageServicesPage from '../src/pages/HomepageServicesPage'
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

const json = (data) => HttpResponse.json({ success: true, data })

const open = async (role = 'admin') => {
  const user = userEvent.setup()
  render(<HomepageServicesPage role={role} />)
  const form = await screen.findByRole('form', { name: 'Kartu layanan Beranda' })
  return { form, user }
}

test.each(['guest', 'operator', undefined, null])('role %j tidak membaca atau mengubah layanan', (role) => {
  let reads = 0
  server.use(http.get('*/api/homepage/services', () => { reads += 1; return json(DEFAULT_HOMEPAGE_SERVICES) }))
  render(<HomepageServicesPage role={role} />)
  expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  expect(screen.queryByRole('form')).toBeNull()
  expect(reads).toBe(0)
})

test.each([404, 500, 'invalid'])('GET %s memblokir simpan tanpa dianggap kosong', async (status) => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/services', () => (status === 'invalid'
      ? json({ eyebrow: 'tidak lengkap' })
      : HttpResponse.json({ message: 'API belum siap.' }, { status }))),
    http.put('*/api/homepage/services', () => { writes += 1; return json(DEFAULT_HOMEPAGE_SERVICES) }),
  )
  const { form, user } = await open()
  expect(screen.getByRole('alert')).not.toBeNull()
  expect(screen.queryByText(/Belum diatur/)).toBeNull()
  await user.clear(within(form).getByLabelText('Label kecil'))
  await user.type(within(form).getByLabelText('Label kecil'), 'Draf tanpa backend')
  expect(within(screen.getByRole('region', { name: 'Pratinjau kartu layanan' })).getByText('Draf tanpa backend')).not.toBeNull()
  const save = within(form).getByRole('button', { name: 'Simpan Layanan' })
  expect(save.matches(':disabled')).toBe(true)
  await user.click(save)
  expect(writes).toBe(0)
})

test('GET null dapat diinisialisasi dengan nilai bawaan', async () => {
  let record = null
  let writes = 0
  server.use(
    http.get('*/api/homepage/services', () => json(record)),
    http.put('*/api/homepage/services', async ({ request }) => {
      writes += 1
      record = await request.json()
      return json(record)
    }),
  )
  const { form, user } = await open()
  expect(screen.getByText(/Belum diatur/)).not.toBeNull()
  await user.click(within(form).getByRole('button', { name: 'Simpan Layanan' }))
  expect(await screen.findByText('Layanan Beranda berhasil disimpan.')).not.toBeNull()
  expect(record).toEqual(DEFAULT_HOMEPAGE_SERVICES)
  expect(writes).toBe(1)
})

test('judul kosong ditolak dan fokus pindah ke field yang salah', async () => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/services', () => json(DEFAULT_HOMEPAGE_SERVICES)),
    http.put('*/api/homepage/services', () => { writes += 1; return json(DEFAULT_HOMEPAGE_SERVICES) }),
  )
  const { form, user } = await open()
  await user.clear(within(form).getByLabelText('Judul kartu 3'))
  await user.click(within(form).getByRole('button', { name: 'Simpan Layanan' }))
  expect(within(form).getByText('Judul kartu 3 wajib diisi.')).not.toBeNull()
  expect(document.activeElement.id).toBe('svc-service-2-title')
  expect(writes).toBe(0)
})

test('baca ulang yang tidak cocok tidak memberi sukses palsu', async () => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/services', () => json(DEFAULT_HOMEPAGE_SERVICES)),
    http.put('*/api/homepage/services', async ({ request }) => { writes += 1; return json(await request.json()) }),
  )
  const { form, user } = await open()
  const input = within(form).getByLabelText('Label kecil')
  await user.clear(input)
  await user.type(input, 'Label tidak tersimpan')
  await user.click(within(form).getByRole('button', { name: 'Simpan Layanan' }))
  expect(await screen.findByText(/hasil baca ulang belum sesuai/)).not.toBeNull()
  expect(screen.queryByText('Layanan Beranda berhasil disimpan.')).toBeNull()
  expect(input.value).toBe('Label tidak tersimpan')
  expect(input.matches(':disabled')).toBe(true)
  expect(writes).toBe(1)
})

test('PUT gagal mempertahankan draf dan bisa dicoba lagi', async () => {
  let record = DEFAULT_HOMEPAGE_SERVICES
  let writes = 0
  server.use(
    http.get('*/api/homepage/services', () => json(record)),
    http.put('*/api/homepage/services', async ({ request }) => {
      writes += 1
      if (writes === 1) return HttpResponse.json({ message: 'Simpan ditolak.' }, { status: 500 })
      record = await request.json()
      return json(record)
    }),
  )
  const { form, user } = await open()
  const input = within(form).getByLabelText('Label badge')
  await user.clear(input)
  await user.type(input, 'Mitra Draf')
  await user.click(within(form).getByRole('button', { name: 'Simpan Layanan' }))
  expect(await screen.findByText('Simpan ditolak.')).not.toBeNull()
  expect(input.value).toBe('Mitra Draf')
  expect(input.matches(':disabled')).toBe(false)
  await user.click(within(form).getByRole('button', { name: 'Simpan Layanan' }))
  expect(await screen.findByText('Layanan Beranda berhasil disimpan.')).not.toBeNull()
  expect(record.badge_label).toBe('Mitra Draf')
  expect(writes).toBe(2)
})

test('Muat Ulang yang gagal mengembalikan formulir ke nilai bawaan', async () => {
  let reads = 0
  let writes = 0
  server.use(
    http.get('*/api/homepage/services', () => {
      reads += 1
      return reads === 1
        ? json(DEFAULT_HOMEPAGE_SERVICES)
        : HttpResponse.json({ message: 'Server sedang sibuk.' }, { status: 500 })
    }),
    http.put('*/api/homepage/services', () => { writes += 1; return json(DEFAULT_HOMEPAGE_SERVICES) }),
  )
  const { form, user } = await open()
  const input = within(form).getByLabelText('Label kecil')
  await user.clear(input)
  await user.type(input, 'Draf yang harus hilang')
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  expect(await screen.findByText('Server sedang sibuk.')).not.toBeNull()
  const failed = screen.getByRole('form', { name: 'Kartu layanan Beranda' })
  expect(within(failed).getByLabelText('Label kecil').value).toBe(DEFAULT_HOMEPAGE_SERVICES.eyebrow)
  expect(within(failed).getByRole('button', { name: 'Simpan Layanan' }).matches(':disabled')).toBe(true)
  await user.click(within(failed).getByRole('button', { name: 'Simpan Layanan' }))
  expect(writes).toBe(0)
})

test('URL upload tidak valid tidak diteruskan ke PUT', async () => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/services', () => json(DEFAULT_HOMEPAGE_SERVICES)),
    http.post('*/api/uploads/image', () => HttpResponse.json({ data: { url: 'javascript:alert(1)' } })),
    http.put('*/api/homepage/services', () => { writes += 1; return json(DEFAULT_HOMEPAGE_SERVICES) }),
  )
  const { form, user } = await open()
  await user.upload(within(form).getByLabelText('Pilih foto utama'), new File(['foto'], 'utama.png', { type: 'image/png' }))
  await user.click(within(form).getByRole('button', { name: 'Simpan Layanan' }))
  expect(await screen.findByText(/tidak mengembalikan URL foto yang valid/)).not.toBeNull()
  expect(writes).toBe(0)
  expect(within(form).getByText(/belum diunggah/)).not.toBeNull()
})
