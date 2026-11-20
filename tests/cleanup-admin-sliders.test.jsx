import { beforeEach, expect, test, vi } from 'vitest'
import { StrictMode } from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import CreateSlider from '../src/pages/CreateSlider'
import ListSliderPage from '../src/pages/ListSliderPage'
import { server } from './setup'
import api from '../src/api/axios'

const endpoint = 'http://localhost:8080/api/homepage/banners'
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, content-type',
}

beforeEach(() => {
  server.use(http.options('http://localhost:8080/api/*', () => new HttpResponse(null, { status: 204, headers: corsHeaders })))
})

function sliderResponse(data, options = {}) {
  return HttpResponse.json(data, { ...options, headers: corsHeaders })
}

const slider = {
  id: 7,
  title: 'Slider awal',
  background_image: '/uploads/awal.jpg',
  order: '4',
  is_active: true,
  buttons: [
    { label: 'Satu', url: '/satu', description: 'Deskripsi asli', order: 8 },
    { label: 'Dua', url: '/dua', order: 3 },
    { label: 'Tiga', url: '/tiga', order: 9 },
    { label: 'Tidak menjadi slot keempat', url: '/empat' },
  ],
}

function signIn(role = 'admin') {
  localStorage.setItem('inotal_token', 'cleanup-slider-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ id: 99, role }))
}

function titleInput() {
  return screen.getByPlaceholderText('Contoh: Kreativitas')
}

function buttonLabels() {
  return screen.getAllByPlaceholderText('Contoh: Gabung Sekarang').map((input) => input.value)
}

function pageText() {
  return screen.getByText('Halaman', { exact: false }).textContent.replace(/\s+/g, ' ').trim()
}

test('slider seeds exactly three slots and resets on source replacement, including the same id, without remounting focused inputs', async () => {
  signIn()
  const user = userEvent.setup()
  const onOpenList = vi.fn()
  const view = render(<CreateSlider editingSlider={slider} onOpenList={onOpenList} />)
  const title = titleInput()
  expect(title.value).toBe('Slider awal')
  expect(buttonLabels()).toEqual(['Satu', 'Dua', 'Tiga'])
  expect(screen.getByRole('spinbutton').value).toBe('4')
  expect(screen.getByAltText('Slider preview').getAttribute('src')).toBe('http://localhost:8080/uploads/awal.jpg')

  await user.clear(title)
  await user.type(title, 'Draf lokal')
  view.rerender(<CreateSlider editingSlider={slider} onOpenList={onOpenList} />)
  expect(titleInput().value).toBe('Draf lokal')
  expect(document.activeElement).toBe(title)

  view.rerender(<CreateSlider editingSlider={{ ...slider, title: 'Pengganti id sama', buttons: null, order: 0 }} onOpenList={onOpenList} />)
  expect(titleInput()).toBe(title)
  expect(document.activeElement).toBe(title)
  expect(title.value).toBe('Pengganti id sama')
  expect(buttonLabels()).toEqual(['', '', ''])
  expect(screen.getByRole('spinbutton').value).toBe('1')

  view.rerender(<CreateSlider editingSlider={{ id: 8, title: 'Slider B', buttons: [{ label: 'B', url: '/b' }] }} onOpenList={onOpenList} />)
  expect(title.value).toBe('Slider B')
  expect(buttonLabels()).toEqual(['B', '', ''])
  expect(screen.queryByAltText('Slider preview')).toBeNull()
  view.rerender(<CreateSlider onOpenList={onOpenList} />)
  expect(title.value).toBe('')
  expect(buttonLabels()).toEqual(['', '', ''])
  expect(screen.getByRole('spinbutton').value).toBe('1')
  expect(screen.getByRole('button', { name: 'Buat Slider' })).not.toBeNull()
  await user.click(screen.getByRole('button', { name: 'Lihat List Slider' }))
  expect(onOpenList).toHaveBeenCalledOnce()
})

test('slider source changes clear selected file state and errors but retain the native file input and focus', async () => {
  signIn()
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:slider-fixture')
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const view = render(<CreateSlider />)
  const user = userEvent.setup()
  const fileInput = view.container.querySelector('input[type="file"]')
  const file = new File(['fixture'], 'pilihan.png', { type: 'image/png' })
  await user.upload(fileInput, file)
  expect(screen.getByAltText('Slider preview').getAttribute('src')).toBe('blob:slider-fixture')
  await user.clear(screen.getByRole('spinbutton'))
  await user.click(screen.getByRole('button', { name: 'Buat Slider' }))
  expect(await screen.findByText('Nomor urut slider harus berupa angka bulat minimal 1.')).not.toBeNull()
  expect(errorSpy).toHaveBeenCalledOnce()
  await user.click(titleInput())
  const title = titleInput()
  view.rerender(<CreateSlider editingSlider={slider} />)
  expect(document.activeElement).toBe(title)
  expect(screen.queryByText('Nomor urut slider harus berupa angka bulat minimal 1.')).toBeNull()
  expect(screen.queryByText('pilihan.png')).toBeNull()
  expect(screen.getByAltText('Slider preview').getAttribute('src')).toBe('http://localhost:8080/uploads/awal.jpg')
  // A prop reset never cleared the native input; only explicit removal / successful create does.
  expect(view.container.querySelector('input[type="file"]')).toBe(fileInput)
  expect(fileInput.files[0]).toBe(file)
})

test('slider POST preserves slot-three order rather than compacting buttons and resets the draft only on success', async () => {
  signIn()
  const writes = []
  const calls = []
  server.use(
    http.get(endpoint, () => { calls.push('GET'); return sliderResponse({ data: [] }) }),
    http.post(endpoint, async ({ request }) => {
      calls.push('POST')
      writes.push(await request.json())
      return sliderResponse({ data: { id: 31 } }, { status: 201 })
    }),
  )
  const user = userEvent.setup()
  render(<CreateSlider />)
  await user.type(titleInput(), '  Judul baru  ')
  await user.type(screen.getAllByPlaceholderText('Contoh: Gabung Sekarang')[2], '  Tiga  ')
  await user.type(screen.getAllByPlaceholderText('/register')[2], ' /tiga ')
  await user.click(screen.getByRole('button', { name: 'Buat Slider' }))
  expect(await screen.findByRole('status')).not.toBeNull()
  expect(writes).toEqual([{
    title: 'Judul baru', background_image: '', order: 1, is_active: false,
    buttons: [{ label: 'Tiga', url: '/tiga', description: '', order: 3 }],
  }])
  expect(calls).toEqual(['GET', 'POST'])
  expect(titleInput().value).toBe('')
  expect(buttonLabels()).toEqual(['', '', ''])
  expect(screen.getByRole('spinbutton').value).toBe('1')
})

test('slider edit excludes its own id from duplicate detection, keeps active status, and does not clear the draft', async () => {
  signIn()
  const writes = []
  const onFinishEdit = vi.fn()
  server.use(
    http.get(endpoint, () => sliderResponse({ banners: [slider] })),
    http.put(`${endpoint}/:id`, async ({ params, request }) => {
      writes.push({ id: params.id, payload: await request.json() })
      return sliderResponse({ data: slider })
    }),
  )
  const user = userEvent.setup()
  render(<CreateSlider editingSlider={slider} onFinishEdit={onFinishEdit} />)
  await user.click(screen.getByRole('button', { name: 'Simpan Perubahan' }))
  await waitFor(() => expect(onFinishEdit).toHaveBeenCalledOnce())
  expect(writes).toEqual([{ id: '7', payload: {
    title: slider.title, background_image: slider.background_image, order: 4, is_active: true,
    buttons: slider.buttons.slice(0, 3).map((button, index) => ({ label: button.label, url: button.url, description: '', order: index + 1 })),
  } }])
  expect(titleInput().value).toBe(slider.title)
})

test.each(['duplicate', 'load error'])('slider %s blocks upload and write while preserving entered fields', async (failure) => {
  signIn()
  const calls = []
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:slider-failure')
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  server.use(
    http.get(endpoint, () => {
      calls.push('GET')
      return failure === 'duplicate'
        ? sliderResponse({ data: [{ id: 42, order: 1 }], banners: [] })
        : sliderResponse({ message: 'Daftar slider gagal' }, { status: 500 })
    }),
    http.post('http://localhost:8080/api/uploads/image', () => { calls.push('UPLOAD'); return sliderResponse({ url: '/uploads/new.png' }) }),
    http.post(endpoint, () => { calls.push('POST'); return sliderResponse({}) }),
  )
  const view = render(<CreateSlider />)
  const user = userEvent.setup()
  await user.type(titleInput(), 'Draf tetap')
  await user.upload(view.container.querySelector('input[type="file"]'), new File(['fixture'], 'baru.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Buat Slider' }))
  const message = failure === 'duplicate'
    ? 'Nomor urut 1 sudah digunakan oleh slider lain. Silakan pilih nomor urut lain.'
    : 'Daftar slider gagal'
  expect(await screen.findByText(message)).not.toBeNull()
  expect(errorSpy).toHaveBeenCalledOnce()
  expect(calls).toEqual(['GET'])
  expect(titleInput().value).toBe('Draf tetap')
  expect(screen.getByText('baru.png')).not.toBeNull()
})

test.each(['direct', 'data', 'banners', 'both', 'invalid'])('slider list preserves %s envelope precedence', async (shape) => {
  signIn()
  const envelopes = {
    direct: [slider], data: { data: [slider] }, banners: { banners: [slider] },
    both: { data: [slider], banners: [{ ...slider, title: 'Tidak dipilih' }] }, invalid: { data: { id: 7 } },
  }
  server.use(http.get(endpoint, () => sliderResponse(envelopes[shape])))
  render(<ListSliderPage />)
  if (shape === 'invalid') {
    expect(await screen.findByText('Belum ada slider.')).not.toBeNull()
  } else {
    expect(await screen.findByText(slider.title)).not.toBeNull()
    expect(screen.queryByText('Tidak dipilih')).toBeNull()
  }
})

test.each([false, true])('slider status action from active=%s confirms before sending the complete PUT and refetching', async (active) => {
  signIn()
  let banner = { ...slider, is_active: active }
  let reads = 0
  const writes = []
  server.use(
    http.get(endpoint, () => { reads += 1; return sliderResponse([banner]) }),
    http.put(`${endpoint}/:id`, async ({ params, request }) => {
      const payload = await request.json()
      writes.push({ id: params.id, payload })
      banner = { id: banner.id, ...payload }
      return sliderResponse(banner)
    }),
  )
  render(<ListSliderPage />)
  const user = userEvent.setup()
  const action = active ? 'Take Down' : 'Upload ke Landing Page'
  await user.click(await screen.findByTitle(action))
  expect(screen.getByRole('alertdialog').textContent).toContain(active ? `Turunkan "${slider.title}" dari Landing Page?` : `Upload "${slider.title}" ke Landing Page?`)
  await user.click(screen.getByRole('button', { name: 'Batal' }))
  expect(writes).toEqual([])
  expect(reads).toBe(1)
  await user.click(screen.getByTitle(action))
  await user.click(screen.getByRole('button', { name: active ? 'Ya, turunkan' : 'Ya, upload' }))
  expect(await screen.findByTitle(active ? 'Upload ke Landing Page' : 'Take Down')).not.toBeNull()
  expect(writes).toEqual([{ id: '7', payload: {
    title: slider.title, background_image: slider.background_image, order: 4,
    is_active: !active, buttons: slider.buttons,
  } }])
  expect(reads).toBe(2)
  expect(screen.getByRole('status').textContent).toContain(active ? 'Slider berhasil diturunkan dari Landing Page.' : 'Slider berhasil di-upload ke Landing Page.')
})

test('slider status write failure leaves the list unchanged and does not refresh', async () => {
  signIn()
  let reads = 0
  server.use(
    http.get(endpoint, () => { reads += 1; return sliderResponse([slider]) }),
    http.put(`${endpoint}/:id`, () => sliderResponse({ message: 'Status ditolak' }, { status: 500 })),
  )
  render(<ListSliderPage />)
  const user = userEvent.setup()
  await user.click(await screen.findByTitle('Take Down'))
  await user.click(screen.getByRole('button', { name: 'Ya, turunkan' }))
  expect(await screen.findByText('Status ditolak')).not.toBeNull()
  expect(reads).toBe(1)
  expect(screen.getByTitle('Take Down')).not.toBeNull()
})

test('slider pagination resets on changed filters, not same-value events, and retains the empty last page after deletion', async () => {
  signIn()
  let banners = Array.from({ length: 11 }, (_, i) => ({ id: i + 1, title: `Slider ${i + 1}`, order: i + 1, is_active: false }))
  let reads = 0
  server.use(
    http.get(endpoint, () => { reads += 1; return sliderResponse({ data: banners }) }),
    http.delete(`${endpoint}/:id`, ({ params }) => { banners = banners.filter((banner) => banner.id !== Number(params.id)); return sliderResponse({}) }),
  )
  render(<ListSliderPage />)
  const user = userEvent.setup()
  await screen.findByText('Slider 1')
  await user.click(screen.getByRole('button', { name: 'Next' }))
  expect(pageText()).toBe('Halaman 2 dari 2')
  await user.click(screen.getByRole('button', { name: 'Semua' }))
  fireEvent.change(screen.getByPlaceholderText('Cari judul slider...'), { target: { value: '' } })
  expect(pageText()).toBe('Halaman 2 dari 2')
  await user.click(screen.getByRole('button', { name: 'Tidak Aktif' }))
  expect(pageText()).toBe('Halaman 1 dari 2')
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(screen.getByRole('button', { name: 'Tidak Aktif' }))
  expect(pageText()).toBe('Halaman 2 dari 2')
  await user.type(screen.getByPlaceholderText('Cari judul slider...'), 'SLIDER')
  expect(pageText()).toBe('Halaman 1 dari 2')
  expect(reads).toBe(1)
  await user.click(screen.getByRole('button', { name: 'Next' }))
  await user.click(screen.getByTitle('Hapus slider permanen'))
  await user.click(within(screen.getByRole('alertdialog')).getByRole('button', { name: 'Ya, hapus' }))
  expect(await screen.findByText('Tidak ada slider yang cocok dengan filter.')).not.toBeNull()
  expect(reads).toBe(2)
  expect(screen.queryByRole('button', { name: 'Prev' })).toBeNull()
  // The existing list deliberately does not clamp page after a mutation.
  await user.click(screen.getByRole('button', { name: 'Tidak Aktif' }))
  expect(screen.getByText('Tidak ada slider yang cocok dengan filter.')).not.toBeNull()
  await user.clear(screen.getByPlaceholderText('Cari judul slider...'))
  expect(await screen.findByText('Slider 1')).not.toBeNull()
})

test('slider list ignores a stale request after StrictMode effect cleanup', async () => {
  signIn()
  let finishStale
  const stale = new Promise((resolve) => { finishStale = resolve })
  const request = vi.spyOn(api, 'get')
    .mockReturnValueOnce(stale)
    .mockResolvedValueOnce({ data: [{ ...slider, title: 'Data terbaru' }] })
  render(<StrictMode><ListSliderPage /></StrictMode>)
  expect(await screen.findByText('Data terbaru')).not.toBeNull()
  expect(request).toHaveBeenCalledTimes(2)
  await act(async () => {
    finishStale({ data: [{ ...slider, title: 'Data request lama' }] })
    await stale
  })
  expect(screen.getByText('Data terbaru')).not.toBeNull()
  expect(screen.queryByText('Data request lama')).toBeNull()
})

test('slider refresh owns loading and displays GET errors after a successful status write without retrying the mutation', async () => {
  signIn()
  let reads = 0
  const writes = []
  let finishRefresh
  const pendingRefresh = new Promise((resolve) => { finishRefresh = resolve })
  server.use(
    http.get(endpoint, async () => {
      reads += 1
      if (reads === 1) return sliderResponse([slider])
      await pendingRefresh
      return sliderResponse({ message: 'Refresh slider gagal' }, { status: 500 })
    }),
    http.put(`${endpoint}/:id`, async ({ request }) => { writes.push(await request.json()); return sliderResponse({}) }),
  )
  render(<ListSliderPage />)
  const user = userEvent.setup()
  await user.click(await screen.findByTitle('Take Down'))
  await user.click(screen.getByRole('button', { name: 'Ya, turunkan' }))
  await waitFor(() => expect(reads).toBe(2))
  await waitFor(() => expect(screen.queryByRole('table')).toBeNull())
  expect(screen.getByRole('status').textContent).toContain('Slider berhasil diturunkan dari Landing Page.')
  finishRefresh()
  expect(await screen.findByText('Refresh slider gagal')).not.toBeNull()
  expect(writes).toHaveLength(1)
  expect(reads).toBe(2)
  await user.type(screen.getByPlaceholderText('Cari judul slider...'), 'tetap')
  expect(screen.getByText('Refresh slider gagal')).not.toBeNull()
  expect(reads).toBe(2)
})

test('slider upload keeps the multipart endpoint/order and clears native file input only after POST success', async () => {
  signIn()
  const calls = []
  const writes = []
  let imageBody = ''
  vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:upload-slider')
  server.use(
    http.get(endpoint, () => { calls.push('GET'); return sliderResponse([]) }),
    http.post('http://localhost:8080/api/uploads/image', async ({ request }) => {
      calls.push('UPLOAD')
      imageBody = await request.text()
      return sliderResponse({ data: { path: '/uploads/saved.png' } })
    }),
    http.post(endpoint, async ({ request }) => { calls.push('POST'); writes.push(await request.json()); return sliderResponse({}) }),
  )
  const view = render(<CreateSlider />)
  const user = userEvent.setup()
  const input = view.container.querySelector('input[type="file"]')
  await user.upload(input, new File(['fixture image'], 'slider.png', { type: 'image/png' }))
  await user.click(screen.getByRole('button', { name: 'Buat Slider' }))
  expect(await screen.findByText('Slider berhasil dibuat.')).not.toBeNull()
  expect(calls).toEqual(['GET', 'UPLOAD', 'POST'])
  expect(imageBody).toContain('name="image"; filename="slider.png"')
  expect(writes).toEqual([{ title: '', background_image: '/uploads/saved.png', order: 1, is_active: false, buttons: [] }])
  expect(screen.queryByAltText('Slider preview')).toBeNull()
  expect(input.value).toBe('')
  expect(input.files).toHaveLength(0)
})

test.each(['guest', 'operator', { name: 'admin' }])('slider pages retain strict string-role guards for %j', async (role) => {
  signIn(role)
  const reads = vi.fn(() => sliderResponse([slider]))
  server.use(http.get(endpoint, reads))
  const view = render(<ListSliderPage />)
  expect(screen.getByText('Akses Ditolak')).not.toBeNull()
  expect(reads).not.toHaveBeenCalled()
  view.unmount()
  render(<CreateSlider editingSlider={slider} />)
  expect(screen.getByText('Akses Ditolak')).not.toBeNull()
  expect(screen.queryByRole('button', { name: 'Simpan Perubahan' })).toBeNull()
})
