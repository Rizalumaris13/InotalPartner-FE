import { expect, test, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import FormVideoHighlightPage from '../src/pages/FormVideoHighlightPage'
import { server } from './setup'

const highlight = {
  id: 7,
  icon: 'Video',
  title: 'Kolaborasi terbuka',
  description: 'Penjelasan poin video untuk pengujian.',
  display_order: 0,
  is_active: true,
}

function signIn() {
  localStorage.setItem('inotal_token', 'video-highlight-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'admin', full_name: 'Admin Pengujian' }))
}

test.each(['tambah', 'edit'])('urutan %s poin video bisa dikosongkan lalu diisi 1 tanpa nol yang menempel', async (mode) => {
  signIn()
  const writes = []
  const onFinish = vi.fn()
  const save = async ({ request }) => {
    const payload = await request.json()
    writes.push({ method: request.method, payload })
    return HttpResponse.json({ data: { id: highlight.id, ...payload } })
  }
  server.use(
    http.get('*/api/about/video-highlights/:id', () => HttpResponse.json({ data: highlight })),
    http.post('*/api/about/video-highlights', save),
    http.put('*/api/about/video-highlights/:id', save),
  )
  render(<FormVideoHighlightPage editingHighlight={mode === 'edit' ? highlight : null} onFinish={onFinish} />)
  const user = userEvent.setup()
  const order = await screen.findByRole('spinbutton')
  expect(order.value).toBe('0')
  await user.clear(order)
  expect(order.value).toBe('')
  await user.type(order, '1')
  expect(order.value).toBe('1')
  expect(writes).toEqual([])

  if (mode === 'tambah') {
    await user.type(screen.getByPlaceholderText('Contoh: Transparansi Penuh'), highlight.title)
    await user.type(screen.getByPlaceholderText('Tuliskan penjelasan singkat poin video ini...'), highlight.description)
  }
  await user.click(screen.getByRole('button', { name: mode === 'edit' ? 'Simpan Perubahan' : 'Simpan Poin Video' }))
  await waitFor(() => expect(onFinish).toHaveBeenCalledOnce())
  expect(writes).toEqual([{
    method: mode === 'edit' ? 'PUT' : 'POST',
    payload: {
      icon: highlight.icon,
      title: highlight.title,
      description: highlight.description,
      display_order: 1,
      is_active: true,
    },
  }])
})

test.each(['', '-1', '1.5', '1e2', '9007199254740993'])('urutan tidak valid %j ditolak tanpa diubah diam-diam atau dikirim', (value) => {
  signIn()
  const writes = []
  const onFinish = vi.fn()
  server.use(http.post('*/api/about/video-highlights', async ({ request }) => {
    writes.push(await request.json())
    return HttpResponse.json({ data: highlight })
  }))
  render(<FormVideoHighlightPage onFinish={onFinish} />)
  fireEvent.change(screen.getByPlaceholderText('Contoh: Transparansi Penuh'), { target: { value: highlight.title } })
  fireEvent.change(screen.getByPlaceholderText('Tuliskan penjelasan singkat poin video ini...'), { target: { value: highlight.description } })
  const order = screen.getByRole('spinbutton')
  fireEvent.change(order, { target: { value } })
  expect(order.value).toBe(value)
  // Validasi form harus bekerja juga tanpa bergantung pada validasi native browser.
  fireEvent.submit(order.form)
  expect(screen.getByText('Urutan tampil harus berupa bilangan bulat 0 atau lebih.')).not.toBeNull()
  expect(order.value).toBe(value)
  expect(writes).toEqual([])
  expect(onFinish).not.toHaveBeenCalled()
})

test('nol tetap merupakan urutan yang sah dan dikirim sebagai angka', async () => {
  signIn()
  let payload
  const onFinish = vi.fn()
  server.use(http.post('*/api/about/video-highlights', async ({ request }) => {
    payload = await request.json()
    return HttpResponse.json({ data: { id: highlight.id, ...payload } })
  }))
  render(<FormVideoHighlightPage onFinish={onFinish} />)
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('Contoh: Transparansi Penuh'), highlight.title)
  await user.type(screen.getByPlaceholderText('Tuliskan penjelasan singkat poin video ini...'), highlight.description)
  await user.click(screen.getByRole('button', { name: 'Simpan Poin Video' }))
  await waitFor(() => expect(onFinish).toHaveBeenCalledOnce())
  expect(payload.display_order).toBe(0)
})
