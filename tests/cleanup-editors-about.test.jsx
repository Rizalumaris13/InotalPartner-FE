import { beforeEach, expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CreateAboutPage from '../src/pages/CreateAboutPage'
import * as about from '../src/api/about'

const titlePlaceholder = 'Orang-orang di Balik Ekosistem Ini.'
const namePlaceholder = 'Contoh: Dr. Budi Santoso'
const positionPlaceholder = 'Contoh: Chief Executive Officer / Founder'
const member = { id: 61, name: 'Anggota A', position: 'Direktur', photo_url: '/uploads/member.png', display_order: 4, is_active: false }
const active = { id: 99, name: 'Terpakai', display_order: 1, is_active: true }

function deferred() {
  let resolve
  let reject
  const promise = new Promise((done, fail) => { resolve = done; reject = fail })
  return { promise, resolve, reject }
}

beforeEach(() => {
  localStorage.setItem('inotal_token', 'cleanup-about-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ role: { name: 'super_admin' } }))
  vi.spyOn(about, 'getAboutSettingApi').mockResolvedValue({ team_title: 'Judul tersimpan', is_active: false })
  vi.spyOn(about, 'getTeamMembersApi').mockResolvedValue([active])
  vi.spyOn(about, 'getTeamMemberByIdApi').mockResolvedValue(null)
  // JSDOM has no scrolling geometry; this test only observes draft and request ownership.
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
})

test('About uses independent title/member drafts, fresh member data, and SAME-ID prop updates without remount', async () => {
  const { rerender } = render(<CreateAboutPage />)
  expect(screen.getByRole('spinbutton').value).toBe('1')
  await screen.findByDisplayValue('Judul tersimpan')
  await waitFor(() => expect(screen.getByRole('spinbutton').value).toBe('2'))
  const title = screen.getByPlaceholderText(titlePlaceholder)
  const name = screen.getByPlaceholderText(namePlaceholder)
  fireEvent.change(title, { target: { value: 'Draf judul jangan diganti' } })
  name.focus()
  vi.mocked(about.getTeamMemberByIdApi).mockResolvedValueOnce({ ...member, name: 'Data fresh' })
  rerender(<CreateAboutPage editingMember={member} />)
  expect(name.value).toBe(member.name)
  await waitFor(() => expect(name.value).toBe('Data fresh'))
  expect(screen.getByPlaceholderText(namePlaceholder)).toBe(name)
  expect(document.activeElement).toBe(name)
  expect(title.value).toBe('Draf judul jangan diganti')
  const sameId = { ...member, name: 'Prop pengganti', display_order: '7' }
  rerender(<CreateAboutPage editingMember={sameId} />)
  expect(name.value).toBe('Prop pengganti')
  expect(screen.getByRole('spinbutton').value).toBe('1')
  fireEvent.change(name, { target: { value: 'Draf lokal' } })
  rerender(<CreateAboutPage editingMember={sameId} onOpenList={() => {}} />)
  expect(name.value).toBe('Draf lokal')
  expect(about.getTeamMemberByIdApi.mock.calls).toEqual([[61], [61]])
  rerender(<CreateAboutPage editingMember={{ ...member, id: 62, name: 'Target B' }} />)
  expect(name.value).toBe('Target B')
  rerender(<CreateAboutPage />)
  expect(screen.getByRole('heading', { name: 'Tambah Anggota Tim' })).not.toBeNull()
  // Clearing the edit prop changes mode, not the draft; explicit cancel resets it.
  expect(name.value).toBe('Target B')
  expect(about.getAboutSettingApi).toHaveBeenCalledOnce()
  expect(about.getTeamMembersApi).toHaveBeenCalledOnce()
})

test('About title save does not change member draft and member save does not change title draft', async () => {
  const saveTitle = vi.spyOn(about, 'saveAboutSettingApi').mockResolvedValue({ team_title: 'Judul fresh', is_active: true })
  const create = vi.spyOn(about, 'createTeamMemberApi').mockResolvedValue({ id: 80 })
  render(<CreateAboutPage />)
  await screen.findByDisplayValue('Judul tersimpan')
  await waitFor(() => expect(screen.getByRole('spinbutton').value).toBe('2'))
  fireEvent.change(screen.getByPlaceholderText(namePlaceholder), { target: { value: '  Anggota baru  ' } })
  fireEvent.change(screen.getByPlaceholderText(positionPlaceholder), { target: { value: '  Posisi baru  ' } })
  fireEvent.change(screen.getByPlaceholderText(titlePlaceholder), { target: { value: '  Judul baru  ' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Judul' }))
  await screen.findByText('Pengaturan judul Tim Kami berhasil disimpan!')
  expect(saveTitle).toHaveBeenCalledExactlyOnceWith({ team_title: 'Judul baru', is_active: false })
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('  Anggota baru  ')
  expect(screen.getByPlaceholderText(positionPlaceholder).value).toBe('  Posisi baru  ')
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Anggota Tim' }))
  await screen.findByText('Anggota tim "Anggota baru" berhasil ditambahkan dengan status Aktif!')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Simpan Anggota Tim' }).disabled).toBe(false))
  expect(create).toHaveBeenCalledExactlyOnceWith({ name: 'Anggota baru', position: 'Posisi baru', photo_url: '', display_order: 2, is_active: true })
  expect(screen.getByPlaceholderText(titlePlaceholder).value).toBe('Judul fresh')
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('')
})

test('About cancel clears photo and fields, uses the first available order, and invokes edit callback', async () => {
  const onCancelEdit = vi.fn()
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cancel')
  const revoke = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const { container } = render(<CreateAboutPage editingMember={member} onCancelEdit={onCancelEdit} />)
  await screen.findByDisplayValue('Judul tersimpan')
  await waitFor(() => expect(about.getTeamMembersApi).toHaveBeenCalledOnce())
  const user = userEvent.setup()
  await user.upload(container.querySelector('input[type="file"]'), new File(['image'], 'cancel.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Batal Edit' }))
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('')
  expect(screen.getByPlaceholderText(positionPlaceholder).value).toBe('')
  expect(screen.getByRole('spinbutton').value).toBe('2')
  expect(screen.getByRole('checkbox', { name: 'Status Anggota' }).checked).toBe(true)
  expect(screen.queryByAltText('Preview Foto Anggota')).toBeNull()
  expect(revoke).toHaveBeenCalledWith('blob:cancel')
  expect(onCancelEdit).toHaveBeenCalledOnce()
})

test('About failed detail keeps seed; obsolete request and unmounted title/member loads are ignored', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const a = deferred()
  const b = deferred()
  vi.mocked(about.getTeamMemberByIdApi).mockReturnValueOnce(a.promise).mockReturnValueOnce(b.promise)
  const { rerender, unmount } = render(<CreateAboutPage editingMember={member} />)
  rerender(<CreateAboutPage editingMember={{ ...member, id: 62, name: 'Seed B' }} />)
  await act(async () => { b.reject(new Error('Detail gagal')) })
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('Seed B')
  await act(async () => { a.resolve({ ...member, name: 'Stale A' }) })
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('Seed B')
  const c = deferred()
  vi.mocked(about.getTeamMemberByIdApi).mockReturnValueOnce(c.promise)
  rerender(<CreateAboutPage editingMember={{ id: 63 }} />)
  unmount()
  render(<CreateAboutPage />)
  await act(async () => { c.resolve(member) })
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('')
})

test('About edit retries a failed write, reuploads, then resets with legacy fallback order on failed refresh', async () => {
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  const upload = vi.spyOn(about, 'uploadImageApi').mockResolvedValue('  /uploads/uploaded.png  ')
  const update = vi.spyOn(about, 'updateTeamMemberApi').mockRejectedValueOnce(new Error('Simpan gagal')).mockResolvedValue(member)
  const onFinishEdit = vi.fn()
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:about')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const { container } = render(<CreateAboutPage editingMember={member} onFinishEdit={onFinishEdit} />)
  await screen.findByDisplayValue('Judul tersimpan')
  await waitFor(() => expect(about.getTeamMembersApi).toHaveBeenCalledOnce())
  vi.mocked(about.getTeamMembersApi).mockRejectedValue(new Error('Refresh gagal'))
  const user = userEvent.setup()
  fireEvent.change(screen.getByPlaceholderText(namePlaceholder), { target: { value: '  Nama baru  ' } })
  fireEvent.change(screen.getByPlaceholderText(positionPlaceholder), { target: { value: '  Jabatan baru  ' } })
  await user.upload(container.querySelector('input[type="file"]'), new File(['image'], 'new.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  await screen.findByText('Simpan gagal')
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('  Nama baru  ')
  expect(onFinishEdit).not.toHaveBeenCalled()
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  await waitFor(() => expect(onFinishEdit).toHaveBeenCalledOnce())
  expect(upload).toHaveBeenCalledTimes(2)
  expect(update.mock.calls).toEqual(Array.from({ length: 2 }, () => [61, { name: 'Nama baru', position: 'Jabatan baru', photo_url: '/uploads/uploaded.png', display_order: 4, is_active: false }]))
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('')
  expect(screen.getByRole('spinbutton').value).toBe('5')
  expect(screen.queryByAltText('Preview Foto Anggota')).toBeNull()
  expect(screen.getByPlaceholderText(titlePlaceholder).value).toBe('Judul tersimpan')
})

test('About success retains the current order before the legacy failed-refresh increment', async () => {
  const write = deferred()
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(about, 'createTeamMemberApi').mockReturnValue(write.promise)
  render(<CreateAboutPage />)
  await screen.findByDisplayValue('Judul tersimpan')
  await waitFor(() => expect(screen.getByRole('spinbutton').value).toBe('2'))
  vi.mocked(about.getTeamMembersApi).mockRejectedValue(new Error('Refresh gagal'))
  fireEvent.change(screen.getByPlaceholderText(namePlaceholder), { target: { value: 'Nama' } })
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Anggota Tim' }))
  // The baseline leaves the order input editable while saving.
  fireEvent.change(screen.getByRole('spinbutton'), { target: { value: '8' } })
  await act(async () => { write.resolve({ id: 1 }) })
  expect(screen.getByRole('spinbutton').value).toBe('9')
})

test('About rejects an empty upload URL and preserves draft until valid upload succeeds', async () => {
  vi.spyOn(about, 'uploadImageApi').mockResolvedValue('  ')
  const create = vi.spyOn(about, 'createTeamMemberApi')
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:empty')
  vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {})
  const { container } = render(<CreateAboutPage />)
  await screen.findByDisplayValue('Judul tersimpan')
  await waitFor(() => expect(screen.getByRole('spinbutton').value).toBe('2'))
  fireEvent.change(screen.getByPlaceholderText(namePlaceholder), { target: { value: 'Nama' } })
  await userEvent.setup().upload(container.querySelector('input[type="file"]'), new File(['image'], 'empty.png', { type: 'image/png' }))
  fireEvent.click(screen.getByRole('button', { name: 'Simpan Anggota Tim' }))
  await screen.findByText('Gagal mendapatkan URL foto dari server.')
  expect(create).not.toHaveBeenCalled()
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('Nama')
})

test('About cancelling while detail is pending ignores the eventual response', async () => {
  const request = deferred()
  vi.mocked(about.getTeamMemberByIdApi).mockReturnValue(request.promise)
  render(<CreateAboutPage editingMember={member} />)
  await screen.findByDisplayValue('Judul tersimpan')
  await waitFor(() => expect(about.getTeamMembersApi).toHaveBeenCalledOnce())
  fireEvent.click(screen.getByRole('button', { name: 'Batal Edit' }))
  await act(async () => { request.resolve({ ...member, name: 'Late after cancel' }) })
  expect(screen.getByPlaceholderText(namePlaceholder).value).toBe('')
  expect(screen.getByRole('heading', { name: 'Tambah Anggota Tim' })).not.toBeNull()
})

test('About list loaded for create cannot overwrite the order of a newly selected member', async () => {
  const request = deferred()
  vi.mocked(about.getTeamMembersApi).mockReturnValue(request.promise)
  const { rerender } = render(<CreateAboutPage />)
  await screen.findByDisplayValue('Judul tersimpan')
  rerender(<CreateAboutPage editingMember={member} />)
  expect(screen.getByRole('spinbutton').value).toBe('4')
  await act(async () => { request.resolve([active]) })
  expect(screen.getByRole('spinbutton').value).toBe('4')
  expect(about.getAboutSettingApi).toHaveBeenCalledOnce()
})

test('About blocks non-admin and keeps distinct title load error messages', async () => {
  vi.mocked(about.getAboutSettingApi).mockRejectedValue({ response: { status: 403 } })
  const { unmount } = render(<CreateAboutPage />)
  await screen.findByText('Anda tidak memiliki izin untuk mengelola judul About.')
  unmount()
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'operator' }))
  render(<CreateAboutPage />)
  expect(screen.getByText('Akses Ditolak')).not.toBeNull()
  expect(screen.queryByPlaceholderText(titlePlaceholder)).toBeNull()
})
