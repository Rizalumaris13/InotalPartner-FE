import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from './setup'
import KontakInboxPage from '../src/pages/KontakInboxPage'

const messages = Array.from({ length: 24 }, (_, index) => ({
  id: index + 1,
  name: `Pengirim Uji ${index + 1}`,
  email: `sender-${index + 1}@example.test`,
  subject: `Pesan Uji ${index + 1}`,
  message: 'Pesan fixture untuk pengujian kotak masuk.',
  status: index % 2 ? 'read' : 'unread',
  created_at: new Date(Date.UTC(2026, 0, 1, 0, index)).toISOString(),
}))

beforeEach(() => {
  server.use(http.get('*/api/contacts', () => HttpResponse.json({ success: true, data: messages })))
})

describe('inbox filter and pagination contract', () => {
  it('keeps a repeated active filter on its current page but resets a changed filter', async () => {
    render(<KontakInboxPage />)
    await screen.findByText('Pesan Uji 24')
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
    expect(screen.getByText('2 / 3')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Semua', exact: true }))
    expect(screen.getByText('2 / 3')).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Sudah Dibaca', exact: true }))
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeTruthy())
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
    fireEvent.click(screen.getByRole('button', { name: 'Sudah Dibaca', exact: true }))
    expect(screen.getByText('2 / 2')).toBeTruthy()
  })

  it('resets the page when raw search changes, even if whitespace matches the same messages', async () => {
    render(<KontakInboxPage />)
    await screen.findByText('Pesan Uji 24')
    fireEvent.click(screen.getByRole('button', { name: 'Berikutnya' }))
    fireEvent.change(screen.getByPlaceholderText('Cari nama, email, profesi, subjek, atau isi pesan...'), { target: { value: ' ' } })
    await waitFor(() => expect(screen.getByText('1 / 3')).toBeTruthy())
    expect(screen.getByText('Pesan Uji 24')).toBeTruthy()
  })

  it('preserves descending newest-first order and the explicit list request parameters', async () => {
    let query
    server.use(http.get('*/api/contacts', ({ request }) => {
      query = new URL(request.url).searchParams
      return HttpResponse.json({ success: true, data: { items: messages } })
    }))
    render(<KontakInboxPage />)
    await screen.findByText('Pesan Uji 24')
    const rows = screen.getAllByRole('listitem')
    expect(rows[0].textContent).toContain('Pesan Uji 24')
    expect(rows.at(-1).textContent).toContain('Pesan Uji 15')
    expect(query.get('page')).toBe('1')
    expect(query.get('limit')).toBe('100')
  })
})
