import { expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import DashboardPage from '../src/pages/DashboardPage'
import { server } from './setup'

const initialCards = [
  {
    id: 1,
    title: 'Kartu Kedua Uji',
    description: 'Deskripsi kartu kedua untuk pengujian.',
    icon: 'award',
    url: 'https://example.test/tujuan',
    sort_order: 2,
  },
  {
    id: 2,
    title: 'Kartu Pertama Uji',
    description: 'Deskripsi kartu pertama untuk pengujian.',
    icon: 'lightbulb',
    url: '#program',
    sort_order: 1,
  },
]

async function openCards(list = initialCards, role = 'admin') {
  localStorage.setItem('inotal_token', 'token-khusus-pengujian')
  localStorage.setItem(
    'inotal_user',
    JSON.stringify({ role, full_name: 'Admin Pengujian' }),
  )
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({ success: true, data: list }),
    ),
  )
  render(<DashboardPage onNavigate={() => {}} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Kartu Tentang' }))
  return user
}

test('admin membuka daftar Kartu Tentang sesuai posisi', async () => {
  await openCards()
  const table = await screen.findByRole('table', {
    name: 'Daftar kartu Tentang',
  })
  expect(
    within(table)
      .getAllByRole('rowheader')
      .map((item) => item.textContent),
  ).toEqual(['Kartu Pertama Uji', 'Kartu Kedua Uji'])
  expect(screen.getByRole('button', { name: 'Tambah Kartu' })).not.toBeNull()
})

test('tambah kartu mengirim semua field dan membaca ulang daftar backend', async () => {
  const list = initialCards.map((card) => ({ ...card }))
  let payload
  let reads = 0
  server.use(
    http.post('*/api/about/cards', async ({ request }) => {
      payload = await request.json()
      list.forEach((card) => {
        if (card.sort_order >= payload.sort_order) card.sort_order += 1
      })
      const saved = { id: 3, ...payload }
      list.push(saved)
      return HttpResponse.json({ success: true, data: saved }, { status: 201 })
    }),
  )
  const user = await openCards(list)
  await screen.findByRole('table', { name: 'Daftar kartu Tentang' })
  server.use(
    http.get('*/api/about/cards', () => {
      reads += 1
      return HttpResponse.json({ success: true, data: list })
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Tambah Kartu' }))
  const dialog = screen.getByRole('dialog', { name: 'Tambah Kartu' })
  await user.type(within(dialog).getByLabelText('Judul'), ' Kartu Baru Uji ')
  await user.type(
    within(dialog).getByLabelText('Deskripsi'),
    ' Deskripsi kartu baru dari admin. ',
  )
  await user.selectOptions(within(dialog).getByLabelText('Ikon'), 'rocket')
  await user.type(within(dialog).getByLabelText('URL Tujuan'), '#kontak')
  await user.clear(within(dialog).getByLabelText('Posisi Tampil'))
  await user.type(within(dialog).getByLabelText('Posisi Tampil'), '1')
  const preview = within(dialog).getByRole('region', {
    name: 'Pratinjau kartu',
  })
  expect(
    within(preview).getByRole('heading', { name: 'Kartu Baru Uji' }),
  ).not.toBeNull()
  expect(preview.querySelector('.lucide-rocket')).not.toBeNull()
  await user.click(within(dialog).getByRole('button', { name: 'Simpan Kartu' }))
  expect(
    await screen.findByRole('rowheader', { name: 'Kartu Baru Uji' }),
  ).not.toBeNull()
  expect(payload).toEqual({
    title: 'Kartu Baru Uji',
    description: 'Deskripsi kartu baru dari admin.',
    icon: 'rocket',
    url: '#kontak',
    sort_order: 1,
  })
  expect(reads).toBe(1)
  expect(screen.queryByRole('dialog')).toBeNull()
  expect(
    within(screen.getByRole('table'))
      .getAllByRole('rowheader')
      .map((item) => item.textContent),
  ).toEqual(['Kartu Baru Uji', 'Kartu Pertama Uji', 'Kartu Kedua Uji'])
})

test('edit kartu memperbarui judul deskripsi ikon URL dan memindahkan posisi', async () => {
  const list = initialCards.map((card) => ({ ...card }))
  let payload
  let targetId
  server.use(
    http.put('*/api/about/cards/:id', async ({ request, params }) => {
      payload = await request.json()
      targetId = params.id
      const old = list.find((card) => String(card.id) === params.id)
      const others = list
        .filter((card) => card.id !== old.id)
        .sort((a, b) => a.sort_order - b.sort_order)
      others.splice(payload.sort_order - 1, 0, { id: old.id, ...payload })
      list.splice(
        0,
        list.length,
        ...others.map((card, index) => ({ ...card, sort_order: index + 1 })),
      )
      return HttpResponse.json({
        success: true,
        data: list.find((card) => card.id === old.id),
      })
    }),
  )
  const user = await openCards(list)
  await screen.findByRole('table', { name: 'Daftar kartu Tentang' })
  await user.click(screen.getByRole('button', { name: 'Edit Kartu Kedua Uji' }))
  const dialog = screen.getByRole('dialog', { name: 'Edit Kartu' })
  const form = within(dialog)
  expect(form.getByLabelText('Judul').value).toBe('Kartu Kedua Uji')
  await user.clear(form.getByLabelText('Judul'))
  await user.type(form.getByLabelText('Judul'), 'Kartu Diperbarui')
  await user.clear(form.getByLabelText('Deskripsi'))
  await user.type(
    form.getByLabelText('Deskripsi'),
    'Deskripsi baru yang disimpan admin.',
  )
  await user.selectOptions(form.getByLabelText('Ikon'), 'shield-check')
  await user.clear(form.getByLabelText('URL Tujuan'))
  await user.type(form.getByLabelText('URL Tujuan'), '#partnership')
  await user.clear(form.getByLabelText('Posisi Tampil'))
  await user.type(form.getByLabelText('Posisi Tampil'), '1')
  await user.click(form.getByRole('button', { name: 'Simpan Perubahan' }))
  expect(
    await screen.findByRole('rowheader', { name: 'Kartu Diperbarui' }),
  ).not.toBeNull()
  expect(targetId).toBe('1')
  expect(payload).toEqual({
    title: 'Kartu Diperbarui',
    description: 'Deskripsi baru yang disimpan admin.',
    icon: 'shield-check',
    url: '#partnership',
    sort_order: 1,
  })
  expect(
    within(screen.getByRole('table'))
      .getAllByRole('rowheader')
      .map((item) => item.textContent),
  ).toEqual(['Kartu Diperbarui', 'Kartu Pertama Uji'])
})

test('hapus kartu perlu konfirmasi dan memverifikasi daftar setelah penghapusan', async () => {
  const list = initialCards.map((card) => ({ ...card }))
  let deletes = 0
  let reads = 0
  server.use(
    http.delete('*/api/about/cards/:id', ({ params }) => {
      deletes += 1
      const ordered = list
        .filter((card) => String(card.id) !== params.id)
        .sort((a, b) => a.sort_order - b.sort_order)
      list.splice(
        0,
        list.length,
        ...ordered.map((card, index) => ({ ...card, sort_order: index + 1 })),
      )
      return HttpResponse.json({ success: true, data: null })
    }),
  )
  const user = await openCards(list)
  await screen.findByRole('table', { name: 'Daftar kartu Tentang' })
  server.use(
    http.get('*/api/about/cards', () => {
      reads += 1
      return HttpResponse.json({ success: true, data: list })
    }),
  )
  await user.click(
    screen.getByRole('button', { name: 'Hapus Kartu Pertama Uji' }),
  )
  let dialog = screen.getByRole('alertdialog', { name: 'Hapus Kartu?' })
  expect(deletes).toBe(0)
  await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
  expect(deletes).toBe(0)
  await user.click(
    screen.getByRole('button', { name: 'Hapus Kartu Pertama Uji' }),
  )
  dialog = screen.getByRole('alertdialog', { name: 'Hapus Kartu?' })
  await user.click(
    within(dialog).getByRole('button', { name: 'Ya, Hapus Kartu' }),
  )
  expect(await screen.findByText('Kartu berhasil dihapus.')).not.toBeNull()
  expect(
    screen.queryByRole('rowheader', { name: 'Kartu Pertama Uji' }),
  ).toBeNull()
  expect(within(screen.getByRole('table')).getByText('01')).not.toBeNull()
  expect(deletes).toBe(1)
  expect(reads).toBe(1)
})
