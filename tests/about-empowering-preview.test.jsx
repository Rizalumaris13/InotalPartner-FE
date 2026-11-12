import { beforeEach, expect, test } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import AboutEmpoweringPage from '../src/pages/AboutEmpoweringPage'
import { previewAboutCards } from '../src/data/aboutCards'
import { DEFAULT_ABOUT_EMPOWERING } from '../src/data/aboutEmpowering'
import { server } from './setup'

const savedCards = previewAboutCards.map((card) => ({ ...card, title: `Tersimpan: ${card.title}` }))

beforeEach(() => {
  server.use(
    http.get('*/api/about/empowering', () => HttpResponse.json({ success: true, data: null })),
    http.get('*/api/public/about/cards', () => HttpResponse.json({ success: true, data: savedCards })),
  )
})

test('preview admin menampilkan judul hidup beserta seluruh kartu tanpa navigasi atau submit dari kartu', async () => {
  let writes = 0
  server.use(http.post('*/api/about/empowering', () => {
    writes += 1
    return HttpResponse.json({ success: true })
  }))
  const user = userEvent.setup()
  const originalHash = window.location.hash
  render(<AboutEmpoweringPage role="admin" />)
  const preview = within(await screen.findByRole('region', { name: 'Pratinjau Memberdayakan Bisnis' }))
  await preview.findByRole('heading', { name: savedCards[0].title })
  const articles = preview.getAllByRole('article')
  expect(articles).toHaveLength(savedCards.length)
  expect(articles.map((article) => within(article).getByRole('heading').textContent)).toEqual(savedCards.map((card) => card.title))
  for (const [index, article] of articles.entries()) {
    expect(within(article).getByText(savedCards[index].description)).not.toBeNull()
    expect(within(article).getByText(String(index + 1).padStart(2, '0'))).not.toBeNull()
  }
  expect(preview.queryAllByRole('link')).toHaveLength(0)
  await user.clear(screen.getByLabelText('Judul utama'))
  await user.type(screen.getByLabelText('Judul utama'), 'Judul yang sedang diedit')
  expect(preview.getByRole('heading', { name: `Judul yang sedang diedit ${DEFAULT_ABOUT_EMPOWERING.title_accent}` })).not.toBeNull()
  for (const action of preview.getAllByText('Selengkapnya')) await user.click(action)
  expect(writes).toBe(0)
  expect(window.location.hash).toBe(originalHash)
  expect(screen.getByLabelText('Judul utama').value).toBe('Judul yang sedang diedit')
  expect(preview.getAllByRole('article')).toHaveLength(savedCards.length)
})

test('preview 404 menampilkan tiga kartu referensi dengan label contoh dan simpan tetap nonaktif', async () => {
  server.use(
    http.get('*/api/about/empowering', () => new HttpResponse(null, { status: 404 })),
    http.get('*/api/public/about/cards', () => new HttpResponse(null, { status: 404 })),
  )
  render(<AboutEmpoweringPage role="admin" />)
  const preview = within(await screen.findByRole('region', { name: 'Pratinjau Memberdayakan Bisnis' }))
  expect(await preview.findByText(/Pratinjau kartu lama/)).not.toBeNull()
  for (const card of previewAboutCards) expect(preview.getByRole('heading', { name: card.title })).not.toBeNull()
  expect(preview.getAllByRole('article')).toHaveLength(previewAboutCards.length)
  expect(preview.queryAllByRole('link')).toHaveLength(0)
  expect(screen.getByRole('button', { name: 'Buat Pengaturan' }).disabled).toBe(true)
})

test('preview mengikuti koleksi kosong tanpa mengarang kartu contoh', async () => {
  server.use(http.get('*/api/public/about/cards', () => HttpResponse.json({ success: true, data: [] })))
  render(<AboutEmpoweringPage role="admin" />)
  const preview = within(await screen.findByRole('region', { name: 'Pratinjau Memberdayakan Bisnis' }))
  expect(await preview.findByText('Belum ada kartu pada bagian ini.')).not.toBeNull()
  expect(preview.queryByRole('article')).toBeNull()
  expect(preview.queryByText('Solusi Terukur')).toBeNull()
})

test('Coba Lagi pada preview hanya membaca kartu dan tidak menyimpan atau membuang draf', async () => {
  let reads = 0
  let writes = 0
  server.use(
    http.get('*/api/public/about/cards', () => {
      reads += 1
      return reads === 1
        ? HttpResponse.json({ success: false, message: 'Kartu belum dapat dibaca.' }, { status: 500 })
        : HttpResponse.json({ success: true, data: savedCards })
    }),
    http.post('*/api/about/empowering', () => { writes += 1; return HttpResponse.json({ success: false }) }),
  )
  const user = userEvent.setup()
  render(<AboutEmpoweringPage role="admin" />)
  const preview = within(await screen.findByRole('region', { name: 'Pratinjau Memberdayakan Bisnis' }))
  expect((await preview.findByRole('alert')).textContent).toBe('Kartu belum dapat dibaca.')
  expect(preview.queryByRole('article')).toBeNull()
  await user.clear(screen.getByLabelText('Judul utama'))
  await user.type(screen.getByLabelText('Judul utama'), 'Draf yang tidak boleh hilang')
  await user.click(preview.getByRole('button', { name: 'Coba Lagi' }))
  expect(await preview.findByRole('heading', { name: savedCards[0].title })).not.toBeNull()
  expect(reads).toBe(2)
  expect(writes).toBe(0)
  expect(screen.getByLabelText('Judul utama').value).toBe('Draf yang tidak boleh hilang')
})
