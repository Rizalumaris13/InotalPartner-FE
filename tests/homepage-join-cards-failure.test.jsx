import { expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import HomepageJoinCardsPage from '../src/pages/HomepageJoinCardsPage'
import { DEFAULT_JOIN_CARDS, JOIN_CARD_FIELDS } from '../src/data/homepageJoinCards'
import { server } from './setup'

const json = (data) => HttpResponse.json({ success: true, data })
const fields = DEFAULT_JOIN_CARDS.flatMap(({ position }) => JOIN_CARD_FIELDS.map((field) => ({ position, ...field })))
async function openEditor(role = 'admin') {
  render(<HomepageJoinCardsPage role={role} />)
  return { form: await screen.findByRole('form', { name: 'Kartu teks Mengapa Bergabung' }), user: userEvent.setup() }
}

test.each(['guest', 'operator', null, undefined, { name: 'guest' }])('role %j tidak membaca atau mengubah kartu', (role) => {
  let reads = 0
  server.use(http.get('*/api/homepage/join-cards', () => { reads += 1; return json(DEFAULT_JOIN_CARDS) }))
  render(<HomepageJoinCardsPage role={role} />)
  expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  expect(screen.queryByRole('form')).toBeNull()
  expect(reads).toBe(0)
})

test.each(['super_admin', { name: 'super_admin' }, { name: 'admin' }])('role %j dapat membuka editor', async (role) => {
  server.use(http.get('*/api/homepage/join-cards', () => json(DEFAULT_JOIN_CARDS)))
  const { form } = await openEditor(role)
  expect(within(form).getByRole('button', { name: 'Simpan Kartu' }).matches(':disabled')).toBe(false)
  expect(within(form).getAllByRole('textbox')).toHaveLength(fields.length)
})

test.each([404, 500, 'invalid'])('GET %s memblokir simpan, bukan dianggap konfigurasi kosong', async (status) => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-cards', () => status === 'invalid'
      ? json([]) : HttpResponse.json({ message: 'API belum siap.' }, { status })),
    http.put('*/api/homepage/join-cards', () => { writes += 1; return json(DEFAULT_JOIN_CARDS) }),
  )
  const { form, user } = await openEditor()
  expect(screen.getByRole('alert')).not.toBeNull()
  expect(screen.queryByText(/Kartu belum diatur/)).toBeNull()
  const input = within(form).getByLabelText('Judul kartu 01')
  await user.clear(input)
  await user.type(input, 'Draf sebelum API siap')
  const preview = screen.getByRole('region', { name: 'Pratinjau kartu Mengapa Bergabung' })
  expect(within(preview).getByRole('heading', { name: 'Draf sebelum API siap' })).not.toBeNull()
  const save = within(form).getByRole('button', { name: 'Simpan Kartu' })
  expect(save.matches(':disabled')).toBe(true)
  await user.click(save)
  expect(writes).toBe(0)
  expect(Object.keys(localStorage)).toEqual([])
})

test('GET null dapat diinisialisasi dengan keenam kartu bawaan', async () => {
  let record = null
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-cards', () => json(record)),
    http.put('*/api/homepage/join-cards', async ({ request }) => {
      writes += 1
      record = (await request.json()).cards
      return json(record)
    }),
  )
  const { form, user } = await openEditor()
  expect(screen.getByText(/Kartu belum diatur/)).not.toBeNull()
  await user.click(within(form).getByRole('button', { name: 'Simpan Kartu' }))
  expect(await screen.findByText('Keenam kartu berhasil disimpan.')).not.toBeNull()
  expect(record).toEqual(DEFAULT_JOIN_CARDS)
  expect(writes).toBe(1)
})

test.each(fields)('kartu $position: $key kosong tidak dikirim dan fokus ke field yang salah', async ({ position, key, label }) => {
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-cards', () => json(DEFAULT_JOIN_CARDS)),
    http.put('*/api/homepage/join-cards', () => { writes += 1; return json(DEFAULT_JOIN_CARDS) }),
  )
  const { form, user } = await openEditor()
  const number = String(position).padStart(2, '0')
  const input = within(form).getByLabelText(`${label} kartu ${number}`)
  await user.clear(input)
  await user.click(within(form).getByRole('button', { name: 'Simpan Kartu' }))
  expect(within(form).getByText(`${label} kartu ${number} wajib diisi.`)).not.toBeNull()
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(document.activeElement.id).toBe(`join-card-${position}-${key}`)
  expect(writes).toBe(0)
})

test.each(fields)('baca ulang stale pada kartu $position.$key tidak memberi sukses palsu', async ({ position, key, label }) => {
  server.use(
    http.get('*/api/homepage/join-cards', () => json(DEFAULT_JOIN_CARDS)),
    http.put('*/api/homepage/join-cards', async ({ request }) => json((await request.json()).cards)),
  )
  const { form, user } = await openEditor()
  const input = within(form).getByLabelText(`${label} kartu ${String(position).padStart(2, '0')}`)
  const value = `Perubahan ${key} pada kartu ${position}`
  await user.clear(input)
  await user.type(input, value)
  await user.click(within(form).getByRole('button', { name: 'Simpan Kartu' }))
  expect(await screen.findByText(/hasil baca ulang belum sesuai/)).not.toBeNull()
  expect(screen.queryByText('Keenam kartu berhasil disimpan.')).toBeNull()
  expect(input.value).toBe(value)
  expect(input.matches(':disabled')).toBe(true)
  expect(within(form).getByRole('button', { name: 'Simpan Kartu' }).matches(':disabled')).toBe(true)
})

test('PUT gagal mempertahankan draf kartu terakhir dan dapat dicoba ulang', async () => {
  let record = DEFAULT_JOIN_CARDS
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-cards', () => json(record)),
    http.put('*/api/homepage/join-cards', async ({ request }) => {
      writes += 1
      if (writes === 1) return HttpResponse.json({ message: 'Simpan ditolak.' }, { status: 500 })
      record = (await request.json()).cards
      return json(record)
    }),
  )
  const { form, user } = await openEditor()
  const input = within(form).getByLabelText('Deskripsi kartu 06')
  await user.clear(input)
  await user.type(input, 'Draf kartu terakhir.')
  await user.click(within(form).getByRole('button', { name: 'Simpan Kartu' }))
  expect(await screen.findByText('Simpan ditolak.')).not.toBeNull()
  expect(input.value).toBe('Draf kartu terakhir.')
  expect(input.matches(':disabled')).toBe(false)
  await user.click(within(form).getByRole('button', { name: 'Simpan Kartu' }))
  expect(await screen.findByText('Keenam kartu berhasil disimpan.')).not.toBeNull()
  expect(record.find((card) => card.position === 6).description).toBe('Draf kartu terakhir.')
  expect(writes).toBe(2)
})

test('PUT diterima dan verifikasi gagal: retry hanya GET, tanpa kehilangan draf', async () => {
  let record = DEFAULT_JOIN_CARDS
  let writes = 0
  let reads = 0
  let failVerification = true
  server.use(
    http.get('*/api/homepage/join-cards', () => {
      reads += 1
      return writes && failVerification
        ? HttpResponse.json({ message: 'Verifikasi tertunda.' }, { status: 503 }) : json(record)
    }),
    http.put('*/api/homepage/join-cards', async ({ request }) => {
      writes += 1
      record = (await request.json()).cards
      return json(record)
    }),
  )
  const { form, user } = await openEditor()
  const input = within(form).getByLabelText('Judul kartu 04')
  await user.clear(input)
  await user.type(input, 'Judul menunggu verifikasi')
  await user.click(within(form).getByRole('button', { name: 'Simpan Kartu' }))
  expect(await screen.findByText('Verifikasi tertunda.')).not.toBeNull()
  expect(input.value).toBe('Judul menunggu verifikasi')
  expect(input.matches(':disabled')).toBe(true)
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect(await screen.findByText('Verifikasi tertunda.')).not.toBeNull()
  failVerification = false
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect(await screen.findByText('Keenam kartu berhasil disimpan.')).not.toBeNull()
  expect(input.matches(':disabled')).toBe(false)
  expect(reads).toBe(4)
  expect(writes).toBe(1)
})

test('Muat Ulang yang gagal tidak menyisakan draf teks lama', async () => {
  let reads = 0
  let writes = 0
  server.use(
    http.get('*/api/homepage/join-cards', () => {
      reads += 1
      return reads === 1
        ? json(DEFAULT_JOIN_CARDS)
        : HttpResponse.json({ message: 'Server sedang sibuk.' }, { status: 500 })
    }),
    http.put('*/api/homepage/join-cards', () => { writes += 1; return json(DEFAULT_JOIN_CARDS) }),
  )
  const { form, user } = await openEditor()
  const input = within(form).getByLabelText('Judul kartu 01')
  await user.clear(input)
  await user.type(input, 'Draf yang harus hilang saat reload')
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  expect(await screen.findByText('Server sedang sibuk.')).not.toBeNull()
  const failed = screen.getByRole('form', { name: 'Kartu teks Mengapa Bergabung' })
  expect(within(failed).getByLabelText('Judul kartu 01').value).toBe(DEFAULT_JOIN_CARDS[0].title)
  expect(within(failed).getByRole('button', { name: 'Simpan Kartu' }).matches(':disabled')).toBe(true)
  await user.click(within(failed).getByRole('button', { name: 'Simpan Kartu' }))
  expect(writes).toBe(0)
})
