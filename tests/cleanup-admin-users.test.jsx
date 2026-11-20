import { expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import UserPage from '../src/pages/UserPage'
import api from '../src/api/axios'
import { server } from './setup'

function signIn(role) {
  localStorage.setItem('inotal_token', 'cleanup-users-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ id: 1, role, full_name: 'Saya' }))
}

const users = [
  { id: 1, full_name: 'Saya', email: 'self@example.test', role: 'admin' },
  { id: 2, full_name: 'Admin lain', email: 'admin@example.test', role: { name: 'admin' } },
  { id: 3, full_name: 'Super lain', email: 'super@example.test', role: 'super_admin' },
  { id: 4, full_name: 'Operator lain', email: 'operator@example.test', role: { name: 'operator' } },
  { id: 5, full_name: 'Tamu lain', email: 'guest@example.test', role: null },
]

function listResponse(data = users, page = 1, totalPages = 1) {
  return HttpResponse.json({ data: { data, page, total_pages: totalPages } })
}

test.each(['admin', 'super_admin', 'operator', 'guest', { name: 'admin' }, null])('user action gates preserve self/hierarchy protections and null-session safety for %j', async (role) => {
  if (role !== null) signIn(role)
  server.use(http.get('*/api/users', () => listResponse()))
  render(<UserPage />)
  const table = await screen.findByRole('table')
  const rows = within(table).getAllByRole('row').slice(1)
  const canManage = role === 'admin' || role === 'super_admin'
  expect(within(table).queryByRole('columnheader', { name: 'Aksi' }) !== null).toBe(canManage)
  rows.forEach((row, index) => {
    const buttons = within(row).queryAllByRole('button')
    if (!canManage) {
      expect(buttons).toHaveLength(0)
      return
    }
    const protectedRow = index === 0 || (role === 'admin' && (index === 1 || index === 2))
    expect(buttons).toHaveLength(2)
    expect(buttons.every((button) => button.disabled)).toBe(protectedRow)
    expect(buttons[0].title).toBe(protectedRow ? 'Tidak memiliki izin untuk mengubah akun ini' : 'Edit Role User')
    expect(buttons[1].title).toBe(protectedRow ? 'Tidak memiliki izin untuk menghapus akun ini' : 'Hapus User')
  })
  expect(screen.queryByText('Ubah Role User')).toBeNull()
})

test.each(['admin', 'super_admin'])('role modal for %s preserves draft on error and resets on cancel/success', async (role) => {
  signIn(role)
  let reads = 0
  const writes = []
  let failSave = true
  server.use(
    http.get('*/api/users', () => { reads += 1; return listResponse() }),
    http.put('*/api/users/:id', async ({ request, params }) => {
      writes.push({ id: params.id, payload: await request.json() })
      return failSave ? HttpResponse.json({ message: 'Role ditolak server' }, { status: 400 }) : HttpResponse.json({ data: {} })
    }),
  )
  render(<UserPage />)
  const user = userEvent.setup()
  const operatorRow = (await screen.findByText('Operator lain')).closest('tr')
  await user.click(within(operatorRow).getByTitle('Edit Role User'))
  expect(screen.getByRole('combobox').value).toBe('operator')
  expect(screen.queryByRole('option', { name: 'Super Admin' }) !== null).toBe(role === 'super_admin')
  await user.selectOptions(screen.getByRole('combobox'), 'admin')
  await user.click(screen.getByRole('button', { name: 'Batal' }))
  expect(screen.queryByText('Ubah Role User')).toBeNull()
  expect(writes).toEqual([])
  await user.click(within(operatorRow).getByTitle('Edit Role User'))
  expect(screen.getByRole('combobox').value).toBe('operator')
  await user.selectOptions(screen.getByRole('combobox'), 'guest')
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  expect(await screen.findByText('Role ditolak server')).not.toBeNull()
  expect(screen.getByText('Ubah Role User')).not.toBeNull()
  expect(screen.getByRole('combobox').value).toBe('guest')
  expect(reads).toBe(1)
  failSave = false
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  await waitFor(() => expect(screen.queryByText('Ubah Role User')).toBeNull())
  await screen.findByText('Operator lain')
  expect(screen.getByRole('status').textContent).toContain('Role pengguna berhasil diperbarui.')
  expect(writes).toEqual([{ id: '4', payload: { role: 'guest' } }, { id: '4', payload: { role: 'guest' } }])
  expect(reads).toBe(2)
  await user.click(within((await screen.findByText('Tamu lain')).closest('tr')).getByTitle('Edit Role User'))
  expect(screen.getByRole('combobox').value).toBe('guest')
})

test('user delete retains confirmation, endpoint and refetch ownership', async () => {
  signIn('admin')
  const deletes = []
  let data = users
  let reads = 0
  server.use(
    http.get('*/api/users', () => { reads += 1; return listResponse(data) }),
    http.delete('*/api/users/:id', ({ params }) => { deletes.push(params.id); data = data.filter((user) => user.id !== Number(params.id)); return HttpResponse.json({}) }),
  )
  render(<UserPage />)
  const user = userEvent.setup()
  const row = (await screen.findByText('Operator lain')).closest('tr')
  await user.click(within(row).getByTitle('Hapus User'))
  expect(screen.getByRole('alertdialog').textContent).toContain('Apakah Anda yakin ingin menghapus user "Operator lain"? Tindakan ini tidak dapat dibatalkan.')
  await user.click(screen.getByRole('button', { name: 'Batal' }))
  expect(deletes).toEqual([])
  await user.click(within(row).getByTitle('Hapus User'))
  await user.click(screen.getByRole('button', { name: 'Ya, hapus' }))
  await waitFor(() => expect(screen.queryByText('Operator lain')).toBeNull())
  expect(deletes).toEqual(['4'])
  expect(reads).toBe(2)
})

test('user search still waits 500ms and trims only at the API boundary', async () => {
  signIn('admin')
  vi.useFakeTimers()
  try {
    const get = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: { data: users, page: 1, total_pages: 1 } } })
    render(<UserPage />)
    await act(async () => {})
    expect(get).toHaveBeenCalledExactlyOnceWith('/users', { params: { page: 1, limit: 10, search: '' } })
    fireEvent.change(screen.getByPlaceholderText('Cari user...'), { target: { value: '  Alpha  ' } })
    await act(async () => { await vi.advanceTimersByTimeAsync(499) })
    expect(get).toHaveBeenCalledTimes(1)
    await act(async () => { await vi.advanceTimersByTimeAsync(1) })
    expect(get).toHaveBeenLastCalledWith('/users', { params: { page: 1, limit: 10, search: 'Alpha' } })
    expect(get).toHaveBeenCalledTimes(2)
    expect(screen.getByPlaceholderText('Cari user...').value).toBe('  Alpha  ')
  } finally {
    vi.useRealTimers()
  }
})

test('user pagination still accepts corrected server pages', async () => {
  signIn('admin')
  const pages = []
  server.use(http.get('*/api/users', ({ request }) => {
    pages.push(new URL(request.url).searchParams.get('page'))
    return listResponse(users, 1, 2)
  }))
  render(<UserPage />)
  const user = userEvent.setup()
  await screen.findByText('Operator lain')
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await waitFor(() => expect(pages).toEqual(['1', '2', '1']))
  await screen.findByRole('table')
  expect(screen.getByText('Halaman', { exact: false }).textContent).toBe('Halaman 1 dari 2')
})
