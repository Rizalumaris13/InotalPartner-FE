import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import PublicPageBanner from '../src/components/PublicPageBanner'
import { server } from './setup'

const remote = {
  page: 'tentang',
  label: 'Label Dari Backend',
  title: 'Judul Dari Backend',
  description: 'Deskripsi banner yang diatur admin lewat dashboard.',
  image_url: '/uploads/tentang-baru.webp',
}

test('banner publik menampilkan konfigurasi backend bila tersedia', async () => {
  server.use(http.get('*/api/public/page-banners/tentang', () => HttpResponse.json({ success: true, data: remote })))
  render(<PublicPageBanner pageKey="tentang" breadcrumb="Tentang Kami" onNavigate={() => {}} />)
  expect(await screen.findByRole('heading', { name: 'Judul Dari Backend' })).not.toBeNull()
  expect(screen.getByText('Label Dari Backend')).not.toBeNull()
  expect(screen.getByText('Deskripsi banner yang diatur admin lewat dashboard.')).not.toBeNull()
})

test('URL gambar admin yang mengandung apostrof tetap menjadi background publik', async () => {
  const image = "https://images.example.test/team's-banner.webp"
  server.use(http.get('*/api/public/page-banners/tentang', () => HttpResponse.json({
    success: true,
    data: { ...remote, image_url: image },
  })))
  render(<PublicPageBanner pageKey="tentang" breadcrumb="Tentang Kami" />)
  const title = await screen.findByRole('heading', { name: remote.title })
  expect(title.closest('section').querySelector('[style]').style.backgroundImage).toContain(image)
})

test.each([
  ['null', () => HttpResponse.json({ success: true, data: null })],
  ['404', () => HttpResponse.json({ success: false, message: 'Not Found' }, { status: 404 })],
  ['500', () => HttpResponse.json({ success: false, message: 'Gagal' }, { status: 500 })],
])('banner publik memakai teks bawaan saat backend %s', async (_label, handler) => {
  server.use(http.get('*/api/public/page-banners/kontak', handler))
  render(<PublicPageBanner pageKey="kontak" breadcrumb="Hubungi Kami" onNavigate={() => {}} />)
  expect(await screen.findByRole('heading', { name: 'Hubungi Kami' })).not.toBeNull()
  expect(screen.getByText('Kontak — Kami Siap Membantu')).not.toBeNull()
  expect(screen.getByText('Beranda')).not.toBeNull()
})
