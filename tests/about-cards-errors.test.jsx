import { expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import KartuTentangPage from '../src/pages/KartuTentangPage'
import { server } from './setup'

const card = {
  id: 1,
  title: 'Kartu Awal Uji',
  description: 'Deskripsi kartu awal untuk pengujian.',
  icon: 'lightbulb',
  url: '#program',
  sort_order: 1,
}

async function openCreate(list = [card]) {
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({ success: true, data: list }),
    ),
  )
  render(<KartuTentangPage role="admin" />)
  const user = userEvent.setup()
  await screen.findByRole('table', { name: 'Daftar kartu Tentang' })
  await user.click(screen.getByRole('button', { name: 'Tambah Kartu' }))
  return {
    user,
    form: within(screen.getByRole('dialog', { name: 'Tambah Kartu' })),
  }
}

async function fillCreate(user, form) {
  await user.type(form.getByLabelText('Judul'), 'Kartu Baru Uji')
  await user.type(
    form.getByLabelText('Deskripsi'),
    'Deskripsi kartu baru untuk pengujian.',
  )
  await user.type(form.getByLabelText('URL Tujuan'), '#kontak')
}

test('backend belum siap tetap memperbolehkan pratinjau form tanpa sukses palsu', async () => {
  server.use(
    http.get(
      '*/api/about/cards',
      () => new HttpResponse(null, { status: 404 }),
    ),
  )
  render(<KartuTentangPage role="admin" />)
  expect((await screen.findByRole('alert')).textContent).toContain(
    'GET /api/about/cards',
  )
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Tambah Kartu' }))
  const form = within(screen.getByRole('dialog', { name: 'Tambah Kartu' }))
  await fillCreate(user, form)
  expect(form.getByRole('button', { name: 'Simpan Kartu' }).disabled).toBe(true)
  expect(
    form.getByRole('region', { name: 'Pratinjau kartu' }).textContent,
  ).toContain('Kartu Baru Uji')
  expect(screen.queryByText(/Kartu berhasil/)).toBeNull()
})

test.each(['operator', 'guest', undefined])(
  'role %s tidak dapat mengakses API pengelolaan kartu',
  async (role) => {
    let reads = 0
    server.use(
      http.get('*/api/about/cards', () => {
        reads += 1
        return HttpResponse.json({ success: true, data: [] })
      }),
    )
    render(<KartuTentangPage role={role} />)
    expect(screen.getByRole('alert').textContent).toContain(
      'tidak memiliki akses',
    )
    expect(screen.queryByRole('button', { name: 'Tambah Kartu' })).toBeNull()
    await waitFor(() => expect(reads).toBe(0))
  },
)

test('form menolak field kosong, URL berbahaya dan posisi di luar rentang', async () => {
  let posts = 0
  server.use(
    http.post('*/api/about/cards', () => {
      posts += 1
      return HttpResponse.json({ success: true, data: card })
    }),
  )
  const { user, form } = await openCreate()
  await user.click(form.getByRole('button', { name: 'Simpan Kartu' }))
  expect(form.getByLabelText('Judul').getAttribute('aria-invalid')).toBe('true')
  expect(form.getByLabelText('Deskripsi').getAttribute('aria-invalid')).toBe(
    'true',
  )
  expect(document.activeElement).toBe(form.getByLabelText('Judul'))
  await fillCreate(user, form)
  await user.clear(form.getByLabelText('URL Tujuan'))
  await user.type(form.getByLabelText('URL Tujuan'), 'javascript:alert(1)')
  await user.clear(form.getByLabelText('Posisi Tampil'))
  await user.type(form.getByLabelText('Posisi Tampil'), '3')
  await user.click(form.getByRole('button', { name: 'Simpan Kartu' }))
  expect(form.getByLabelText('URL Tujuan').getAttribute('aria-invalid')).toBe(
    'true',
  )
  expect(
    form.getByLabelText('Posisi Tampil').getAttribute('aria-invalid'),
  ).toBe('true')
  expect(posts).toBe(0)
})

test('konflik backend mempertahankan seluruh input dan tidak mengaku sukses', async () => {
  server.use(
    http.post('*/api/about/cards', () =>
      HttpResponse.json(
        { success: false, message: 'Posisi berubah. Muat ulang daftar kartu.' },
        { status: 409 },
      ),
    ),
  )
  const { user, form } = await openCreate()
  await fillCreate(user, form)
  await user.click(form.getByRole('button', { name: 'Simpan Kartu' }))
  expect(
    await screen.findByText('Posisi berubah. Muat ulang daftar kartu.'),
  ).not.toBeNull()
  expect(form.getByLabelText('Judul').value).toBe('Kartu Baru Uji')
  expect(form.getByLabelText('Deskripsi').value).toBe(
    'Deskripsi kartu baru untuk pengujian.',
  )
  expect(form.getByLabelText('URL Tujuan').value).toBe('#kontak')
  expect(screen.queryByText(/Kartu berhasil/)).toBeNull()
})

test('readback gagal setelah POST tidak mengirim POST ulang saat verifikasi', async () => {
  let posts = 0
  let saved
  const { user, form } = await openCreate()
  server.use(
    http.post('*/api/about/cards', async ({ request }) => {
      posts += 1
      saved = { id: 2, ...(await request.json()) }
      return HttpResponse.json({ success: true, data: saved }, { status: 201 })
    }),
    http.get('*/api/about/cards', () =>
      HttpResponse.json(
        { success: false, message: 'Readback gagal.' },
        { status: 500 },
      ),
    ),
  )
  await fillCreate(user, form)
  await user.click(form.getByRole('button', { name: 'Simpan Kartu' }))
  expect(
    await screen.findByText(/Perubahan diterima, tetapi belum terverifikasi/),
  ).not.toBeNull()
  expect(form.getByLabelText('Judul').value).toBe('Kartu Baru Uji')
  expect(form.getByLabelText('Judul').matches(':disabled')).toBe(true)
  expect(screen.queryByText(/Kartu berhasil/)).toBeNull()
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({ success: true, data: [card, saved] }),
    ),
  )
  await user.click(form.getByRole('button', { name: 'Coba Verifikasi' }))
  expect(await screen.findByText('Kartu berhasil ditambahkan.')).not.toBeNull()
  expect(posts).toBe(1)
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('DELETE diterima tetapi target masih ada hanya mengulang GET saat retry', async () => {
  let deletes = 0
  let reads = 0
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({ success: true, data: [card] }),
    ),
  )
  render(<KartuTentangPage role="admin" />)
  const user = userEvent.setup()
  await screen.findByRole('table', { name: 'Daftar kartu Tentang' })
  server.use(
    http.delete('*/api/about/cards/:id', () => {
      deletes += 1
      return HttpResponse.json({ success: true, data: null })
    }),
    http.get('*/api/about/cards', () => {
      reads += 1
      return HttpResponse.json({ success: true, data: [card] })
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Hapus Kartu Awal Uji' }))
  const form = within(screen.getByRole('alertdialog', { name: 'Hapus Kartu?' }))
  await user.click(form.getByRole('button', { name: 'Ya, Hapus Kartu' }))
  expect(
    await screen.findByText(/Penghapusan diterima, tetapi belum terverifikasi/),
  ).not.toBeNull()
  expect(screen.queryByText('Kartu berhasil dihapus.')).toBeNull()
  server.use(
    http.get('*/api/about/cards', () => {
      reads += 1
      return HttpResponse.json({ success: true, data: [] })
    }),
  )
  await user.click(form.getByRole('button', { name: 'Coba Verifikasi' }))
  expect(await screen.findByText('Kartu berhasil dihapus.')).not.toBeNull()
  expect(screen.queryByRole('rowheader')).toBeNull()
  expect(deletes).toBe(1)
  expect(reads).toBe(2)
})

test('kegagalan DELETE tidak menghilangkan target dari daftar', async () => {
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({ success: true, data: [card] }),
    ),
    http.delete('*/api/about/cards/:id', () =>
      HttpResponse.json(
        { success: false, message: 'Kartu belum dapat dihapus.' },
        { status: 500 },
      ),
    ),
  )
  render(<KartuTentangPage role="admin" />)
  const user = userEvent.setup()
  await screen.findByRole('table', { name: 'Daftar kartu Tentang' })
  await user.click(screen.getByRole('button', { name: 'Hapus Kartu Awal Uji' }))
  const form = within(screen.getByRole('alertdialog', { name: 'Hapus Kartu?' }))
  await user.click(form.getByRole('button', { name: 'Ya, Hapus Kartu' }))
  expect(await screen.findByText('Kartu belum dapat dihapus.')).not.toBeNull()
  await user.click(form.getByRole('button', { name: 'Batal' }))
  expect(
    screen.getByRole('rowheader', { name: 'Kartu Awal Uji' }),
  ).not.toBeNull()
  expect(screen.queryByText('Kartu berhasil dihapus.')).toBeNull()
})

test('pencarian dan pagination tidak mengubah posisi koleksi', async () => {
  const cards = Array.from({ length: 12 }, (_, index) => ({
    ...card,
    id: index + 1,
    title: `Kartu Nomor ${String(index + 1).padStart(2, '0')}`,
    sort_order: index + 1,
  }))
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({ success: true, data: cards }),
    ),
  )
  render(<KartuTentangPage role="super_admin" />)
  const user = userEvent.setup()
  await screen.findByRole('table', { name: 'Daftar kartu Tentang' })
  expect(screen.getAllByRole('rowheader')).toHaveLength(10)
  await user.click(screen.getByRole('button', { name: 'Berikutnya' }))
  expect(screen.getAllByRole('rowheader')).toHaveLength(2)
  expect(
    screen.getByRole('rowheader', { name: 'Kartu Nomor 12' }),
  ).not.toBeNull()
  await user.type(
    screen.getByRole('searchbox', { name: 'Cari kartu Tentang' }),
    'Nomor 12',
  )
  expect(screen.getAllByRole('rowheader')).toHaveLength(1)
  expect(within(screen.getByRole('table')).getByText('12')).not.toBeNull()
  expect(screen.getByText('1 dari 12 kartu')).not.toBeNull()
})
