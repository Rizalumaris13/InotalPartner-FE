import { beforeEach, expect, test } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import DashboardPage from '../src/pages/DashboardPage'
import AboutEmpoweringPage from '../src/pages/AboutEmpoweringPage'
import schema from '../src/contracts/aboutEmpowering.schema.json'
import { server } from './setup'

const adminPath = `${schema['x-http'].base_path}${schema['x-http'].admin_path}`
const configured = { label: 'Label pengujian', title: 'Judul dari admin', title_accent: 'Bersama.' }
const fieldLabels = { label: 'Label kecil', title: 'Judul utama', title_accent: 'Judul aksen (warna biru)' }

beforeEach(() => {
  server.use(http.get('*/api/public/about/cards', () => HttpResponse.json({ success: true, data: [] })))
})

async function fillSettings(user, values) {
  for (const [key, value] of Object.entries(values)) {
    const input = screen.getByLabelText(fieldLabels[key])
    await user.clear(input)
    if (value) await user.type(input, value)
  }
}

function mountDashboard(role = 'admin') {
  localStorage.setItem('inotal_token', 'token-khusus-pengujian')
  localStorage.setItem('inotal_user', JSON.stringify({ role, full_name: 'Admin Pengujian' }))
  return render(<DashboardPage onNavigate={() => {}} />)
}

async function openSettings(record = configured, role = 'admin') {
  server.use(http.get(`*${adminPath}`, () => HttpResponse.json({ success: true, data: record })))
  const view = mountDashboard(role)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Memberdayakan Bisnis', exact: true }))
  await user.click(screen.getByRole('button', { name: 'Pengaturan Bagian', exact: true }))
  await screen.findByLabelText('Label kecil')
  return { user, ...view }
}

test.each(['admin', 'super_admin', { name: 'admin' }, { name: 'super_admin' }])('role %j membuka pengaturan dan kartu melalui satu menu dengan breadcrumb tepat', async (role) => {
  server.use(http.get('*/api/about/cards', () => HttpResponse.json({ success: true, data: [] })))
  const { user } = await openSettings(configured, role)
  expect(screen.getByLabelText('Label kecil').value).toBe(configured.label)
  expect(screen.getByLabelText('Judul utama').value).toBe(configured.title)
  expect(screen.getByLabelText('Judul aksen (warna biru)').value).toBe(configured.title_accent)
  expect(screen.getByText('Memberdayakan Bisnis / Pengaturan Bagian', { exact: true })).not.toBeNull()
  const preview = screen.getByRole('region', { name: 'Pratinjau Memberdayakan Bisnis' })
  expect(within(preview).getByRole('heading', { name: `${configured.title} ${configured.title_accent}` })).not.toBeNull()
  expect(screen.queryByRole('button', { name: 'Kartu Tentang', exact: true })).toBeNull()
  expect(screen.getAllByRole('button', { name: 'Memberdayakan Bisnis', exact: true })).toHaveLength(1)
  await user.click(screen.getByRole('button', { name: 'Kelola Kartu', exact: true }))
  expect(await screen.findByText('Belum ada kartu. Tambahkan kartu pertama.')).not.toBeNull()
  expect(screen.getByText('Memberdayakan Bisnis / Kelola Kartu', { exact: true })).not.toBeNull()
})

test('buat pengaturan mengirim semua field dan hanya sukses setelah GET cocok', async () => {
  const { user } = await openSettings(null)
  const values = { label: '  Mitra pilihan  ', title: '  Tumbuh bersama mitra  ', title_accent: '  Terpercaya.  ' }
  await fillSettings(user, values)
  let payload
  let writes = 0
  let reads = 0
  let releaseRead
  const readGate = new Promise((resolve) => { releaseRead = resolve })
  server.use(
    http.post(`*${adminPath}`, async ({ request }) => {
      writes += 1
      payload = await request.json()
      return HttpResponse.json({ success: true, data: configured }, { status: 201 })
    }),
    http.get(`*${adminPath}`, async () => {
      reads += 1
      await readGate
      return HttpResponse.json({ success: true, data: payload })
    }),
  )
  const preview = screen.getByRole('region', { name: 'Pratinjau Memberdayakan Bisnis' })
  expect(within(preview).getByRole('heading', { name: 'Tumbuh bersama mitra Terpercaya.' })).not.toBeNull()
  await user.click(screen.getByRole('button', { name: 'Buat Pengaturan' }))
  await waitFor(() => expect(reads).toBe(1))
  expect(screen.queryByText('Pengaturan berhasil dibuat.')).toBeNull()
  expect(screen.getByLabelText('Label kecil').matches(':disabled')).toBe(true)
  await act(async () => releaseRead())
  expect(await screen.findByText('Pengaturan berhasil dibuat.')).not.toBeNull()
  expect(payload).toEqual({ label: 'Mitra pilihan', title: 'Tumbuh bersama mitra', title_accent: 'Terpercaya.' })
  expect(writes).toBe(1)
  expect(reads).toBe(1)
  expect(screen.getByLabelText('Label kecil').value).toBe(payload.label)
})

test('edit pengaturan memakai PUT dan membandingkan ketiga field termasuk aksen kosong', async () => {
  const { user } = await openSettings()
  const values = { label: 'Label diperbarui', title: 'Judul diperbarui', title_accent: '' }
  await fillSettings(user, values)
  let payload
  let reads = 0
  let creates = 0
  server.use(
    http.post(`*${adminPath}`, () => { creates += 1; return HttpResponse.json({ success: false }) }),
    http.put(`*${adminPath}`, async ({ request }) => {
      payload = await request.json()
      return HttpResponse.json({ success: true })
    }),
    http.get(`*${adminPath}`, () => {
      reads += 1
      return HttpResponse.json({ success: true, data: payload })
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  expect(await screen.findByText('Pengaturan berhasil diperbarui.')).not.toBeNull()
  expect(payload).toEqual(values)
  expect(reads).toBe(1)
  expect(creates).toBe(0)
  expect(screen.getByLabelText('Judul aksen (warna biru)').value).toBe('')
  expect(screen.getByRole('button', { name: 'Simpan Perubahan' }).disabled).toBe(false)
})

test('hapus pengaturan perlu konfirmasi, memverifikasi GET null, dan tidak menghapus kartu', async () => {
  const { user } = await openSettings()
  let deletes = 0
  let reads = 0
  const card = { id: 1, title: 'Kartu tetap ada', description: 'Kartu tidak ikut terhapus.', icon: 'rocket', url: '#kontak', sort_order: 1 }
  server.use(
    http.delete(`*${adminPath}`, () => {
      deletes += 1
      return new HttpResponse(null, { status: 204 })
    }),
    http.get(`*${adminPath}`, () => { reads += 1; return HttpResponse.json({ success: true, data: null }) }),
    http.get('*/api/about/cards', () => HttpResponse.json({ success: true, data: [card] })),
  )
  await user.click(screen.getByRole('button', { name: 'Hapus Pengaturan', exact: true }))
  let dialog = screen.getByRole('alertdialog', { name: 'Hapus Pengaturan?' })
  expect(deletes).toBe(0)
  expect(within(dialog).getByText(/Kartu tidak ikut dihapus/)).not.toBeNull()
  await user.click(within(dialog).getByRole('button', { name: 'Batal' }))
  expect(deletes).toBe(0)
  expect(screen.getByLabelText('Label kecil').value).toBe(configured.label)
  await user.click(screen.getByRole('button', { name: 'Hapus Pengaturan', exact: true }))
  dialog = screen.getByRole('alertdialog', { name: 'Hapus Pengaturan?' })
  await user.click(within(dialog).getByRole('button', { name: 'Ya, Hapus Pengaturan' }))
  expect(await screen.findByText('Pengaturan berhasil dihapus. Teks bawaan digunakan kembali.')).not.toBeNull()
  expect(reads).toBe(1)
  expect(deletes).toBe(1)
  expect(screen.getByLabelText('Label kecil').value).toBe(schema.default.label)
  expect(screen.getByLabelText('Judul utama').value).toBe(schema.default.title)
  expect(screen.getByLabelText('Judul aksen (warna biru)').value).toBe(schema.default.title_accent)
  expect(screen.getByRole('button', { name: 'Buat Pengaturan' }).disabled).toBe(false)
  expect(screen.queryByRole('button', { name: 'Hapus Pengaturan', exact: true })).toBeNull()
  await user.click(screen.getByRole('button', { name: 'Kelola Kartu' }))
  expect(await screen.findByRole('rowheader', { name: card.title })).not.toBeNull()
})

test.each(['label', 'title', 'title_accent'])('baca ulang dengan %s lama mengunci draf dan Verifikasi Ulang hanya mengirim GET', async (staleField) => {
  const { user } = await openSettings()
  const values = { label: 'Label baru', title: 'Judul baru', title_accent: 'Aksen baru' }
  await fillSettings(user, values)
  let writes = 0
  let reads = 0
  let stale = true
  server.use(
    http.put(`*${adminPath}`, () => { writes += 1; return HttpResponse.json({ success: true }) }),
    http.get(`*${adminPath}`, () => {
      reads += 1
      return HttpResponse.json({ success: true, data: stale ? { ...values, [staleField]: configured[staleField] } : values })
    }),
  )
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  expect((await screen.findByRole('alert')).textContent).toContain('hasil baca ulang belum sesuai')
  for (const [key, value] of Object.entries(values)) {
    expect(screen.getByLabelText(fieldLabels[key]).value).toBe(value)
    expect(screen.getByLabelText(fieldLabels[key]).matches(':disabled')).toBe(true)
  }
  expect(screen.queryByText('Pengaturan berhasil diperbarui.')).toBeNull()
  expect(screen.getByRole('button', { name: 'Simpan Perubahan' }).disabled).toBe(true)
  expect(screen.getByRole('button', { name: 'Hapus Pengaturan', exact: true }).disabled).toBe(true)
  stale = false
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect(await screen.findByText('Pengaturan berhasil diperbarui.')).not.toBeNull()
  expect(writes).toBe(1)
  expect(reads).toBe(2)
  expect(screen.getByLabelText('Label kecil').matches(':disabled')).toBe(false)
})

test('Muat Ulang membuang seluruh draf meskipun GET gagal dan memulihkan tombol hanya setelah GET valid', async () => {
  const { user } = await openSettings()
  await fillSettings(user, { label: 'Draf label', title: 'Draf judul', title_accent: 'Draf aksen' })
  let offline = true
  let reads = 0
  let writes = 0
  server.use(
    http.get(`*${adminPath}`, () => {
      reads += 1
      return offline ? HttpResponse.json({ message: 'Server sedang tidak tersedia.' }, { status: 500 })
        : HttpResponse.json({ success: true, data: configured })
    }),
    http.post(`*${adminPath}`, () => { writes += 1; return HttpResponse.json({ success: true }) }),
    http.put(`*${adminPath}`, () => { writes += 1; return HttpResponse.json({ success: true }) }),
  )
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Server sedang tidak tersedia.')
  for (const [key, value] of Object.entries(schema.default)) expect(screen.getByLabelText(fieldLabels[key]).value).toBe(value)
  const preview = screen.getByRole('region', { name: 'Pratinjau Memberdayakan Bisnis' })
  expect(within(preview).getByRole('heading', { name: `${schema.default.title} ${schema.default.title_accent}` })).not.toBeNull()
  expect(screen.getByRole('button', { name: 'Buat Pengaturan' }).disabled).toBe(true)
  fireEvent.submit(screen.getByRole('form', { name: 'Pengaturan Memberdayakan Bisnis' }))
  expect(writes).toBe(0)
  offline = false
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  await waitFor(() => expect(screen.getByLabelText('Label kecil').value).toBe(configured.label))
  expect(screen.getByRole('button', { name: 'Simpan Perubahan' }).disabled).toBe(false)
  expect(reads).toBe(2)
  expect(writes).toBe(0)
})

test.each([
  ['label', '   ', 'Label kecil wajib diisi.'],
  ['title', 'x', 'Judul utama minimal 2 karakter.'],
  ['title_accent', 'x'.repeat(schema.properties.title_accent.maxLength + 1), 'Judul aksen (warna biru) maksimal 100 karakter.'],
  ['label', 'Label\u0000rusak', 'Label kecil tidak boleh memuat karakter kontrol atau baris baru.'],
])('validasi %s mempertahankan isian, memfokuskan field salah, dan tidak mengirim request', async (key, value, message) => {
  const { user } = await openSettings(null)
  let writes = 0
  server.use(http.post(`*${adminPath}`, () => { writes += 1; return HttpResponse.json({ success: true }) }))
  const input = screen.getByLabelText(fieldLabels[key])
  fireEvent.change(input, { target: { value } })
  await user.click(screen.getByRole('button', { name: 'Buat Pengaturan' }))
  expect((await screen.findByText(message)).getAttribute('role')).toBe('alert')
  expect(input.value).toBe(value)
  expect(input.getAttribute('aria-invalid')).toBe('true')
  expect(input.getAttribute('aria-describedby')).toContain(`empowering-${key}-error`)
  expect(document.activeElement).toBe(input)
  expect(writes).toBe(0)
  fireEvent.change(input, { target: { value: 'Nilai benar' } })
  expect(screen.queryByText(message)).toBeNull()
  expect(input.getAttribute('aria-invalid')).toBe('false')
})

test.each(['operator', 'guest', null, {}, { name: 'operator' }, { name: 'guest' }])('role %j tidak memperoleh menu atau meminta resource pengaturan', async (role) => {
  let requests = 0
  server.use(http.all(`*${adminPath}`, () => { requests += 1; return HttpResponse.json({ success: true, data: configured }) }))
  const view = render(<AboutEmpoweringPage role={role} />)
  expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  expect(screen.queryByRole('form')).toBeNull()
  await act(async () => {})
  view.unmount()
  mountDashboard(role)
  expect(screen.queryByRole('button', { name: 'Memberdayakan Bisnis', exact: true })).toBeNull()
  await act(async () => {})
  expect(requests).toBe(0)
})

test.each([
  ['404', { message: 'Not found' }, 404],
  ['500', { message: 'Server belum siap' }, 500],
  ['respons salah', { success: true, data: {} }, 200],
  ['success false', { success: false, message: 'Permintaan gagal' }, 200],
])('GET awal %s bukan record kosong dan tidak mengaktifkan simpan', async (_label, body, status) => {
  let writes = 0
  server.use(
    http.get(`*${adminPath}`, () => HttpResponse.json(body, { status })),
    http.post(`*${adminPath}`, () => { writes += 1; return HttpResponse.json({ success: true }) }),
  )
  render(<AboutEmpoweringPage role="admin" />)
  const error = await screen.findByRole('alert')
  if (status === 404) expect(error.textContent).toContain(`GET ${adminPath}`)
  expect(screen.queryByText('Bagian belum diatur. Teks bawaan tetap tampil sampai pengaturan dibuat.')).toBeNull()
  expect(screen.getByRole('button', { name: 'Buat Pengaturan' }).disabled).toBe(true)
  fireEvent.submit(screen.getByRole('form', { name: 'Pengaturan Memberdayakan Bisnis' }))
  await act(async () => {})
  expect(writes).toBe(0)
})

const mutations = [
  ['create', 'post', null, 'Buat Pengaturan', 'Pengaturan berhasil dibuat.'],
  ['update', 'put', configured, 'Simpan Perubahan', 'Pengaturan berhasil diperbarui.'],
  ['delete', 'delete', configured, 'Hapus Pengaturan', 'Pengaturan berhasil dihapus. Teks bawaan digunakan kembali.'],
]

async function clickMutation(user, kind, button) {
  await user.click(screen.getByRole('button', { name: button, exact: true }))
  if (kind === 'delete') {
    const dialog = screen.getByRole('alertdialog', { name: 'Hapus Pengaturan?' })
    await user.click(within(dialog).getByRole('button', { name: 'Ya, Hapus Pengaturan' }))
  }
}

test.each(mutations)('%s gagal mempertahankan draf, tidak membaca ulang, dan tidak mengklaim sukses', async (kind, method, initial, button, success) => {
  const { user } = await openSettings(initial)
  const values = { label: 'Draf label', title: 'Draf judul', title_accent: 'Draf aksen' }
  await fillSettings(user, values)
  let reads = 0
  let writes = 0
  server.use(
    http[method](`*${adminPath}`, () => {
      writes += 1
      return HttpResponse.json({ success: false, message: 'Perubahan ditolak backend.' }, { status: 409 })
    }),
    http.get(`*${adminPath}`, () => { reads += 1; return HttpResponse.json({ success: true, data: initial }) }),
  )
  await clickMutation(user, kind, button)
  expect((await screen.findByRole('alert')).textContent).toBe('Perubahan ditolak backend.')
  expect(screen.queryByText(success)).toBeNull()
  expect(screen.queryByRole('button', { name: 'Verifikasi Ulang' })).toBeNull()
  for (const [key, value] of Object.entries(values)) {
    expect(screen.getByLabelText(fieldLabels[key]).value).toBe(value)
    expect(screen.getByLabelText(fieldLabels[key]).matches(':disabled')).toBe(false)
  }
  expect(reads).toBe(0)
  expect(writes).toBe(1)
})

test.each(mutations)('%s diterima tetapi GET gagal atau stale hanya mengulang verifikasi', async (kind, method, initial, button, success) => {
  const { user } = await openSettings(initial)
  const values = { label: 'Nilai baru', title: 'Judul baru', title_accent: 'Aksen baru' }
  await fillSettings(user, values)
  let reads = 0
  let writes = 0
  let phase = 'error'
  server.use(
    http[method](`*${adminPath}`, () => { writes += 1; return HttpResponse.json({ success: true }) }),
    http.get(`*${adminPath}`, () => {
      reads += 1
      if (phase === 'error') return HttpResponse.json({ message: 'Pembacaan ulang gagal.' }, { status: 500 })
      return HttpResponse.json({ success: true, data: phase === 'stale' ? configured : kind === 'delete' ? null : values })
    }),
  )
  await clickMutation(user, kind, button)
  expect((await screen.findByRole('alert')).textContent).toBe('Pembacaan ulang gagal.')
  expect(screen.queryByText(success)).toBeNull()
  expect(screen.getByLabelText('Label kecil').value).toBe(values.label)
  expect(screen.getByLabelText('Label kecil').matches(':disabled')).toBe(true)
  phase = 'stale'
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect((await screen.findByRole('alert')).textContent).toContain('hasil baca ulang belum sesuai')
  expect(screen.queryByText(success)).toBeNull()
  phase = 'valid'
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect(await screen.findByText(success)).not.toBeNull()
  expect(reads).toBe(3)
  expect(writes).toBe(1)
  expect(screen.getByLabelText('Label kecil').value).toBe(kind === 'delete' ? schema.default.label : values.label)
})

test('submit ganda dan klik Muat Ulang selama tulis tidak mengirim permintaan tambahan', async () => {
  const { user } = await openSettings(null)
  let writes = 0
  let reads = 0
  let releaseWrite
  const writeGate = new Promise((resolve) => { releaseWrite = resolve })
  server.use(
    http.post(`*${adminPath}`, async () => { writes += 1; await writeGate; return HttpResponse.json({ success: true }) }),
    http.get(`*${adminPath}`, () => { reads += 1; return HttpResponse.json({ success: true, data: schema.default }) }),
  )
  const form = screen.getByRole('form', { name: 'Pengaturan Memberdayakan Bisnis' })
  act(() => { fireEvent.submit(form); fireEvent.submit(form) })
  await waitFor(() => expect(writes).toBe(1))
  fireEvent.change(screen.getByLabelText('Label kecil'), { target: { value: 'Jangan ubah saat sibuk' } })
  expect(screen.getByLabelText('Label kecil').value).toBe(schema.default.label)
  await user.click(screen.getByRole('button', { name: 'Muat Ulang' }))
  expect(reads).toBe(0)
  await act(async () => releaseWrite())
  expect(await screen.findByText('Pengaturan berhasil dibuat.')).not.toBeNull()
  expect(writes).toBe(1)
  expect(reads).toBe(1)
})

test('unmount saat menulis membatalkan request dan tidak melanjutkan GET verifikasi', async () => {
  const { user, unmount, container } = await openSettings(null)
  let writes = 0
  let reads = 0
  let releaseWrite
  const writeGate = new Promise((resolve) => { releaseWrite = resolve })
  server.use(
    http.post(`*${adminPath}`, async () => { writes += 1; await writeGate; return HttpResponse.json({ success: true }) }),
    http.get(`*${adminPath}`, () => { reads += 1; return HttpResponse.json({ success: true, data: schema.default }) }),
  )
  await user.click(screen.getByRole('button', { name: 'Buat Pengaturan' }))
  await waitFor(() => expect(writes).toBe(1))
  unmount()
  await act(async () => releaseWrite())
  expect(reads).toBe(0)
  expect(container.childElementCount).toBe(0)
})

test('hak akses dicabut saat GET berjalan menutup editor dan mengabaikan respons terlambat', async () => {
  let reads = 0
  let releaseRead
  const gate = new Promise((resolve) => { releaseRead = resolve })
  server.use(http.get(`*${adminPath}`, async () => { reads += 1; await gate; return HttpResponse.json({ success: true, data: configured }) }))
  const { rerender } = render(<AboutEmpoweringPage role="admin" />)
  await waitFor(() => expect(reads).toBe(1))
  rerender(<AboutEmpoweringPage role="guest" />)
  await act(async () => releaseRead())
  expect(screen.queryByRole('form')).toBeNull()
  expect(screen.getByRole('alert').textContent).toContain('tidak memiliki akses')
  expect(reads).toBe(1)
  rerender(<AboutEmpoweringPage role={{ name: 'admin' }} />)
  expect((await screen.findByLabelText('Label kecil')).value).toBe(configured.label)
  expect(reads).toBe(2)
})

test('unmount saat konfirmasi terbuka tidak menghapus pengaturan', async () => {
  const { user, unmount } = await openSettings()
  let deletes = 0
  server.use(http.delete(`*${adminPath}`, () => { deletes += 1; return HttpResponse.json({ success: true }) }))
  await user.click(screen.getByRole('button', { name: 'Hapus Pengaturan', exact: true }))
  expect(screen.getByRole('alertdialog')).not.toBeNull()
  unmount()
  await act(async () => {})
  expect(deletes).toBe(0)
})

test('batas karakter editor mengikuti Unicode code point tanpa memotong aksara non-BMP', async () => {
  const { user } = await openSettings(null)
  const values = Object.fromEntries(Object.entries(schema.properties).map(([key, rule]) => [key, '🚀'.repeat(rule.maxLength)]))
  for (const [key, value] of Object.entries(values)) fireEvent.change(screen.getByLabelText(fieldLabels[key]), { target: { value } })
  let payload
  server.use(
    http.post(`*${adminPath}`, async ({ request }) => { payload = await request.json(); return HttpResponse.json({ success: true }) }),
    http.get(`*${adminPath}`, () => HttpResponse.json({ success: true, data: payload })),
  )
  await user.click(screen.getByRole('button', { name: 'Buat Pengaturan' }))
  expect(await screen.findByText('Pengaturan berhasil dibuat.')).not.toBeNull()
  expect(payload).toEqual(values)
})

test.each(mutations)('%s dengan respons jaringan hilang mengunci draf dan hanya boleh rekonsiliasi GET', async (kind, method, initial, button, success) => {
  const { user } = await openSettings(initial)
  const values = { label: 'Draf tetap utuh', title: 'Judul respons hilang', title_accent: 'Aksen uji' }
  await fillSettings(user, values)
  const trace = []
  let stored = initial
  let readFails = true
  server.use(
    http[method](`*${adminPath}`, async ({ request }) => {
      trace.push(method.toUpperCase())
      stored = kind === 'delete' ? null : await request.json()
      return HttpResponse.error()
    }),
    http.get(`*${adminPath}`, () => {
      trace.push('GET')
      return readFails
        ? HttpResponse.json({ message: 'Rekonsiliasi belum tersedia.' }, { status: 500 })
        : HttpResponse.json({ success: true, data: stored })
    }),
  )
  await clickMutation(user, kind, button)
  expect((await screen.findByRole('alert')).textContent).toMatch(/hasil.*belum/i)
  expect(screen.queryByText(success)).toBeNull()
  for (const [key, value] of Object.entries(values)) {
    expect(screen.getByLabelText(fieldLabels[key]).value).toBe(value)
    expect(screen.getByLabelText(fieldLabels[key]).matches(':disabled')).toBe(true)
  }
  expect(screen.getByRole('button', { name: button, exact: true }).disabled).toBe(true)
  fireEvent.submit(screen.getByRole('form', { name: 'Pengaturan Memberdayakan Bisnis' }))
  await act(async () => {})
  expect(trace).toEqual([method.toUpperCase()])
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect((await screen.findByRole('alert')).textContent).toBe('Rekonsiliasi belum tersedia.')
  expect(screen.queryByText(success)).toBeNull()
  readFails = false
  await user.click(screen.getByRole('button', { name: 'Verifikasi Ulang' }))
  expect(await screen.findByText(success)).not.toBeNull()
  expect(trace).toEqual([method.toUpperCase(), 'GET', 'GET'])
  expect(screen.getByLabelText('Label kecil').value).toBe(kind === 'delete' ? schema.default.label : values.label)
})
