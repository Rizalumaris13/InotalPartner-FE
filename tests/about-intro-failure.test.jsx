import { beforeAll, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import AboutIntroPage from '../src/pages/AboutIntroPage'
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

const json = (data) => HttpResponse.json({ success: true, data })
const open = async (role = 'admin') => {
  const user = userEvent.setup()
  render(<AboutIntroPage role={role} />)
  const form = await screen.findByRole('form', { name: 'Intro Tentang' })
  return { form, user }
}

test.each(['guest', 'operator', undefined, null, { name: 'operator' }])('role %j tidak membaca atau mengubah intro', (role) => {
  let reads = 0
  server.use(http.get('*/api/about/intro', () => { reads += 1; return json(DEFAULT_ABOUT_INTRO) }))
  render(<AboutIntroPage role={role} />)
  expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  expect(screen.queryByRole('form')).toBeNull()
  expect(reads).toBe(0)
})

test.each([404, 500, 'invalid'])('GET %s memblokir simpan tanpa menganggapnya konfigurasi kosong', async (status) => {
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => (status === 'invalid'
      ? json({ eyebrow: 'tidak lengkap' })
      : HttpResponse.json({ message: 'API belum siap.' }, { status }))),
    http.put('*/api/about/intro', () => { writes += 1; return json(DEFAULT_ABOUT_INTRO) }),
  )
  const { form, user } = await open()
  expect(screen.getByRole('alert')).not.toBeNull()
  expect(screen.queryByText(/Intro belum diatur/)).toBeNull()
  await user.clear(within(form).getByLabelText('Label kecil'))
  await user.type(within(form).getByLabelText('Label kecil'), 'Draf tanpa backend')
  expect(within(screen.getByRole('region', { name: 'Pratinjau intro Tentang' })).getByText('Draf tanpa backend')).not.toBeNull()
  const save = within(form).getByRole('button', { name: 'Simpan Intro' })
  expect(save.matches(':disabled')).toBe(true)
  await user.click(save)
  expect(writes).toBe(0)
})

test('GET null dapat diinisialisasi dengan teks bawaan', async () => {
  let record = null
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => json(record)),
    http.put('*/api/about/intro', async ({ request }) => {
      writes += 1
      record = await request.json()
      return json(record)
    }),
  )
  const { form, user } = await open()
  expect(screen.getByText(/Intro belum diatur/)).not.toBeNull()
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(await screen.findByText('Intro Tentang berhasil disimpan.')).not.toBeNull()
  expect(record).toEqual(DEFAULT_ABOUT_INTRO)
  expect(writes).toBe(1)
})

test('isian kosong ditolak, fokus pindah ke field pertama yang salah, dan tidak ada PUT', async () => {
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => json(DEFAULT_ABOUT_INTRO)),
    http.put('*/api/about/intro', () => { writes += 1; return json(DEFAULT_ABOUT_INTRO) }),
  )
  const { form, user } = await open()
  await user.clear(within(form).getByLabelText('Judul utama'))
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(within(form).getByText('Judul utama wajib diisi.')).not.toBeNull()
  expect(document.activeElement.id).toBe('intro-headline')
  expect(within(form).getByLabelText('Judul utama').getAttribute('aria-invalid')).toBe('true')
  expect(writes).toBe(0)
})

test('persentase kosong atau di luar 0–100 ditolak', async () => {
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => json(DEFAULT_ABOUT_INTRO)),
    http.put('*/api/about/intro', () => { writes += 1; return json(DEFAULT_ABOUT_INTRO) }),
  )
  const { form, user } = await open()
  const percent = within(form).getByLabelText('Persentase progres 1')
  await user.clear(percent)
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(within(form).getByText('Persentase progres 1 harus bilangan bulat 0–100.')).not.toBeNull()
  await user.type(percent, '150')
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(within(form).getByText('Persentase progres 1 harus bilangan bulat 0–100.')).not.toBeNull()
  expect(writes).toBe(0)
})

test('baca ulang yang tidak cocok tidak memberi sukses palsu', async () => {
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => json(DEFAULT_ABOUT_INTRO)),
    http.put('*/api/about/intro', async ({ request }) => { writes += 1; return json(await request.json()) }),
  )
  const { form, user } = await open()
  const input = within(form).getByLabelText('Label kecil')
  await user.clear(input)
  await user.type(input, 'Label yang tidak tersimpan')
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(await screen.findByText(/hasil baca ulang belum sesuai/)).not.toBeNull()
  expect(screen.queryByText('Intro Tentang berhasil disimpan.')).toBeNull()
  expect(input.value).toBe('Label yang tidak tersimpan')
  expect(input.matches(':disabled')).toBe(true)
  expect(within(form).getByRole('button', { name: 'Simpan Intro' }).matches(':disabled')).toBe(true)
  expect(writes).toBe(1)
})

test('PUT gagal mempertahankan draf dan bisa dicoba lagi', async () => {
  let record = DEFAULT_ABOUT_INTRO
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => json(record)),
    http.put('*/api/about/intro', async ({ request }) => {
      writes += 1
      if (writes === 1) return HttpResponse.json({ message: 'Simpan ditolak.' }, { status: 500 })
      record = await request.json()
      return json(record)
    }),
  )
  const { form, user } = await open()
  const input = within(form).getByLabelText('Label tombol')
  await user.clear(input)
  await user.type(input, 'Tombol Draf')
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(await screen.findByText('Simpan ditolak.')).not.toBeNull()
  expect(input.value).toBe('Tombol Draf')
  expect(input.matches(':disabled')).toBe(false)
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(await screen.findByText('Intro Tentang berhasil disimpan.')).not.toBeNull()
  expect(record.cta_label).toBe('Tombol Draf')
  expect(writes).toBe(2)
})

test('Muat Ulang yang gagal mengembalikan formulir ke teks bawaan', async () => {
  let reads = 0
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => {
      reads += 1
      return reads === 1
        ? json(DEFAULT_ABOUT_INTRO)
        : HttpResponse.json({ message: 'Server sedang sibuk.' }, { status: 500 })
    }),
    http.put('*/api/about/intro', () => { writes += 1; return json(DEFAULT_ABOUT_INTRO) }),
  )
  const { form, user } = await open()
  const input = within(form).getByLabelText('Label kecil')
  await user.clear(input)
  await user.type(input, 'Draf yang harus hilang')
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  expect(await screen.findByText('Server sedang sibuk.')).not.toBeNull()
  const failed = screen.getByRole('form', { name: 'Intro Tentang' })
  expect(within(failed).getByLabelText('Label kecil').value).toBe(DEFAULT_ABOUT_INTRO.eyebrow)
  expect(within(failed).getByRole('button', { name: 'Simpan Intro' }).matches(':disabled')).toBe(true)
  await user.click(within(failed).getByRole('button', { name: 'Simpan Intro' }))
  expect(writes).toBe(0)
})

test('URL upload tidak valid tidak diteruskan ke PUT', async () => {
  let writes = 0
  server.use(
    http.get('*/api/about/intro', () => json(DEFAULT_ABOUT_INTRO)),
    http.post('*/api/uploads/image', () => HttpResponse.json({ data: { url: 'javascript:alert(1)' } })),
    http.put('*/api/about/intro', () => { writes += 1; return json(DEFAULT_ABOUT_INTRO) }),
  )
  const { form, user } = await open()
  await user.upload(within(form).getByLabelText('Pilih foto intro'), new File(['foto'], 'intro.png', { type: 'image/png' }))
  await user.click(within(form).getByRole('button', { name: 'Simpan Intro' }))
  expect(await screen.findByText(/tidak mengembalikan URL foto yang valid/)).not.toBeNull()
  expect(writes).toBe(0)
  expect(within(form).getByText(/belum diunggah/)).not.toBeNull()
})
