import { expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import KemitraanPage from '../src/pages/KemitraanPage'
import PartnerFormModal from '../src/components/PartnerFormModal'
import PublicPartnerSection from '../src/components/PublicPartnerSection'
import { server } from './setup'

const publicPath = '*/api/public/homepage/partners'

test('tambah mitra menunggu daftar selesai dimuat agar urutan default tidak keliru', async () => {
  server.use(
    http.get('*/api/homepage/partners', () => HttpResponse.json({ data: [] })),
  )
  render(<KemitraanPage role="admin" />)
  expect(screen.getByRole('button', { name: 'Tambah Mitra' }).disabled).toBe(
    true,
  )
  expect(await screen.findByText('Belum ada mitra.')).not.toBeNull()
  expect(screen.getByRole('button', { name: 'Tambah Mitra' }).disabled).toBe(
    false,
  )
})

test('endpoint admin 404 dijelaskan tanpa menghalangi pratinjau form', async () => {
  server.use(
    http.get(
      '*/api/homepage/partners',
      () => new HttpResponse(null, { status: 404 }),
    ),
  )
  render(<KemitraanPage role="admin" />)
  expect(
    await screen.findByText(
      'Endpoint GET /api/homepage/partners belum tersedia di backend.',
    ),
  ).not.toBeNull()
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Tambah Mitra' }))
  expect(screen.getByRole('dialog', { name: 'Tambah Mitra' })).not.toBeNull()
})

test('save gagal mempertahankan form dan tidak mengirim notifikasi sukses', async () => {
  server.use(
    http.post('*/api/homepage/partners', () =>
      HttpResponse.json({ message: 'Penyimpanan uji gagal.' }, { status: 500 }),
    ),
  )
  const onSaved = vi.fn()
  render(
    <PartnerFormModal nextOrder={0} onSaved={onSaved} onClose={() => {}} />,
  )
  const user = userEvent.setup()
  await user.type(screen.getByLabelText('Nama Mitra'), 'Mitra Belum Tersimpan')
  await user.click(screen.getByRole('button', { name: 'Simpan Mitra' }))
  expect(await screen.findByText('Penyimpanan uji gagal.')).not.toBeNull()
  expect(screen.getByLabelText('Nama Mitra').value).toBe(
    'Mitra Belum Tersimpan',
  )
  expect(screen.getByRole('button', { name: 'Simpan Mitra' }).disabled).toBe(
    false,
  )
  expect(onSaved).not.toHaveBeenCalled()
})

test('404 saat edit menampilkan pesan mitra tidak ditemukan, bukan menuduh endpoint hilang', async () => {
  server.use(
    http.put('*/api/homepage/partners/1', () =>
      HttpResponse.json(
        {
          success: false,
          message: 'Mitra sudah dihapus atau tidak ditemukan.',
        },
        { status: 404 },
      ),
    ),
  )
  const onSaved = vi.fn()
  render(
    <PartnerFormModal
      partner={{
        id: 1,
        name: 'Mitra Stale Uji',
        logo_url: '',
        website_url: '',
        sort_order: 0,
        is_active: true,
      }}
      nextOrder={0}
      onSaved={onSaved}
      onClose={() => {}}
    />,
  )
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  expect(
    await screen.findByText('Mitra sudah dihapus atau tidak ditemukan.'),
  ).not.toBeNull()
  expect(screen.queryByText(/Endpoint PUT .*belum tersedia/i)).toBeNull()
  expect(screen.getByLabelText('Nama Mitra').value).toBe('Mitra Stale Uji')
  expect(onSaved).not.toHaveBeenCalled()
})

test('API publik 404 memakai nama contoh lama dengan label pratinjau', async () => {
  server.use(
    http.get(publicPath, () => new HttpResponse(null, { status: 404 })),
  )
  render(<PublicPartnerSection />)
  expect(
    await screen.findByText(
      'Pratinjau mitra contoh. Data resmi akan tampil setelah API kemitraan tersedia.',
    ),
  ).not.toBeNull()
  expect(screen.getByText('Kementerian Kominfo')).not.toBeNull()
})

test('daftar publik kosong tidak menghidupkan kembali mitra contoh', async () => {
  server.use(http.get(publicPath, () => HttpResponse.json({ data: [] })))
  render(<PublicPartnerSection />)
  expect(
    await screen.findByText('Belum ada mitra yang ditampilkan.'),
  ).not.toBeNull()
  expect(screen.queryByText('Kementerian Kominfo')).toBeNull()
})

test('error publik selain 404 tidak ditutupi contoh dan bisa dicoba ulang', async () => {
  server.use(
    http.get(publicPath, () => new HttpResponse(null, { status: 500 })),
  )
  render(<PublicPartnerSection />)
  expect(
    await screen.findByText('Daftar mitra belum dapat dimuat.'),
  ).not.toBeNull()
  expect(screen.queryByText('Kementerian Kominfo')).toBeNull()
  server.use(http.get(publicPath, () => HttpResponse.json({ data: [] })))
  await userEvent
    .setup()
    .click(screen.getByRole('button', { name: 'Coba Lagi' }))
  expect(
    await screen.findByText('Belum ada mitra yang ditampilkan.'),
  ).not.toBeNull()
})

test('tautan dan logo berbahaya dari backend tidak masuk atribut aktif', async () => {
  server.use(
    http.get(publicPath, () =>
      HttpResponse.json({
        data: [
          {
            id: 1,
            name: 'Mitra Aman Uji',
            sort_order: 0,
            is_active: true,
            website_url: 'javascript:alert(1)',
            logo_url: 'data:image/svg+xml,<svg/>',
          },
        ],
      }),
    ),
  )
  render(<PublicPartnerSection />)
  expect(await screen.findByText('Mitra Aman Uji')).not.toBeNull()
  const region = screen.getByRole('region')
  expect(within(region).queryByRole('link')).toBeNull()
  expect(within(region).queryByRole('img')).toBeNull()
})

test.each(['guest', 'operator'])(
  'role %s tidak bisa membuka pengelolaan kemitraan atau memanggil API',
  async (role) => {
    let requests = 0
    server.use(
      http.get('*/api/homepage/partners', () => {
        requests += 1
        return HttpResponse.json({ data: [] })
      }),
    )
    render(<KemitraanPage role={role} />)
    expect(screen.getByRole('alert').textContent).toContain(
      'tidak memiliki akses',
    )
    expect(screen.queryByRole('button', { name: 'Tambah Mitra' })).toBeNull()
    expect(requests).toBe(0)
  },
)
