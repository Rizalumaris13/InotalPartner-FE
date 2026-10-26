import { expect, test } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import DashboardPage from '../src/pages/DashboardPage'
import { server } from './setup'

const mitra = [
  {
    id: 1,
    name: 'Mitra Pengujian B',
    logo_url: '',
    website_url: '',
    sort_order: 2,
    is_active: false,
  },
  {
    id: 2,
    name: 'Mitra Pengujian A',
    logo_url: '',
    website_url: 'https://example.test',
    sort_order: 1,
    is_active: true,
  },
]

async function bukaKemitraan(list = mitra) {
  localStorage.setItem('inotal_token', 'token-khusus-pengujian')
  localStorage.setItem(
    'inotal_user',
    JSON.stringify({ role: 'admin', full_name: 'Admin Pengujian' }),
  )
  server.use(
    http.get('*/api/homepage/partners', () =>
      HttpResponse.json({ data: list }),
    ),
  )
  render(<DashboardPage onNavigate={() => {}} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Kemitraan' }))
  return user
}

test('menu Kemitraan menampilkan daftar mitra sesuai urutan tampil', async () => {
  await bukaKemitraan()
  const table = await screen.findByRole('table', { name: 'Daftar mitra' })
  const rows = within(table).getAllByRole('row').slice(1)
  expect(
    rows.map((row) => within(row).getByRole('rowheader').textContent),
  ).toEqual(['Mitra Pengujian A', 'Mitra Pengujian B'])
  expect(within(rows[0]).getByText('Aktif')).not.toBeNull()
  expect(within(rows[1]).getByText('Nonaktif')).not.toBeNull()
})

test('tambah mitra melalui form mengirim payload eksplisit dan membaca ulang daftar', async () => {
  const list = [...mitra]
  let payload
  server.use(
    http.post('*/api/homepage/partners', async ({ request }) => {
      payload = await request.json()
      const saved = { id: 3, ...payload }
      list.push(saved)
      return HttpResponse.json({ data: saved }, { status: 201 })
    }),
  )
  const user = await bukaKemitraan(list)
  await screen.findByRole('table', { name: 'Daftar mitra' })
  await user.click(screen.getByRole('button', { name: 'Tambah Mitra' }))
  const dialog = screen.getByRole('dialog', { name: 'Tambah Mitra' })
  await user.type(
    within(dialog).getByLabelText('Nama Mitra'),
    ' Mitra Baru Uji ',
  )
  await user.type(within(dialog).getByLabelText('URL Logo'), '/uploads/uji.png')
  await user.type(
    within(dialog).getByLabelText('Tautan Situs'),
    'https://example.test',
  )
  await user.clear(within(dialog).getByLabelText('Urutan Tampil'))
  await user.type(within(dialog).getByLabelText('Urutan Tampil'), '3')
  await user.click(
    within(dialog).getByRole('checkbox', { name: 'Tampilkan di beranda' }),
  )
  await user.click(within(dialog).getByRole('button', { name: 'Simpan Mitra' }))
  expect(
    await screen.findByRole('rowheader', { name: 'Mitra Baru Uji' }),
  ).not.toBeNull()
  expect(payload).toEqual({
    name: 'Mitra Baru Uji',
    logo_url: '/uploads/uji.png',
    website_url: 'https://example.test',
    sort_order: 3,
    is_active: true,
  })
  expect(screen.queryByRole('dialog')).toBeNull()
})

test('edit mitra memakai ID yang dipilih dan memperbarui daftar', async () => {
  const list = mitra.map((item) => ({ ...item }))
  let targetId
  let payload
  server.use(
    http.put('*/api/homepage/partners/:id', async ({ request, params }) => {
      targetId = params.id
      payload = await request.json()
      const index = list.findIndex((item) => String(item.id) === params.id)
      list[index] = { id: Number(params.id), ...payload }
      return HttpResponse.json({ data: list[index] })
    }),
  )
  const user = await bukaKemitraan(list)
  await screen.findByRole('table', { name: 'Daftar mitra' })
  await user.click(
    screen.getByRole('button', { name: 'Edit Mitra Pengujian B' }),
  )
  const dialog = screen.getByRole('dialog', { name: 'Edit Mitra' })
  const name = within(dialog).getByLabelText('Nama Mitra')
  expect(name.value).toBe('Mitra Pengujian B')
  await user.clear(name)
  await user.type(name, 'Mitra Diperbarui')
  await user.clear(within(dialog).getByLabelText('Urutan Tampil'))
  await user.type(within(dialog).getByLabelText('Urutan Tampil'), '0')
  await user.click(
    within(dialog).getByRole('checkbox', { name: 'Tampilkan di beranda' }),
  )
  await user.click(
    within(dialog).getByRole('button', { name: 'Simpan Perubahan' }),
  )
  expect(
    await screen.findByRole('rowheader', { name: 'Mitra Diperbarui' }),
  ).not.toBeNull()
  expect(targetId).toBe('1')
  expect(payload).toEqual({
    name: 'Mitra Diperbarui',
    logo_url: '',
    website_url: '',
    sort_order: 0,
    is_active: true,
  })
  expect(
    screen.queryByRole('rowheader', { name: 'Mitra Pengujian B' }),
  ).toBeNull()
})

test('nonaktifkan mitra mempertahankan identitas dan membaca status dari backend', async () => {
  const list = mitra.map((item) => ({ ...item }))
  let payload
  server.use(
    http.put('*/api/homepage/partners/:id', async ({ request, params }) => {
      payload = await request.json()
      const index = list.findIndex((item) => String(item.id) === params.id)
      list[index] = { id: Number(params.id), ...payload }
      return HttpResponse.json({ data: list[index] })
    }),
  )
  const user = await bukaKemitraan(list)
  await screen.findByRole('table', { name: 'Daftar mitra' })
  await user.click(
    screen.getByRole('button', { name: 'Nonaktifkan Mitra Pengujian A' }),
  )
  expect(
    await screen.findByRole('button', { name: 'Aktifkan Mitra Pengujian A' }),
  ).not.toBeNull()
  expect(payload).toEqual({
    name: 'Mitra Pengujian A',
    logo_url: '',
    website_url: 'https://example.test',
    sort_order: 1,
    is_active: false,
  })
})

test('hapus mitra hanya berjalan setelah konfirmasi dan membaca ulang daftar', async () => {
  const list = mitra.map((item) => ({ ...item }))
  let deletes = 0
  server.use(
    http.delete('*/api/homepage/partners/:id', ({ params }) => {
      deletes += 1
      const index = list.findIndex((item) => String(item.id) === params.id)
      list.splice(index, 1)
      return HttpResponse.json({ success: true, data: null })
    }),
  )
  const user = await bukaKemitraan(list)
  await screen.findByRole('table', { name: 'Daftar mitra' })
  await user.click(
    screen.getByRole('button', { name: 'Hapus Mitra Pengujian B' }),
  )
  let dialog = screen.getByRole('alertdialog', { name: 'Hapus Mitra?' })
  expect(deletes).toBe(0)
  await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
  expect(screen.queryByRole('alertdialog')).toBeNull()
  expect(
    screen.getByRole('rowheader', { name: 'Mitra Pengujian B' }),
  ).not.toBeNull()
  await user.click(
    screen.getByRole('button', { name: 'Hapus Mitra Pengujian B' }),
  )
  dialog = screen.getByRole('alertdialog', { name: 'Hapus Mitra?' })
  await user.click(within(dialog).getByRole('button', { name: 'Hapus Mitra' }))
  await waitFor(() =>
    expect(
      screen.queryByRole('rowheader', { name: 'Mitra Pengujian B' }),
    ).toBeNull(),
  )
  expect(
    await screen.findByRole('rowheader', { name: 'Mitra Pengujian A' }),
  ).not.toBeNull()
  expect(deletes).toBe(1)
})

test('pencarian nama dan filter status mempersempit daftar mitra', async () => {
  const user = await bukaKemitraan()
  await screen.findByRole('table', { name: 'Daftar mitra' })
  await user.type(
    screen.getByRole('searchbox', { name: 'Cari mitra' }),
    ' pengujian a ',
  )
  expect(
    screen.getByRole('rowheader', { name: 'Mitra Pengujian A' }),
  ).not.toBeNull()
  expect(
    screen.queryByRole('rowheader', { name: 'Mitra Pengujian B' }),
  ).toBeNull()
  await user.clear(screen.getByRole('searchbox', { name: 'Cari mitra' }))
  await user.click(screen.getByRole('button', { name: 'Nonaktif (1)' }))
  expect(
    screen.getByRole('rowheader', { name: 'Mitra Pengujian B' }),
  ).not.toBeNull()
  expect(
    screen.queryByRole('rowheader', { name: 'Mitra Pengujian A' }),
  ).toBeNull()
})

test('hapus mitra terakhir pada halaman kedua kembali ke halaman yang masih berisi data', async () => {
  const list = Array.from({ length: 11 }, (_, index) => ({
    id: index + 1,
    name: `Mitra Uji ${index + 1}`,
    logo_url: '',
    website_url: '',
    sort_order: index,
    is_active: true,
  }))
  server.use(
    http.delete('*/api/homepage/partners/:id', ({ params }) => {
      list.splice(
        list.findIndex((item) => String(item.id) === params.id),
        1,
      )
      return HttpResponse.json({ success: true, data: null })
    }),
  )
  const user = await bukaKemitraan(list)
  const table = await screen.findByRole('table', { name: 'Daftar mitra' })
  expect(within(table).getAllByRole('rowheader')).toHaveLength(10)
  await user.click(screen.getByRole('button', { name: 'Halaman berikutnya' }))
  expect(screen.getByRole('rowheader', { name: 'Mitra Uji 11' })).not.toBeNull()
  expect(screen.queryByRole('rowheader', { name: 'Mitra Uji 1' })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Hapus Mitra Uji 11' }))
  await user.click(
    within(screen.getByRole('alertdialog')).getByRole('button', {
      name: 'Hapus Mitra',
    }),
  )
  expect(
    await screen.findByRole('rowheader', { name: 'Mitra Uji 1' }),
  ).not.toBeNull()
  expect(screen.queryByRole('rowheader', { name: 'Mitra Uji 11' })).toBeNull()
  expect(
    screen.queryByRole('button', { name: 'Halaman berikutnya' }),
  ).toBeNull()
})
