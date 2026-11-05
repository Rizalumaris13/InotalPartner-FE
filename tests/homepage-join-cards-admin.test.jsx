import { expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import DashboardPage from '../src/pages/DashboardPage'
import { DEFAULT_JOIN_IMAGES } from '../src/data/homepageJoinImages'
import { server } from './setup'

// Grafik bukan target tes ini; browser QA tetap merender dashboard asli.
vi.mock('../src/components/MonthlyActivityChart', () => ({ default: () => null }))
vi.mock('../src/components/ServiceDistributionChart', () => ({ default: () => null }))

const initial = Array.from({ length: 6 }, (_, index) => ({
  position: index + 1, title: `Judul awal ${index + 1}`, description: `Deskripsi awal ${index + 1}.`,
}))

test('admin membuka Kartu Teks, mengedit keenam kartu, lalu menyimpan dan membaca ulang tanpa mengubah foto', async () => {
  const updated = initial.map((card) => ({ ...card,
    title: `Judul baru ${card.position}`, description: `Deskripsi baru ${card.position}.\nBaris kedua.`,
  }))
  let record = initial
  let reads = 0
  let writes = 0
  let payload
  server.use(
    http.get('*/api/homepage/join-cards', () => {
      reads += 1
      return HttpResponse.json({ success: true, data: record })
    }),
    http.put('*/api/homepage/join-cards', async ({ request }) => {
      writes += 1
      payload = await request.json()
      record = payload.cards
      return HttpResponse.json({ success: true, data: record })
    }),
    http.get('*/api/homepage/join-images', () => HttpResponse.json({ success: true, data: DEFAULT_JOIN_IMAGES })),
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: [], meta: { total: 0 } })),
  )
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'admin', full_name: 'Admin Uji Kartu' }))
  const user = userEvent.setup()
  render(<DashboardPage onNavigate={() => {}} />)
  await user.click(screen.getByRole('button', { name: 'Home Page', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Mengapa Bergabung', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Kartu Teks', exact: true }))
  const form = await screen.findByRole('form', { name: 'Kartu teks Mengapa Bergabung' })
  expect(screen.getByText('Home Page / Mengapa Bergabung / Kartu Teks')).not.toBeNull()
  expect(screen.getByRole('button', { name: 'Banner Halaman' }).getAttribute('aria-expanded')).toBe('false')
  for (const card of updated) {
    const number = String(card.position).padStart(2, '0')
    const title = within(form).getByLabelText(`Judul kartu ${number}`)
    const description = within(form).getByLabelText(`Deskripsi kartu ${number}`)
    await user.clear(title)
    await user.type(title, ` ${card.title} `)
    await user.clear(description)
    await user.type(description, card.description)
  }
  const preview = screen.getByRole('region', { name: 'Pratinjau kartu Mengapa Bergabung' })
  expect(within(preview).getAllByRole('article')).toHaveLength(updated.length)
  for (const card of updated) {
    expect(within(preview).getByRole('heading', { name: card.title })).not.toBeNull()
    expect(preview.textContent).toContain(card.description)
  }
  expect(writes).toBe(0)
  await user.click(within(form).getByRole('button', { name: 'Simpan Kartu' }))
  expect(await screen.findByText('Keenam kartu berhasil disimpan.')).not.toBeNull()
  expect(payload).toEqual({ cards: updated })
  expect(reads).toBe(2)
  expect(writes).toBe(1)
  await user.click(screen.getByRole('button', { name: 'Gambar Kolase', exact: true }))
  const imagesForm = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
  expect(within(imagesForm).getByLabelText('URL foto tengah (utama)').value).toBe(DEFAULT_JOIN_IMAGES.center_url)
  await user.click(screen.getByRole('button', { name: 'Kartu Teks', exact: true }))
  const reopened = await screen.findByRole('form', { name: 'Kartu teks Mengapa Bergabung' })
  for (const card of updated) {
    const number = String(card.position).padStart(2, '0')
    expect(within(reopened).getByLabelText(`Judul kartu ${number}`).value).toBe(card.title)
    expect(within(reopened).getByLabelText(`Deskripsi kartu ${number}`).value).toBe(card.description)
  }
  expect(reads).toBe(3)
  expect(writes).toBe(1)
  expect(Object.keys(localStorage)).toEqual(['inotal_user'])
})
