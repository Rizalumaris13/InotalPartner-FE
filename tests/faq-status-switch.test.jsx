import { expect, test, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import FormFAQPage from '../src/pages/FormFAQPage'
import ListFAQPage from '../src/pages/ListFAQPage'
import { server } from './setup'

const faq = {
  id: 7,
  question: 'Bagaimana cara bergabung?',
  answer: 'Hubungi tim kemitraan melalui halaman kontak.',
  display_order: 2,
  is_active: true,
}

function signIn(role = 'admin') {
  localStorage.setItem('inotal_token', 'faq-switch-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ role, full_name: 'Admin Pengujian' }))
}

test('switch publikasi FAQ mendukung klik dan keyboard tanpa menyimpan sebelum tombol Simpan', async () => {
  signIn()
  const writes = []
  server.use(http.post('*/api/about/faqs', async ({ request }) => {
    const payload = await request.json()
    writes.push(payload)
    return HttpResponse.json({ data: { id: faq.id, ...payload } }, { status: 201 })
  }))
  const onFinish = vi.fn()
  render(<FormFAQPage onFinish={onFinish} />)
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('Contoh: Bagaimana mekanisme pengajuan kerja sama atau partnership?'), faq.question)
  await user.type(screen.getByPlaceholderText('Tuliskan jawaban yang lengkap, jelas, dan informatif untuk pengunjung...'), faq.answer)
  const toggle = screen.getByRole('switch', { name: 'Status Publikasi' })

  expect(toggle.textContent).toBe('Aktif (Ditampilkan)')
  expect(toggle.firstElementChild.getAttribute('aria-hidden')).toBe('true')
  expect(toggle.getAttribute('aria-checked')).toBe('true')
  await user.click(toggle)
  expect(toggle.textContent).toBe('Nonaktif (Disembunyikan)')
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  await user.keyboard(' ')
  expect(toggle.getAttribute('aria-checked')).toBe('true')
  await user.keyboard('{Enter}')
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  expect(writes).toEqual([])
  expect(onFinish).not.toHaveBeenCalled()

  await user.click(screen.getByRole('button', { name: 'Simpan FAQ' }))
  await waitFor(() => expect(onFinish).toHaveBeenCalledOnce())
  expect(writes).toEqual([{
    question: faq.question,
    answer: faq.answer,
    display_order: 0,
    is_active: false,
  }])
})

test('daftar FAQ memakai badge status noninteraktif serta mempertahankan filter, pencarian, dan aksi', async () => {
  signIn()
  const inactive = { ...faq, id: 8, question: 'Bagaimana cara menghubungi tim?', is_active: false }
  const onEdit = vi.fn()
  server.use(http.get('*/api/about/faqs', () => HttpResponse.json({ data: [faq, inactive] })))
  render(<ListFAQPage onEdit={onEdit} />)
  const user = userEvent.setup()
  const table = await screen.findByRole('table')
  expect(within(table).getByRole('columnheader', { name: 'Status' })).not.toBeNull()
  expect(within(table).queryByRole('switch')).toBeNull()
  expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent.trim())).toEqual([
    'No', 'Pertanyaan', 'Cuplikan Jawaban', 'Urutan', 'Status', 'Aksi',
  ])
  expect(within(table).getAllByRole('row')).toHaveLength(3)
  const firstRow = screen.getByText(faq.question).closest('tr')
  const secondRow = screen.getByText(inactive.question).closest('tr')
  const activeBadge = within(firstRow).getByText('Aktif', { exact: true })
  const inactiveBadge = within(secondRow).getByText('Nonaktif', { exact: true })
  expect(activeBadge.closest('button, [role="switch"]')).toBeNull()
  expect(inactiveBadge.closest('button, [role="switch"]')).toBeNull()
  await user.click(activeBadge)
  expect(within(firstRow).getByText('Aktif', { exact: true })).not.toBeNull()
  expect(onEdit).not.toHaveBeenCalled()
  expect(within(firstRow).getByRole('button', { name: 'Hapus FAQ' })).not.toBeNull()
  await user.click(within(firstRow).getByRole('button', { name: 'Edit FAQ' }))
  expect(onEdit).toHaveBeenCalledWith(faq)

  await user.click(screen.getByRole('button', { name: 'Aktif', exact: true }))
  expect(screen.getByText(faq.question)).not.toBeNull()
  expect(screen.queryByText(inactive.question)).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Tidak Aktif', exact: true }))
  expect(screen.queryByText(faq.question)).toBeNull()
  expect(screen.getByText(inactive.question)).not.toBeNull()
  await user.click(screen.getByRole('button', { name: 'Semua' }))
  const search = screen.getByPlaceholderText('Cari pertanyaan atau jawaban...')
  await user.type(search, 'bergabung')
  expect(screen.getByText(faq.question)).not.toBeNull()
  expect(screen.queryByText(inactive.question)).toBeNull()
  await user.clear(search)
  expect(within(table).getAllByRole('row')).toHaveLength(3)
})

test('form edit membaca status nonaktif dari API dan menyimpan nilai aktif sebagai boolean', async () => {
  signIn()
  const writes = []
  const onFinish = vi.fn()
  server.use(
    http.get('*/api/about/faqs/:id', () => HttpResponse.json({ data: { ...faq, is_active: false } })),
    http.put('*/api/about/faqs/:id', async ({ request, params }) => {
      const payload = await request.json()
      writes.push({ id: params.id, ...payload })
      return HttpResponse.json({ data: { id: faq.id, ...payload } })
    }),
  )
  render(<FormFAQPage editingFAQ={faq} onFinish={onFinish} />)
  const user = userEvent.setup()
  const toggle = await screen.findByRole('switch', { name: 'Status Publikasi' })
  expect(toggle.getAttribute('aria-checked')).toBe('false')
  await user.click(toggle)
  expect(toggle.getAttribute('aria-checked')).toBe('true')
  expect(writes).toEqual([])
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  await waitFor(() => expect(onFinish).toHaveBeenCalledOnce())
  expect(writes).toEqual([{ ...faq, id: String(faq.id), is_active: true }])
})

test('switch form FAQ tidak bisa diubah oleh non-admin', async () => {
  signIn('partner')
  render(<FormFAQPage />)
  const user = userEvent.setup()
  const toggle = await screen.findByRole('switch')
  expect(toggle.disabled).toBe(true)
  await user.click(toggle)
  expect(toggle.getAttribute('aria-checked')).toBe('true')
})

test('non-admin dapat membaca badge status FAQ tanpa akses edit atau hapus', async () => {
  signIn('partner')
  server.use(http.get('*/api/about/faqs', () => HttpResponse.json({ data: [faq] })))
  render(<ListFAQPage />)
  const table = await screen.findByRole('table')
  expect(within(table).getByText(faq.question)).not.toBeNull()
  expect(within(table).getByRole('columnheader', { name: 'Status' })).not.toBeNull()
  expect(within(table).getByText('Aktif', { exact: true })).not.toBeNull()
  expect(within(table).queryByRole('switch')).toBeNull()
  expect(within(table).queryByRole('button', { name: 'Edit FAQ' })).toBeNull()
  expect(within(table).queryByRole('button', { name: 'Hapus FAQ' })).toBeNull()
})
