import { afterEach, expect, test, vi } from 'vitest'
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import KartuTentangPage from '../src/pages/KartuTentangPage'
import * as cardsApi from '../src/api/aboutCards'
import { server } from './setup'

const card = { id: 1, title: 'Kartu uji akses', description: 'Deskripsi kartu uji akses.', icon: 'rocket', url: '#kontak', sort_order: 1 }
const operations = [
  { kind: 'create', method: 'post', path: '/api/about/cards', api: 'createAboutCardApi' },
  { kind: 'update', method: 'put', path: '/api/about/cards/1', api: 'updateAboutCardApi' },
  { kind: 'delete', method: 'delete', path: '/api/about/cards/1', api: 'deleteAboutCardApi' },
]

function gate() {
  let release
  const promise = new Promise((resolve) => { release = resolve })
  return { promise, release }
}

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

async function startMutation(user, kind) {
  await screen.findByRole('rowheader', { name: card.title })
  if (kind === 'delete') {
    await user.click(screen.getByRole('button', { name: `Hapus ${card.title}` }))
    await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Ya, Hapus Kartu' }))
    return
  }
  await user.click(screen.getByRole('button', { name: kind === 'create' ? 'Tambah Kartu' : `Edit ${card.title}`, exact: true }))
  const form = within(screen.getByRole('dialog'))
  if (kind === 'create') {
    await user.type(form.getByLabelText('Judul'), 'Kartu baru uji akses')
    await user.type(form.getByLabelText('Deskripsi'), 'Deskripsi kartu baru untuk uji akses.')
    await user.selectOptions(form.getByLabelText('Ikon'), 'rocket')
    await user.type(form.getByLabelText('URL Tujuan'), '#kontak')
  }
  await user.click(form.getByRole('button', { name: kind === 'create' ? 'Simpan Kartu' : 'Simpan Perubahan', exact: true }))
}

test.each(operations)('$kind tidak memulai GET terlambat setelah hak akses dicabut saat write', async ({ kind, method, path, api }) => {
  const writeGate = gate()
  const started = gate()
  const read = vi.spyOn(cardsApi, 'listAboutCardsApi')
  const write = vi.spyOn(cardsApi, api)
  server.use(
    http.get('*/api/about/cards', () => HttpResponse.json({ success: true, data: [card] })),
    http[method](`*${path}`, async ({ request }) => {
      started.release()
      await writeGate.promise
      const data = kind === 'delete' ? null : { id: kind === 'create' ? 2 : card.id, ...await request.json() }
      return HttpResponse.json({ success: true, data }, { status: kind === 'create' ? 201 : 200 })
    }),
  )
  const user = userEvent.setup()
  const { rerender } = render(<KartuTentangPage role={{ name: 'admin' }} />)
  try {
    await startMutation(user, kind)
    await started.promise
    expect(read).toHaveBeenCalledTimes(1)
    rerender(<KartuTentangPage role={{ name: 'guest' }} />)
    expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
    await act(async () => {
      writeGate.release()
      await write.mock.results[0].value
      await Promise.resolve()
      await Promise.all(read.mock.results.map(({ value }) => value))
    })
    expect(read).toHaveBeenCalledTimes(1)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  } finally {
    writeGate.release()
  }
})

test.each(operations)('$kind membatalkan GET verifikasi yang berjalan saat editor ditutup oleh pencabutan akses', async ({ kind, method, path }) => {
  const readGate = gate()
  const read = vi.spyOn(cardsApi, 'listAboutCardsApi')
  let stored = [card]
  let pendingRead = false
  server.use(
    http[method](`*${path}`, async ({ request }) => {
      const saved = kind === 'delete' ? null : { id: kind === 'create' ? 2 : card.id, ...await request.json() }
      stored = kind === 'delete' ? [] : kind === 'create' ? [card, saved] : [saved]
      pendingRead = true
      return HttpResponse.json({ success: true, data: saved }, { status: kind === 'create' ? 201 : 200 })
    }),
    http.get('*/api/about/cards', async () => {
      if (pendingRead) await readGate.promise
      return HttpResponse.json({ success: true, data: stored })
    }),
  )
  const user = userEvent.setup()
  const { rerender } = render(<KartuTentangPage role="admin" />)
  try {
    await startMutation(user, kind)
    await waitFor(() => expect(read).toHaveBeenCalledTimes(2))
    const verification = read.mock.results[1].value
    // Attach both branches before cancellation so no rejected promise leaks.
    const outcome = verification.then(() => 'resolved', (error) => error.code)
    rerender(<KartuTentangPage role="guest" />)
    await act(async () => { readGate.release(); await outcome })
    expect(await outcome).toBe('ERR_CANCELED')
    expect(read).toHaveBeenCalledTimes(2)
    expect(screen.queryByRole('dialog')).toBeNull()
    expect(screen.queryByRole('alertdialog')).toBeNull()
    expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  } finally {
    readGate.release()
  }
})
