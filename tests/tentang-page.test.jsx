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
