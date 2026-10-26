import { expect, test, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import PartnerFormModal from '../src/components/PartnerFormModal'
import { server } from './setup'

test.each([
  [
    'URL Logo',
    '/uploads/../secret.png',
    'Logo harus berupa URL http/https atau path /uploads/.',
  ],
  [
    'URL Logo',
    '/uploads/subfolder/logo.png',
    'Logo harus berupa URL http/https atau path /uploads/.',
  ],
  [
    'URL Logo',
    '/uploads/%2e%2e/config',
    'Logo harus berupa URL http/https atau path /uploads/.',
  ],
  ['Nama Mitra', ' ', 'Nama mitra wajib diisi.'],
  ['Nama Mitra', 'A', 'Nama mitra minimal 2 karakter.'],
  ['Nama Mitra', 'A'.repeat(151), 'Nama mitra maksimal 150 karakter.'],
  [
    'Tautan Situs',
    'javascript:alert(1)',
    'Tautan situs harus berupa URL http atau https yang valid.',
  ],
  [
    'URL Logo',
    'data:image/svg+xml,<svg/>',
    'Logo harus berupa URL http/https atau path /uploads/.',
  ],
  ['Urutan Tampil', '', 'Urutan tampil harus bilangan bulat nol atau lebih.'],
  ['Urutan Tampil', '-1', 'Urutan tampil harus bilangan bulat nol atau lebih.'],
  [
    'Urutan Tampil',
    '1.5',
    'Urutan tampil harus bilangan bulat nol atau lebih.',
  ],
])('form menolak %s yang tidak valid: %s', async (label, value, message) => {
  let requests = 0
  server.use(
    http.post('*/api/homepage/partners', () => {
      requests += 1
      return HttpResponse.json({ data: { id: 99 } }, { status: 201 })
    }),
  )
  const onSaved = vi.fn()
  render(
    <PartnerFormModal nextOrder={0} onClose={() => {}} onSaved={onSaved} />,
  )
  const user = userEvent.setup()
  const dialog = screen.getByRole('dialog', { name: 'Tambah Mitra' })
  await user.type(within(dialog).getByLabelText('Nama Mitra'), 'Mitra Uji')
  const field = within(dialog).getByLabelText(label)
  await user.clear(field)
  if (value) await user.type(field, value)
  await user.click(within(dialog).getByRole('button', { name: 'Simpan Mitra' }))
  expect(await screen.findByText(message)).not.toBeNull()
  expect(field.getAttribute('aria-invalid')).toBe('true')
  expect(requests).toBe(0)
  expect(onSaved).not.toHaveBeenCalled()
})

test('unggah logo memakai field image dan URL hasil upload sebagai pratinjau', async () => {
  let filename
  server.use(
    http.post('*/api/uploads/image', async ({ request }) => {
      // Baca wire-format asli: Request.formData() Node 26 bertabrakan dengan File milik JSDOM.
      const body = await request.text()
      filename = body.match(/name="image"; filename="([^"]+)"/)?.[1]
      expect(request.headers.get('content-type')).toContain(
        'multipart/form-data; boundary=',
      )
      return HttpResponse.json(
        { data: { url: '/uploads/mitra-uji.png' } },
        { status: 201 },
      )
    }),
  )
  const onSaved = vi.fn()
  render(
    <PartnerFormModal nextOrder={0} onClose={() => {}} onSaved={onSaved} />,
  )
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nama Mitra'), 'Mitra Uji')
  await user.upload(
    screen.getByLabelText('Unggah Logo'),
    new File(['fixture-uji'], 'mitra.png', { type: 'image/png' }),
  )
  await waitFor(() =>
    expect(screen.getByLabelText('URL Logo').value).toBe(
      '/uploads/mitra-uji.png',
    ),
  )
  expect(
    screen.getByRole('img', { name: 'Logo Mitra Uji' }).getAttribute('src'),
  ).toBe('/uploads/mitra-uji.png')
  expect(filename).toBe('mitra.png')
  expect(onSaved).not.toHaveBeenCalled()
})

test.each([
  ['text/plain', 3, 'Format logo harus JPG, PNG, atau WEBP.'],
  ['image/png', 0, 'File logo tidak boleh kosong.'],
  ['image/png', 5 * 1024 * 1024 + 1, 'Ukuran logo maksimal 5 MB.'],
])(
  'unggah menolak file %s ukuran %s sebelum request',
  async (type, size, message) => {
    let requests = 0
    server.use(
      http.post('*/api/uploads/image', () => {
        requests += 1
        return HttpResponse.json(
          { data: { url: '/uploads/uji.png' } },
          { status: 201 },
        )
      }),
    )
    render(
      <PartnerFormModal nextOrder={0} onClose={() => {}} onSaved={() => {}} />,
    )
    const user = userEvent.setup({ applyAccept: false })
    await user.upload(
      screen.getByLabelText('Unggah Logo'),
      new File([new ArrayBuffer(size)], 'uji.png', { type }),
    )
    expect(await screen.findByText(message)).not.toBeNull()
    expect(requests).toBe(0)
  },
)
