import { expect, test, vi } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

test('FAQ terbuka memakai minus dan FAQ tertutup tetap plus saat diklik atau memakai keyboard', async () => {
  const faqs = [
    { id: 1, question: 'Bagaimana cara bergabung?', answer: 'Hubungi tim kemitraan.' },
    { id: 2, question: 'Bagaimana menghubungi tim?', answer: 'Gunakan halaman kontak.' },
  ]
  vi.stubGlobal('IntersectionObserver', class {
    observe() {}
    disconnect() {}
  })
  server.use(
    http.get('*/api/public/about/faqs', () => HttpResponse.json({ success: true, data: faqs })),
    http.get('*/api/public/about*', () => HttpResponse.json({ success: true, data: [] })),
    http.get('*/api/public/page-banners/:page', () => HttpResponse.json({ success: true, data: null })),
  )
  const user = userEvent.setup()
  try {
    render(<TentangPage />)
    const first = await screen.findByRole('button', { name: faqs[0].question })
    const second = screen.getByRole('button', { name: faqs[1].question })

    const expectIcon = (button, expanded) => {
      expect(button.getAttribute('aria-expanded')).toBe(String(expanded))
      expect(button.querySelector(expanded ? '.lucide-minus' : '.lucide-plus')).not.toBeNull()
      expect(button.querySelector(expanded ? '.lucide-plus' : '.lucide-minus')).toBeNull()
      expect(button.querySelector('svg').parentElement.classList.contains('rotate-45')).toBe(false)
    }

    expectIcon(first, true)
    expectIcon(second, false)
    await user.click(second)
    expectIcon(first, false)
    expectIcon(second, true)
    await user.keyboard('{Enter}')
    expectIcon(second, false)
    await user.keyboard(' ')
    expectIcon(second, true)
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
