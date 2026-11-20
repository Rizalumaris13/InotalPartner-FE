import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import KontakPage from '../src/pages/FrontPage/KontakPage'
import { server } from './setup'

// Reveal memakai IntersectionObserver yang tidak ada di jsdom.
beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
    unobserve() {}
  })
})
afterEach(() => vi.unstubAllGlobals())

function servePublic() {
  server.use(
    http.get('*/api/public/page-banners/:page', () => HttpResponse.json({ success: true, data: null })),
  )
}

function captureSubmit() {
  const bodies = []
  server.use(
    http.post('*/api/contacts', async ({ request }) => {
      bodies.push(await request.json())
      return HttpResponse.json({ success: true, data: { id: 1 } }, { status: 201 })
    }),
  )
  return bodies
}

test('formulir kontak memakai satu input nama lengkap, tanpa nomor, dengan profesi', async () => {
  servePublic()
  render(<KontakPage onNavigate={vi.fn()} />)

  expect(screen.getByLabelText(/Nama Lengkap/)).toBeTruthy()
  expect(screen.queryByLabelText(/Nama Depan/)).toBeNull()
  expect(screen.queryByLabelText(/Nama Belakang/)).toBeNull()
  expect(screen.queryByLabelText(/Nomor|Telepon|No\. HP/i)).toBeNull()
  expect(screen.getByLabelText(/Profesi/)).toBeTruthy()
})

test('kirim pesan mengirim nama lengkap dan profesi tanpa field phone', async () => {
  servePublic()
  const bodies = captureSubmit()
  const user = userEvent.setup()
  render(<KontakPage onNavigate={vi.fn()} />)

  await user.type(screen.getByLabelText(/Nama Lengkap/), '  Nadya Putri  ')
  await user.type(screen.getByLabelText(/Email/), 'nadya@contoh.id')
  await user.type(screen.getByLabelText(/Profesi/), '  Manajer Produk  ')
  await user.selectOptions(screen.getByLabelText(/Topik/), 'Kemitraan & Partnership')
  await user.type(screen.getByLabelText(/Pesan/), 'Kami ingin menjajaki kerja sama program.')
  await user.click(screen.getByRole('button', { name: /Kirim Pesan/ }))

  await waitFor(() => expect(bodies).toHaveLength(1))
  expect(bodies[0]).toEqual({
    name: 'Nadya Putri',
    email: 'nadya@contoh.id',
    profession: 'Manajer Produk',
    subject: 'Kemitraan & Partnership',
    message: 'Kami ingin menjajaki kerja sama program.',
  })
  expect(Object.hasOwn(bodies[0], 'phone')).toBe(false)
  expect(await screen.findByText('Pesan terkirim!')).toBeTruthy()
})

test('validasi menolak nama lengkap dan profesi yang kosong', async () => {
  servePublic()
  const bodies = captureSubmit()
  const user = userEvent.setup()
  render(<KontakPage onNavigate={vi.fn()} />)

  await user.type(screen.getByLabelText(/Email/), 'nadya@contoh.id')
  await user.selectOptions(screen.getByLabelText(/Topik/), 'Lainnya')
  await user.type(screen.getByLabelText(/Pesan/), 'Pesan yang cukup panjang untuk lolos validasi.')
  await user.click(screen.getByRole('button', { name: /Kirim Pesan/ }))

  expect(await screen.findByText('Nama lengkap minimal 2 karakter')).toBeTruthy()
  expect(screen.getByText('Profesi wajib diisi')).toBeTruthy()
  expect(bodies).toHaveLength(0)
})
