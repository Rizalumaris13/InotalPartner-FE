import { act, renderHook } from '@testing-library/react'
import { describe, expect, test, vi } from 'vitest'
import api from '../src/api/axios'
import {
  createTestimonialApi, deleteTestimonialApi, getPublicTestimonialsApi,
  getTestimonialByIdApi, getTestimonialsApi, updateTestimonialApi,
} from '../src/api/testimonials'
import {
  createBannerApi, deleteBannerApi, getBannersApi, getPublicBannersApi,
  resolveBannerImageUrl, updateBannerApi, uploadBannerImageApi,
} from '../src/api/homepageBanners'
import { useAuth } from '../src/hooks/useAuth'

const payload = { title: 'Draf uji' }
const image = new File(['foto'], 'foto.png', { type: 'image/png' })
const operations = [
  { name: 'testimoni publik', method: 'get', args: ['/public/testimonials'], run: getPublicTestimonialsApi, fallback: 'Gagal mengambil data testimoni', policy: 'testimonial', envelope: 'body' },
  { name: 'daftar testimoni', method: 'get', args: ['/testimonials'], run: getTestimonialsApi, fallback: 'Gagal mengambil daftar testimoni', policy: 'testimonial', envelope: 'list' },
  { name: 'detail testimoni', method: 'get', args: ['/testimonials/17'], run: () => getTestimonialByIdApi(17), fallback: 'Gagal mengambil detail testimoni', policy: 'testimonial', envelope: 'detail' },
  { name: 'buat testimoni', method: 'post', args: ['/testimonials', payload], run: () => createTestimonialApi(payload), fallback: 'Gagal membuat testimoni', policy: 'testimonial', envelope: 'write' },
  { name: 'ubah testimoni', method: 'put', args: ['/testimonials/17', payload], run: () => updateTestimonialApi(17, payload), fallback: 'Gagal memperbarui testimoni', policy: 'testimonial', envelope: 'write' },
  { name: 'hapus testimoni', method: 'delete', args: ['/testimonials/17'], run: () => deleteTestimonialApi(17), fallback: 'Gagal menghapus testimoni', policy: 'testimonial', envelope: 'body' },
  { name: 'slider admin', method: 'get', args: ['http://localhost:8080/api/homepage/banners'], run: getBannersApi, fallback: 'Gagal mengambil data slider.', policy: 'banner', envelope: 'body' },
  { name: 'slider publik', method: 'get', args: ['http://localhost:8080/api/public/homepage/banners'], run: getPublicBannersApi, fallback: 'Gagal mengambil slider Landing Page.', policy: 'banner', envelope: 'body' },
  { name: 'upload slider', method: 'post', args: ['http://localhost:8080/api/uploads/image'], run: () => uploadBannerImageApi(image), fallback: 'Gagal mengupload gambar.', policy: 'banner', envelope: 'upload' },
  { name: 'buat slider', method: 'post', args: ['http://localhost:8080/api/homepage/banners', payload], run: () => createBannerApi(payload), fallback: 'Gagal membuat slider.', policy: 'banner', envelope: 'body' },
  { name: 'ubah slider', method: 'put', args: ['http://localhost:8080/api/homepage/banners/17', payload], run: () => updateBannerApi(17, payload), fallback: 'Gagal mengubah slider.', policy: 'banner', envelope: 'body' },
  { name: 'hapus slider', method: 'delete', args: ['http://localhost:8080/api/homepage/banners/17'], run: () => deleteBannerApi(17), fallback: 'Gagal menurunkan slider.', policy: 'banner', envelope: 'body' },
]

const messageCases = [
  { name: 'pesan backend utuh', body: { message: '  Pesan server.  ', error: 'Lain' }, raw: 'Network Error', expected: '  Pesan server.  ' },
  { name: 'whitespace truthy', body: { message: ' \t ' }, raw: 'Network Error', expected: ' \t ' },
  { name: 'pesan nonstring truthy', body: { message: 42 }, raw: 'Network Error', expected: '42' },
  { name: 'body.error hanya untuk slider', body: { error: 'Pesan slider.' }, raw: 'Network Error', testimonial: 'Network Error', banner: 'Pesan slider.' },
  { name: 'jaringan Axios', body: {}, raw: 'Network Error', testimonial: 'Network Error' },
  { name: 'pesan kosong', body: { message: '', error: '' }, raw: '' },
]

describe.each(operations)('$name', (operation) => {
  test.each(messageCases)('pesan tetap sama dan cause asli dipertahankan: $name', async (sample) => {
    const original = Object.assign(new Error(sample.raw), {
      isAxiosError: true,
      code: 'ERR_NETWORK',
      response: { status: 500, data: sample.body },
    })
    vi.spyOn(api, operation.method).mockRejectedValueOnce(original)
    const error = await operation.run().catch((caught) => caught)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe(sample.expected ?? sample[operation.policy] ?? operation.fallback)
    expect(error).not.toBe(original)
    expect(error.response).toBeUndefined()
    expect(error.code).toBeUndefined()
    expect(error.isAxiosError).toBeUndefined()
    expect(error.cause).toBe(original)
  })

  if (operation.envelope !== 'upload') {
    test.each([
      { name: 'envelope berisi data', body: { success: true, data: { id: 17 } } },
      { name: 'data null', body: { success: true, data: null } },
      { name: 'data kosong', body: {} },
      { name: 'body null', body: null },
      { name: 'data falsy', body: { data: 0 } },
    ])('endpoint dan hasil lama: $name', async ({ body }) => {
      const request = vi.spyOn(api, operation.method).mockResolvedValueOnce({ data: body })
      const expected = {
        body,
        list: body?.data || [],
        detail: body?.data || null,
        write: body?.data || body,
      }[operation.envelope]
      expect(await operation.run()).toEqual(expected)
      expect(request).toHaveBeenCalledExactlyOnceWith(...operation.args)
    })
  }
})

test.each([
  ['/uploads/string.png', '/uploads/string.png'],
  [{ url: '/uploads/url.png' }, '/uploads/url.png'],
  [{ image_url: '/uploads/image.png' }, '/uploads/image.png'],
  [{ path: '/uploads/path.png' }, '/uploads/path.png'],
  [{ data: { url: '/uploads/nested-url.png' } }, '/uploads/nested-url.png'],
  [{ data: { image_url: '/uploads/nested-image.png' } }, '/uploads/nested-image.png'],
  [{ data: { path: '/uploads/nested-path.png' } }, '/uploads/nested-path.png'],
  [{ url: '/uploads/top.png', data: { url: '/uploads/nested.png' } }, '/uploads/top.png'],
  [{ url: '', data: { path: '/uploads/fallback.png' } }, '/uploads/fallback.png'],
  [null, ''],
  [{}, ''],
])('upload slider mempertahankan alias dan prioritas URL: %#', async (body, expected) => {
  const request = vi.spyOn(api, 'post').mockResolvedValueOnce({ data: body })
  expect(await uploadBannerImageApi(image)).toBe(expected)
  expect(request).toHaveBeenCalledTimes(1)
  const [url, form, options] = request.mock.calls[0]
  expect(url).toBe('http://localhost:8080/api/uploads/image')
  expect(form).toBeInstanceOf(FormData)
  expect(form.get('image')).toBe(image)
  expect([...form.keys()]).toEqual(['image'])
  expect(options).toEqual({ headers: { 'Content-Type': 'multipart/form-data' } })
  expect(api.defaults.timeout).toBe(10000)
})

test.each([
  [null, ''], ['', ''],
  ['/uploads/a.png', 'http://localhost:8080/uploads/a.png'],
  ['uploads/a.png', 'http://localhost:8080/uploads/a.png'],
  ['https://example.test/a.png', 'https://example.test/a.png'],
  ['blob:preview', 'blob:preview'],
  ['HTTPS://example.test/a.png', 'http://localhost:8080/HTTPS://example.test/a.png'],
  ['data:image/png;base64,AAA', 'http://localhost:8080/data:image/png;base64,AAA'],
])('resolver slider tidak diganti dengan resolver foto lain: %s', (value, expected) => {
  expect(resolveBannerImageUrl(value)).toBe(expected)
})

const authOperations = [
  { name: 'login', method: 'post', args: ['u@example.test', 'sandi-uji'], fallback: 'Login gagal, coba lagi' },
  { name: 'register', method: 'post', args: [{ fullName: 'Uji', company: 'Uji', email: 'u@example.test', password: 'sandi-uji' }], fallback: 'Registrasi gagal, coba lagi' },
  { name: 'changePassword', method: 'patch', args: [{ oldPassword: 'lama', newPassword: 'baru', confirmPassword: 'baru' }], fallback: 'Gagal mengubah password' },
]

describe.each(authOperations)('useAuth.$name', (operation) => {
  test.each([
    { name: 'backend', message: '  Pesan backend.  ', expected: '  Pesan backend.  ' },
    { name: 'whitespace', message: '  ', expected: '  ' },
    { name: 'tanpa pesan backend', message: undefined },
    { name: 'pesan backend kosong', message: '' },
    { name: 'pesan backend nonstring', message: 42, expected: 42 },
  ])('cause dan state gagal tetap benar: $name', async ({ message, expected }) => {
    const original = Object.assign(new Error('Pesan transport tidak ditampilkan'), {
      response: { status: 500, data: { message } },
    })
    vi.spyOn(api, operation.method).mockRejectedValueOnce(original)
    const { result } = renderHook(useAuth)
    let pending
    act(() => { pending = result.current[operation.name](...operation.args) })
    expect(result.current.loading).toBe(true)
    expect(result.current.error).toBeNull()
    let error
    await act(async () => { error = await pending.catch((caught) => caught) })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(expected ?? operation.fallback)
    expect(error.message).toBe(String(expected ?? operation.fallback))
    expect(error.cause).toBe(original)
    expect(error.response).toBeUndefined()
    expect(result.current.isLoggedIn).toBe(false)
  })
})

describe.each(authOperations.filter(({ name }) => name !== 'changePassword'))('sesi $name', (operation) => {
  test('kegagalan storage mempertahankan cause dan urutan penulisan lama', async () => {
    const session = { token: 'token-uji', user: { role: { name: 'operator' } } }
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { data: session } })
    const original = new Error('Storage tidak tersedia')
    const setItem = Storage.prototype.setItem
    const storage = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (key, value) {
      if (key === 'inotal_user') throw original
      return setItem.call(this, key, value)
    })
    const { result } = renderHook(useAuth)
    let error
    await act(async () => { error = await result.current[operation.name](...operation.args).catch((caught) => caught) })
    expect(storage.mock.calls).toEqual([
      ['inotal_token', session.token], ['inotal_user', JSON.stringify(session.user)],
    ])
    expect(localStorage.getItem('inotal_token')).toBe(session.token)
    expect(result.current.token).toBeNull()
    expect(result.current.user).toBeNull()
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBe(operation.fallback)
    expect(error.message).toBe(operation.fallback)
    expect(error.cause).toBe(original)
  })

  test('sukses menyimpan data mentah tanpa normalisasi role', async () => {
    const session = { token: 'token-uji', user: { role: { name: 'operator' } } }
    vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { data: session } })
    const { result } = renderHook(useAuth)
    await act(async () => {
      expect(await result.current[operation.name](...operation.args)).toBe(session)
    })
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeNull()
    expect(result.current.role).toBe(session.user.role)
    expect(result.current.token).toBe(session.token)
    expect(result.current.user).toBe(session.user)
    expect(result.current.isLoggedIn).toBe(true)
    expect(localStorage.getItem('inotal_user')).toBe(JSON.stringify(session.user))
    expect(localStorage.getItem('inotal_token')).toBe(session.token)
  })
})
