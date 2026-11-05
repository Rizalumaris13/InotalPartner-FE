import { expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import DashboardPage from '../src/pages/DashboardPage'
import { server } from './setup'

const initialImages = {
  top_left_url: '/uploads/kiri-lama.png',
  center_url: '/uploads/tengah-lama.png',
  bottom_right_url: '/uploads/kanan-lama.png',
}
const slots = [
  ['foto kiri atas', 'top_left_url', 'Tim diskusi'],
  ['foto tengah (utama)', 'center_url', 'Kolaborasi'],
  ['foto kanan bawah', 'bottom_right_url', 'Kemitraan'],
]

test('menu dashboard membuka editor tiga foto, menyimpan hanya URL gambar, dan membaca ulang hasilnya', async () => {
  let stored = initialImages
  let payload
  let reads = 0
  server.use(
    http.get('*/api/homepage/join-images', () => {
      reads += 1
      return HttpResponse.json({ success: true, data: stored })
    }),
    http.put('*/api/homepage/join-images', async ({ request }) => {
      payload = await request.json()
      stored = payload
      return HttpResponse.json({ success: true, data: stored })
    }),
  )
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'admin', full_name: 'Admin Uji' }))
  vi.stubGlobal('ResizeObserver', class {
    observe() {}
    unobserve() {}
    disconnect() {}
  })
  try {
    const user = userEvent.setup()
    render(<DashboardPage />)
    await user.click(screen.getByRole('button', { name: 'Home Page', exact: true }))
    await user.click(screen.getByRole('button', { name: 'Mengapa Bergabung', exact: true }))
    await user.click(screen.getByRole('button', { name: 'Gambar Kolase', exact: true }))
    const form = await screen.findByRole('form', { name: 'Gambar kolase Mengapa Bergabung' })
    const expected = {}
    for (const [label, key] of slots) {
      const input = within(form).getByLabelText(`URL ${label}`)
      expect(input.value).toBe(initialImages[key])
      expected[key] = `/uploads/${key}-baru.webp`
      await user.clear(input)
      await user.type(input, expected[key])
    }
    await user.click(within(form).getByRole('button', { name: 'Simpan Gambar' }))
    expect(await screen.findByText('Gambar kolase berhasil disimpan.')).not.toBeNull()
    expect(payload).toEqual(expected)
    expect(reads).toBe(2)
    const preview = screen.getByRole('region', { name: 'Pratinjau kolase Mengapa Bergabung' })
    for (const [, key, alt] of slots) {
      expect(within(preview).getByAltText(alt).getAttribute('src')).toBe(expected[key])
    }
  } finally {
    vi.unstubAllGlobals()
  }
})
