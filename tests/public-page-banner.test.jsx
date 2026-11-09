import { expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import { http, HttpResponse } from 'msw'
import PublicPageBanner from '../src/components/PublicPageBanner'
import PublicNavbar from '../src/components/PublicNavbar'
import { DEFAULT_PAGE_BANNERS } from '../src/data/pageBanners'
import { server } from './setup'

const remote = {
  page: 'tentang',
  label: 'Label Dari Backend',
  title: 'Judul Dari Backend',
  description: 'Deskripsi banner yang diatur admin lewat dashboard.',
  image_url: '/uploads/tentang-baru.webp',
}

test('judul ringkas memakai skala 2xl tanpa mengubah logo navbar dan tinggi baris', () => {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(
    <>
      <PublicNavbar activePage="tentang" />
      <PublicPageBanner pageKey="tentang" breadcrumb="Tentang Kami" compactTitle />
    </>,
  )
  const logo = container.querySelector('nav button > span')
  const title = container.querySelector('h1')
  expect(logo.classList.contains('text-lg')).toBe(true)
  expect(title.classList.contains('text-2xl')).toBe(true)
  expect(title.className).not.toContain('text-[length:calc(')
  expect(title.classList.contains('leading-[calc(var(--text-4xl)*1.05)]')).toBe(true)
  expect(title.classList.contains('md:leading-[calc(var(--text-6xl)*1.05)]')).toBe(true)
  expect(title.classList.contains('lg:leading-[calc(var(--text-7xl)*1.05)]')).toBe(true)
  expect(title.textContent).toBe(DEFAULT_PAGE_BANNERS.tentang.title)
})

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

test.each(Object.keys(DEFAULT_PAGE_BANNERS))(
  'banner %s memakai judul 70 persen dari skala sebelumnya',
  (pageKey) => {
    const container = document.createElement('div')
    container.innerHTML = renderToStaticMarkup(
      <PublicPageBanner pageKey={pageKey} breadcrumb="Halaman" />,
    )
    const title = container.querySelector('h1')
    const banner = title.closest('section')
    const content = banner.querySelector('.relative.max-w-7xl')

    expect(content.classList.contains('py-6')).toBe(true)
    expect(content.classList.contains('py-16')).toBe(false)
    expect(content.classList.contains('md:py-24')).toBe(false)
    expect(title.classList.contains('text-[length:calc(var(--text-4xl)*0.7)]')).toBe(true)
    expect(title.classList.contains('md:text-[length:calc(var(--text-6xl)*0.7)]')).toBe(true)
    expect(title.classList.contains('lg:text-[length:calc(var(--text-7xl)*0.7)]')).toBe(true)
    expect(title.classList.contains('leading-[1.5]')).toBe(true)
    expect(title.textContent).toBe(DEFAULT_PAGE_BANNERS[pageKey].title)
    expect(banner.textContent).toContain(DEFAULT_PAGE_BANNERS[pageKey].description)
    expect(banner.classList.contains('mx-3')).toBe(true)
    expect(banner.classList.contains('md:mx-4')).toBe(true)
  },
)
