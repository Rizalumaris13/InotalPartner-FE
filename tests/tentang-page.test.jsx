import { expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { render, screen, waitFor, within } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import TentangPage from '../src/pages/FrontPage/TentangPage'
import { server } from './setup'

function renderPage() {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(<TentangPage />)
  return within(container)
}

test('Tentang memuat gambar dari resource yang sama dengan editor tanpa request banner kedua', async () => {
  const bannerRequests = []
  const banner = {
    page: 'tentang',
    label: 'Tentang INOTAL',
    title: 'Banner dari dashboard',
    description: 'Gambar dan teks pilihan admin.',
    image_url: '/uploads/tentang-dari-admin.webp',
  }
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  })
  server.use(
    http.get('*/api/public/about*', () => HttpResponse.json({ success: true, data: [] })),
    http.get('*/api/public/page-banners/:page', ({ params }) => {
      bannerRequests.push(params.page)
      return HttpResponse.json({ success: true, data: banner })
    }),
  )
  try {
    render(<TentangPage />)
    const title = await screen.findByRole('heading', { name: banner.title })
    await waitFor(() => expect(screen.queryByText('Memuat video profil...')).toBeNull())
    expect(title.closest('section').querySelector('[style]').style.backgroundImage).toContain(banner.image_url)
    expect(bannerRequests).toEqual(['tentang'])
  } finally {
    vi.unstubAllGlobals()
  }
})

test('halaman Tentang tidak menampilkan tombol Hubungi Kami', () => {
  const page = renderPage()

  expect(
    page.getByRole('heading', {
      name: 'Memberdayakan Bisnis dengan Keahlian.',
    }),
  ).not.toBeNull()
  expect(page.queryByRole('button', { name: 'Hubungi Kami' })).toBeNull()
})

test('banner Tentang memakai tinggi ringkas tanpa mengubah lebar banner', () => {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(<TentangPage />)
  const title = within(container).getByRole('heading', { name: 'Tentang Kami' })
  const banner = title.closest('section')
  const content = banner.querySelector('.relative.max-w-7xl')

  expect(content.classList.contains('py-6')).toBe(true)
  expect(content.classList.contains('md:py-24')).toBe(false)
  expect(title.classList.contains('text-2xl')).toBe(true)
  expect(title.classList.contains('lg:leading-[calc(var(--text-7xl)*1.05)]')).toBe(true)
  expect(banner.classList.contains('mx-3')).toBe(true)
  expect(banner.classList.contains('md:mx-4')).toBe(true)
  expect(banner.classList.contains('w-3/5')).toBe(false)
})
