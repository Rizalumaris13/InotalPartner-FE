import { beforeEach, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import FormTestimonialPage from '../src/pages/FormTestimonialPage'
import * as testimonials from '../src/api/testimonials'
import { server } from './setup'

const record = {
  id: 31, name: 'Nama awal', content: 'Isi awal', position: 'Direktur', company: 'Mitra',
  photo_url: '/uploads/awal.png', display_order: 3, is_active: false,
}
const namePlaceholder = 'Contoh: Andi Prasetyo'
const contentPlaceholder = 'Tuliskan isi ulasan partner di sini...'

function deferred() {
  let resolve
  let reject
  const promise = new Promise((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

beforeEach(() => {
  localStorage.setItem('inotal_token', 'cleanup-testimonial-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ role: { name: 'admin' } }))
})

test('testimonial create → complete edit → SAME-ID replacement → other ID → create preserves defaults and focus', () => {
  const detail = vi.spyOn(testimonials, 'getTestimonialByIdApi')
  const { rerender } = render(<FormTestimonialPage />)
  const name = screen.getByPlaceholderText(namePlaceholder)
  expect(name.value).toBe('')
  expect(screen.getByRole('spinbutton').value).toBe('0')
  expect(screen.getByRole('checkbox').checked).toBe(true)
  name.focus()
  rerender(<FormTestimonialPage editingTestimonial={record} />)
  expect(screen.getByPlaceholderText(namePlaceholder)).toBe(name)
  expect(document.activeElement).toBe(name)
  expect(name.value).toBe(record.name)
  expect(screen.getByRole('spinbutton').value).toBe('3')
  expect(screen.getByRole('checkbox').checked).toBe(false)
  const sameId = { ...record, name: 'Nama prop pengganti', display_order: '4' }
  rerender(<FormTestimonialPage editingTestimonial={sameId} />)
  expect(name.value).toBe('Nama prop pengganti')
  expect(document.activeElement).toBe(name)
  expect(screen.getByRole('spinbutton').value).toBe('4')
  fireEvent.change(name, { target: { value: 'Draf lokal' } })
  rerender(<FormTestimonialPage editingTestimonial={sameId} onFinish={() => {}} />)
  expect(name.value).toBe('Draf lokal')
  rerender(<FormTestimonialPage editingTestimonial={{ ...record, id: 32, name: 'Anggota B' }} />)
  expect(name.value).toBe('Anggota B')
  rerender(<FormTestimonialPage />)
  expect(name.value).toBe('')
  expect(screen.getByPlaceholderText(contentPlaceholder).value).toBe('')
  expect(screen.queryByAltText('Preview Testimoni')).toBeNull()
  expect(detail).not.toHaveBeenCalled()
})

test('incomplete testimonial props fetch fresh detail, while an ID-less partial prop is applied directly', async () => {
  const detail = deferred()
  const load = vi.spyOn(testimonials, 'getTestimonialByIdApi').mockReturnValue(detail.promise)
  const { rerender } = render(<FormTestimonialPage editingTestimonial={{ id: 31, name: 'Partial seed' }} />)
  expect(screen.queryByPlaceholderText(namePlaceholder)).toBeNull()
  expect(load).toHaveBeenCalledExactlyOnceWith(31)
  await act(async () => { detail.resolve(record) })
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe(record.name)
  expect(screen.getByPlaceholderText(contentPlaceholder).value).toBe(record.content)
  rerender(<FormTestimonialPage editingTestimonial={{ name: 'Tanpa ID' }} />)
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('Tanpa ID')
  expect(screen.getByPlaceholderText(contentPlaceholder).value).toBe('')
  expect(load).toHaveBeenCalledOnce()
})

test('failed incomplete detail never applies partial props, retaining the current draft on direct rerender', async () => {
  const load = vi.spyOn(testimonials, 'getTestimonialByIdApi').mockRejectedValue(new Error('Detail gagal'))
  const { rerender } = render(<FormTestimonialPage editingTestimonial={{ id: 31, name: 'Tidak boleh diterapkan' }} />)
  await screen.findByText('Detail gagal')
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('')
  expect(screen.getByPlaceholderText(contentPlaceholder).value).toBe('')
  fireEvent.change(screen.getByPlaceholderText(namePlaceholder), { target: { value: 'Draf sebelum pindah' } })
  rerender(<FormTestimonialPage editingTestimonial={{ id: 32, name: 'Partial B' }} />)
  await screen.findByText('Detail gagal')
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('Draf sebelum pindah')
  expect(load).toHaveBeenCalledTimes(2)
})

test('obsolete testimonial responses and failures are ignored on source change and unmount', async () => {
  const a = deferred()
  const b = deferred()
  const c = deferred()
  vi.spyOn(testimonials, 'getTestimonialByIdApi')
    .mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise).mockReturnValueOnce(c.promise)
  const { rerender, unmount } = render(<FormTestimonialPage editingTestimonial={{ id: 31 }} />)
  rerender(<FormTestimonialPage editingTestimonial={{ id: 32 }} />)
  await act(async () => { b.resolve({ ...record, id: 32, name: 'Target B' }) })
  await act(async () => { a.reject(new Error('Gagal lama')) })
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('Target B')
  expect(screen.queryByText('Gagal lama')).toBeNull()
  rerender(<FormTestimonialPage editingTestimonial={{ id: 33 }} />)
  unmount()
  render(<FormTestimonialPage />)
  await act(async () => { c.resolve(record) })
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('')
})

test('replacing/removing testimonial photos preserves text, does not fetch, and releases preview URLs', async () => {
  const create = vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second').mockReturnValueOnce('blob:third')
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const detail = vi.spyOn(testimonials, 'getTestimonialByIdApi')
  const { container, unmount } = render(<FormTestimonialPage editingTestimonial={record} />)
  const user = userEvent.setup()
  const name = screen.getByPlaceholderText(namePlaceholder)
  fireEvent.change(name, { target: { value: 'Draf nama tetap' } })
  const input = container.querySelector('input[type="file"]')
  await user.upload(input, new File(['first'], 'first.png', { type: 'image/png' }))
  expect(screen.getByAltText('Preview Testimoni').getAttribute('src')).toBe('blob:first')
  expect(revoke).not.toHaveBeenCalledWith('blob:first')
  await user.upload(input, new File(['second'], 'second.png', { type: 'image/png' }))
  expect(revoke).toHaveBeenCalledWith('blob:first')
  expect(revoke).not.toHaveBeenCalledWith('blob:second')
  expect(screen.getByAltText('Preview Testimoni').getAttribute('src')).toBe('blob:second')
  await user.click(screen.getByRole('button', { name: 'Hapus foto' }))
  expect(revoke).toHaveBeenCalledWith('blob:second')
  expect(screen.queryByAltText('Preview Testimoni')).toBeNull()
  await user.upload(input, new File(['third'], 'third.png', { type: 'image/png' }))
  expect(name.value).toBe('Draf nama tetap')
  expect(screen.getByPlaceholderText(contentPlaceholder).value).toBe(record.content)
  expect(detail).not.toHaveBeenCalled()
  unmount()
  expect(revoke).toHaveBeenCalledWith('blob:third')
  expect(create).toHaveBeenCalledTimes(3)
})

test.each(['create', 'edit'])('testimonial %s retries upload after failed save and sends all explicit fields', async (mode) => {
  const writes = []
  let uploads = 0
  const onFinish = vi.fn()
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:retry')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  server.use(
    http.post('*/api/uploads/image', () => { uploads += 1; return HttpResponse.json({ data: { url: '/uploads/new.png' } }) }),
    http[mode === 'edit' ? 'put' : 'post'](`*/api/testimonials${mode === 'edit' ? '/:id' : ''}`, async ({ request, params }) => {
      writes.push({ id: params.id, payload: await request.json() })
      return writes.length === 1
        ? HttpResponse.json({ message: 'Gagal simpan testimoni' }, { status: 422 })
        : HttpResponse.json({ data: { id: 31 } })
    }),
  )
  const { container } = render(<FormTestimonialPage editingTestimonial={mode === 'edit' ? record : null} onFinish={onFinish} />)
  const user = userEvent.setup()
  fireEvent.change(screen.getByPlaceholderText(namePlaceholder), { target: { value: '  Nama baru  ' } })
  fireEvent.change(screen.getByPlaceholderText(contentPlaceholder), { target: { value: '  Konten baru  ' } })
  fireEvent.change(screen.getByPlaceholderText('Contoh: CEO / Direktur'), { target: { value: '  Posisi baru  ' } })
  fireEvent.change(screen.getByPlaceholderText('Contoh: TechNusa Ventures'), { target: { value: '  Perusahaan baru  ' } })
  await user.upload(container.querySelector('input[type="file"]'), new File(['image'], 'new.png', { type: 'image/png' }))
  const buttonName = mode === 'edit' ? 'Simpan Perubahan' : 'Buat Testimonial'
  await user.click(screen.getByRole('button', { name: buttonName }))
  await screen.findByText('Gagal simpan testimoni')
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('  Nama baru  ')
  expect(screen.getByAltText('Preview Testimoni').getAttribute('src')).toBe('blob:retry')
  expect(onFinish).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: buttonName }))
  await waitFor(() => expect(onFinish).toHaveBeenCalledOnce())
  expect(uploads).toBe(2)
  expect(writes).toEqual(Array.from({ length: 2 }, () => ({
    id: mode === 'edit' ? '31' : undefined,
    payload: { name: 'Nama baru', position: 'Posisi baru', company: 'Perusahaan baru', content: 'Konten baru', photo_url: '/uploads/new.png', display_order: mode === 'edit' ? 3 : 0, is_active: mode !== 'edit' },
  })))
})

test('testimonial upload errors keep backend message and prevent writes; empty URL remains accepted', async () => {
  const writes = []
  let failUpload = true
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:upload')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  server.use(
    http.post('*/api/uploads/image', () => failUpload
      ? HttpResponse.json({ message: 'Foto ditolak server' }, { status: 422 })
      : HttpResponse.json({ data: { url: '' } })),
    http.put('*/api/testimonials/:id', async ({ request }) => { writes.push(await request.json()); return HttpResponse.json({ data: record }) }),
  )
  const { container } = render(<FormTestimonialPage editingTestimonial={record} />)
  const user = userEvent.setup()
  await user.upload(container.querySelector('input[type="file"]'), new File(['image'], 'new.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  await screen.findByText('Foto ditolak server')
  expect(writes).toEqual([])
  failUpload = false
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  await waitFor(() => expect(writes).toHaveLength(1))
  expect(writes[0].photo_url).toBe('')
})

test('testimonial cancel returns to list; non-admin never receives an editable form', async () => {
  const onOpenList = vi.fn()
  const { unmount } = render(<FormTestimonialPage onOpenList={onOpenList} />)
  await userEvent.setup().click(screen.getByRole('button', { name: 'Batal' }))
  expect(onOpenList).toHaveBeenCalledOnce()
  unmount()
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'operator' }))
  render(<FormTestimonialPage />)
  expect(screen.getByText('Akses Ditolak')).not.toBeNull()
  expect(screen.queryByPlaceholderText(namePlaceholder)).toBeNull()
})
