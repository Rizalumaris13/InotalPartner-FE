import { expect, test, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import ListFAQPage from '../src/pages/ListFAQPage'
import ListVideoPage from '../src/pages/ListVideoPage'
import ListVideoHighlightPage from '../src/pages/ListVideoHighlightPage'
import ListAboutPage from '../src/pages/ListAboutPage'
import ListTestimonialPage from '../src/pages/ListTestimonialPage'
import FormVideoSettingPage from '../src/pages/FormVideoSettingPage'
import { server } from './setup'

function signIn(role = 'admin') {
  localStorage.setItem('inotal_token', 'cleanup-list-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ id: 99, role }))
}

const listCases = [
  { name: 'FAQ', Page: ListFAQPage, endpoint: 'about/faqs', placeholder: 'Cari pertanyaan atau jawaban...', trimmed: false, spaceCount: 2 },
  { name: 'video', Page: ListVideoPage, endpoint: 'about/video', placeholder: 'Cari judul, deskripsi, atau URL video...', trimmed: false, spaceCount: 2 },
  { name: 'highlight', Page: ListVideoHighlightPage, endpoint: 'about/video-highlights', placeholder: 'Cari judul, deskripsi, atau ikon...', trimmed: false, spaceCount: 4 },
  { name: 'anggota', Page: ListAboutPage, endpoint: 'about/team', placeholder: 'Cari nama, jabatan...', trimmed: true, spaceCount: 4 },
  { name: 'testimoni', Page: ListTestimonialPage, endpoint: 'testimonials', placeholder: 'Cari nama, perusahaan, isi...', trimmed: true, spaceCount: 4 },
]

const records = ['Alpha', 'Beta Space', 'Gamma', null].map((name, index) => ({
  id: index + 1, name, title: name, question: name,
  answer: index === 0 ? 'dua kata' : null,
  description: index === 0 ? 'dua kata' : null,
  position: null, company: null, content: null, video_url: null, icon: null,
  display_order: index + 1, is_active: index % 2 === 0,
}))

function rowCount() {
  const table = screen.queryByRole('table')
  return table ? within(table).getAllByRole('row').length - 1 : 0
}

test.each(listCases)('$name retains its own search whitespace/null semantics and shared status labels', async ({ Page, endpoint, placeholder, trimmed, spaceCount }) => {
  signIn({ name: 'admin' })
  let reads = 0
  server.use(http.get(`*/api/${endpoint}`, () => { reads += 1; return HttpResponse.json({ data: records }) }))
  render(<Page onEdit={vi.fn()} />)
  await screen.findByRole('table')
  expect(rowCount()).toBe(4)
  const search = screen.getByPlaceholderText(placeholder)
  fireEvent.change(search, { target: { value: ' ' } })
  expect(rowCount()).toBe(spaceCount)
  fireEvent.change(search, { target: { value: ' Alpha ' } })
  expect(rowCount()).toBe(trimmed ? 1 : 0)
  fireEvent.change(search, { target: { value: 'aLpHa' } })
  expect(rowCount()).toBe(1)
  expect(screen.getByText('Alpha')).not.toBeNull()
  fireEvent.change(search, { target: { value: '' } })
  expect(rowCount()).toBe(4)
  const user = userEvent.setup()
  // Only toolbar buttons; row status controls deliberately differ by resource.
  const filters = ['Semua', 'Aktif', 'Tidak Aktif'].map((label) => screen.getAllByRole('button', { name: label, exact: true })[0])
  expect(filters.map((button) => button.textContent)).toEqual(['Semua', 'Aktif', 'Tidak Aktif'])
  await user.click(filters[1])
  expect(rowCount()).toBe(2)
  expect(screen.queryByText('Beta Space')).toBeNull()
  await user.click(filters[2])
  expect(rowCount()).toBe(2)
  expect(screen.queryByText('Alpha')).toBeNull()
  await user.click(filters[0])
  expect(rowCount()).toBe(4)
  expect(reads).toBe(1)
})

test('FAQ status stays read-only after filtering for an admin', async () => {
  signIn()
  server.use(http.get('*/api/about/faqs', () => HttpResponse.json({ data: [records[0]] })))
  render(<ListFAQPage />)
  const table = await screen.findByRole('table')
  const badge = within(table).getByText('Aktif')
  expect(badge.closest('button, [role="switch"]')).toBeNull()
  expect(within(table).queryByRole('switch')).toBeNull()
  expect(within(table).getByRole('button', { name: 'Edit FAQ' })).not.toBeNull()
})

test.each([
  { name: 'video', Page: ListVideoPage, endpoint: 'about/video', expected: { title: 'Alpha', description: 'dua kata', video_url: null, is_active: false } },
  { name: 'highlight', Page: ListVideoHighlightPage, endpoint: 'about/video-highlights', expected: { title: 'Alpha', description: 'dua kata', icon: null, display_order: 1, is_active: false } },
  { name: 'anggota', Page: ListAboutPage, endpoint: 'about/team', expected: { name: 'Alpha', position: null, display_order: 1, is_active: false } },
  { name: 'testimoni', Page: ListTestimonialPage, endpoint: 'testimonials', expected: { name: 'Alpha', position: null, company: null, content: null, display_order: 1, is_active: false } },
])('$name status still writes the resource-specific payload without refetching', async ({ Page, endpoint, expected }) => {
  signIn({ name: 'admin' })
  const writes = []
  let reads = 0
  server.use(
    http.get(`*/api/${endpoint}`, () => { reads += 1; return HttpResponse.json({ data: [records[0]] }) }),
    http.put(`*/api/${endpoint}/:id`, async ({ request, params }) => {
      writes.push({ id: params.id, payload: await request.json() })
      return HttpResponse.json({ data: {} })
    }),
  )
  render(<Page onEdit={vi.fn()} />)
  const user = userEvent.setup()
  const table = await screen.findByRole('table')
  await user.click(within(table).getByRole('button', { name: 'Aktif', exact: true }))
  expect(await within(table).findByRole('button', { name: /^(Tidak Aktif|Nonaktif)$/ })).not.toBeNull()
  expect(writes).toEqual([{ id: '1', payload: expected }])
  expect(reads).toBe(1)
})

const defaultSetting = {
  section_label: 'VIDEO PROFIL',
  section_title: 'Lihat sendiri bagaimana kolaborasi bekerja.',
  section_description: 'Keripitannya kami tampilkan apa adanya: ruang kerja nyata, interaksi harian, dan energi tim yang menghidupkan setiap ide.',
}
const settingPlaceholders = ['Contoh: VIDEO PROFIL', 'Contoh: Lihat sendiri bagaimana kolaborasi bekerja.', 'Tuliskan deskripsi pengantar video profil...']

test.each([
  { name: 'null record', data: null, expected: Object.values(defaultSetting), active: true },
  { name: 'missing fields', data: {}, expected: Object.values(defaultSetting), active: true },
  { name: 'null fields', data: { section_label: null, section_title: null, section_description: null, is_active: false }, expected: Object.values(defaultSetting), active: false },
  { name: 'empty strings', data: { section_label: '', section_title: '', section_description: '', is_active: 0 }, expected: ['', '', ''], active: true },
])('video setting preserves $name instead of replacing empty strings with defaults', async ({ data, expected, active }) => {
  signIn()
  server.use(http.get('*/api/about/video-setting', () => HttpResponse.json({ data })))
  render(<FormVideoSettingPage />)
  await screen.findByPlaceholderText(settingPlaceholders[0])
  expect(settingPlaceholders.map((placeholder) => screen.getByPlaceholderText(placeholder).value)).toEqual(expected)
  expect(screen.getByRole('checkbox').checked).toBe(active)
})

test('video setting load failure retains defaults, warns, and saving still sends all trimmed fields', async () => {
  signIn()
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})
  const writes = []
  server.use(
    http.get('*/api/about/video-setting', () => HttpResponse.json({ message: 'Gagal' }, { status: 500 })),
    http.put('*/api/about/video-setting', async ({ request }) => { writes.push(await request.json()); return HttpResponse.json({ data: {} }) }),
  )
  render(<FormVideoSettingPage />)
  const user = userEvent.setup()
  await screen.findByPlaceholderText(settingPlaceholders[0])
  expect(settingPlaceholders.map((placeholder) => screen.getByPlaceholderText(placeholder).value)).toEqual(Object.values(defaultSetting))
  expect(warn).toHaveBeenCalledOnce()
  expect(screen.queryByText('Gagal')).toBeNull()
  fireEvent.change(screen.getByPlaceholderText(settingPlaceholders[0]), { target: { value: '  Label  ' } })
  await user.click(screen.getByRole('checkbox'))
  await user.click(screen.getByRole('button', { name: 'Simpan Pengaturan' }))
  expect(await screen.findByText('Pengaturan section video profil berhasil disimpan.')).not.toBeNull()
  expect(writes).toEqual([{ ...defaultSetting, section_label: 'Label', is_active: false }])
})

test('video setting remains view-only for an operator', async () => {
  signIn('operator')
  server.use(http.get('*/api/about/video-setting', () => HttpResponse.json({ data: defaultSetting })))
  render(<FormVideoSettingPage />)
  expect((await screen.findByPlaceholderText(settingPlaceholders[0])).disabled).toBe(true)
  expect(screen.getByRole('checkbox').disabled).toBe(true)
  expect(screen.queryByRole('button', { name: 'Simpan Pengaturan' })).toBeNull()
})
