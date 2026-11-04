import { expect, test } from 'vitest'
import { renderToStaticMarkup } from 'react-dom/server'
import { within } from '@testing-library/react'
import TentangPage from '../src/pages/FrontPage/TentangPage'

function renderPage() {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(<TentangPage />)
  return within(container)
}

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
  expect(title.classList.contains('text-[length:calc(var(--text-4xl)*0.7)]')).toBe(true)
  expect(banner.classList.contains('mx-3')).toBe(true)
  expect(banner.classList.contains('md:mx-4')).toBe(true)
  expect(banner.classList.contains('w-3/5')).toBe(false)
})
