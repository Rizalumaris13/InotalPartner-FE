import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { act, cleanup, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import TentangPage from '../src/pages/FrontPage/TentangPage'
import schema from '../src/contracts/aboutEmpowering.schema.json'
import * as empoweringApi from '../src/api/aboutEmpowering'
import { server } from './setup'

const publicPath = `${schema['x-http'].base_path}${schema['x-http'].public_path}`
const configured = {
  label: 'Keunggulan untuk Mitra',
  title: 'Memberdayakan Bisnis Bersama',
  title_accent: 'Mitra Pilihan.',
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback }
    observe(target) { this.callback([{ isIntersecting: true, target }]) }
    disconnect() {}
  })
  server.use(
    http.get('*/api/*', () => HttpResponse.json({ success: true, data: null })),
    http.get('*/api/public/about/cards', () => HttpResponse.json({ success: true, data: [] })),
  )
})
afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

test('pengaturan admin mengganti label dan kedua bagian judul Memberdayakan Bisnis di publik', async () => {
  server.use(http.get(`*${publicPath}`, () => HttpResponse.json({ success: true, data: configured })))
  render(<TentangPage />)
  expect(await screen.findByRole('heading', { name: `${configured.title} ${configured.title_accent}`, exact: true })).not.toBeNull()
  expect(screen.getByText(configured.label, { exact: true })).not.toBeNull()
  expect(screen.queryByRole('heading', { name: `${schema.default.title} ${schema.default.title_accent}`, exact: true })).toBeNull()
  expect(screen.getByRole('heading', { name: 'Lihat sendiri bagaimana kolaborasi bekerja.', exact: true })).not.toBeNull()
})

test.each([
  ['belum diatur', { success: true, data: null }, 200],
  ['endpoint belum tersedia', { message: 'Belum tersedia' }, 404],
  ['server gagal', { message: 'Detail internal jangan ditampilkan' }, 500],
  ['401 publik', { message: 'Unauthorized' }, 401],
  ['format salah', { success: true, data: [] }, 200],
  ['field hilang', { success: true, data: { label: 'Sebagian' } }, 200],
  ['label terlalu panjang', { success: true, data: { ...configured, label: 'x'.repeat(schema.properties.label.maxLength + 1) } }, 200],
  ['success false', { success: false, data: configured }, 200],
])('%s mempertahankan judul bawaan tanpa menghapus sesi atau menampilkan error API', async (_name, body, status) => {
  localStorage.setItem('inotal_token', 'token-khusus-pengujian')
  const request = vi.spyOn(empoweringApi, 'getPublicAboutEmpoweringApi')
  server.use(http.get(`*${publicPath}`, () => HttpResponse.json(body, { status })))
  render(<TentangPage />)
  await act(async () => { await request.mock.results[0].value.catch(() => undefined) })
  expect(screen.getByRole('heading', { name: `${schema.default.title} ${schema.default.title_accent}`, exact: true })).not.toBeNull()
  expect(screen.getByText(schema.default.label, { exact: true })).not.toBeNull()
  expect(screen.queryByText('Detail internal jangan ditampilkan')).toBeNull()
  expect(localStorage.getItem('inotal_token')).toBe('token-khusus-pengujian')
  expect(request).toHaveBeenCalledTimes(1)
})

test('judul aksen kosong memang dihilangkan dan teks HTML dirender sebagai teks biasa', async () => {
  const title = '<img src=x onerror=alert(1)> Mitra'
  server.use(http.get(`*${publicPath}`, () => HttpResponse.json({ success: true, data: {
    label: '  Label dari API  ', title: `  ${title}  `, title_accent: '',
  } })))
  render(<TentangPage />)
  const heading = await screen.findByRole('heading', { name: title, exact: true })
  expect(heading.textContent).toBe(title)
  expect(heading.querySelector('img')).toBeNull()
  expect(heading.querySelector('span')).toBeNull()
  expect(screen.getByText('Label dari API', { exact: true })).not.toBeNull()
})
