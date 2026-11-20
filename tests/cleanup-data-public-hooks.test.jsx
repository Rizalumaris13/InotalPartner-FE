import { StrictMode } from 'react'
import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, test, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import api from '../src/api/axios'
import * as introApi from '../src/api/aboutIntro'
import * as cardsApi from '../src/api/homepageJoinCards'
import * as servicesApi from '../src/api/homepageServices'
import useAboutIntro from '../src/hooks/useAboutIntro'
import useHomepageJoinCards from '../src/hooks/useHomepageJoinCards'
import useHomepageServices from '../src/hooks/useHomepageServices'
import { DEFAULT_ABOUT_INTRO } from '../src/data/aboutIntro'
import { DEFAULT_JOIN_CARDS } from '../src/data/homepageJoinCards'
import { DEFAULT_HOMEPAGE_SERVICES } from '../src/data/homepageServices'
import { server } from './setup'

const resources = [
  { name: 'intro Tentang', hook: useAboutIntro, defaults: DEFAULT_ABOUT_INTRO, module: introApi, loader: 'getPublicAboutIntroApi', admin: introApi.getAboutIntroApi, path: '/about/intro', live: { ...DEFAULT_ABOUT_INTRO, headline: 'Judul dari API' } },
  { name: 'kartu Mengapa Bergabung', hook: useHomepageJoinCards, defaults: DEFAULT_JOIN_CARDS, module: cardsApi, loader: 'getPublicJoinCardsApi', admin: cardsApi.getJoinCardsApi, path: '/homepage/join-cards', live: DEFAULT_JOIN_CARDS.map((card) => ({ ...card, title: `Judul API ${card.position}` })) },
  { name: 'layanan Beranda', hook: useHomepageServices, defaults: DEFAULT_HOMEPAGE_SERVICES, module: servicesApi, loader: 'getPublicHomepageServicesApi', admin: servicesApi.getHomepageServicesApi, path: '/homepage/services', live: { ...DEFAULT_HOMEPAGE_SERVICES, title: 'Layanan dari API' } },
]

const deferred = () => {
  let resolve
  let reject
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

const seedSession = () => {
  localStorage.setItem('inotal_token', 'sesi-uji')
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'operator', full_name: 'Pengunjung Uji' }))
  window.location.hash = ''
}

afterEach(() => { window.location.hash = '' })

describe.each(resources)('hook publik $name', (resource) => {
  test('default awal identik, satu GET per mount, tanpa fetch ulang saat render', async () => {
    const response = deferred()
    const get = vi.spyOn(api, 'get').mockReturnValueOnce(response.promise)
    const { result, rerender, unmount } = renderHook(resource.hook)
    expect(result.current).toBe(resource.defaults)
    expect(get).toHaveBeenCalledTimes(1)
    expect(get.mock.calls[0][0]).toBe(`/public${resource.path}`)
    const options = get.mock.calls[0][1]
    expect(Object.keys(options)).toEqual(['signal'])
    expect(options.signal).toBeInstanceOf(AbortSignal)
    expect(options.signal.aborted).toBe(false)
    rerender()
    expect(get).toHaveBeenCalledTimes(1)
    await act(async () => { response.resolve({ data: { success: true, data: resource.live } }) })
    expect(result.current).toEqual(resource.live)
    rerender()
    expect(get).toHaveBeenCalledTimes(1)
    unmount()
    expect(options.signal.aborted).toBe(true)
  })

  test.each([
    { name: 'null', value: null, fallback: true },
    { name: 'undefined', value: undefined, fallback: true },
    { name: 'false', value: false, fallback: false },
    { name: 'nol', value: 0, fallback: false },
    { name: 'string kosong', value: '', fallback: false },
  ])('fallback memakai nullish dan bukan truthiness: $name', async ({ value, fallback }) => {
    vi.spyOn(resource.module, resource.loader).mockResolvedValueOnce(value)
    const { result } = renderHook(resource.hook)
    await act(async () => {})
    expect(result.current).toBe(fallback ? resource.defaults : value)
  })

  test.each([
    { name: '200 null', status: 200, body: { success: true, data: null } },
    { name: '200 array kosong invalid', status: 200, body: { success: true, data: [] } },
    { name: '200 record invalid', status: 200, body: { success: true, data: {} } },
    { name: '200 body kosong', status: 200, body: {} },
    { name: '200 success false', status: 200, body: { success: false, message: 'Ditolak' } },
    { name: '404', status: 404, body: { message: 'Belum tersedia' } },
    { name: '500', status: 500, body: { message: 'Server gagal' } },
  ])('$name tetap kembali ke default, bukan error UI atau sesi baru', async ({ status, body }) => {
    seedSession()
    server.use(http.get(`*/api/public${resource.path}`, () => HttpResponse.json(body, { status })))
    const load = vi.spyOn(resource.module, resource.loader)
    const { result } = renderHook(resource.hook)
    await act(async () => { await load.mock.results[0].value.catch(() => {}) })
    expect(result.current).toBe(resource.defaults)
    expect(localStorage.getItem('inotal_token')).toBe('sesi-uji')
    expect(localStorage.getItem('inotal_user')).toContain('Pengunjung Uji')
    expect(window.location.hash).toBe('')
    expect(load).toHaveBeenCalledTimes(1)
  })

  test('respons jaringan sukses melewati parser domain sebelum mengganti default', async () => {
    server.use(http.get(`*/api/public${resource.path}`, () => HttpResponse.json({ success: true, data: resource.live })))
    const { result } = renderHook(resource.hook)
    await waitFor(() => expect(result.current).toEqual(resource.live))
  })

  test('401 publik mempertahankan sesi dan default; 401 admin tetap mengakhiri sesi', async () => {
    seedSession()
    server.use(
      http.get(`*/api/public${resource.path}`, () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
      http.get(`*/api${resource.path}`, () => HttpResponse.json({ message: 'Unauthorized' }, { status: 401 })),
    )
    const load = vi.spyOn(resource.module, resource.loader)
    const { result } = renderHook(resource.hook)
    await act(async () => { await load.mock.results[0].value.catch(() => {}) })
    expect(result.current).toBe(resource.defaults)
    expect(localStorage.getItem('inotal_token')).toBe('sesi-uji')
    expect(localStorage.getItem('inotal_user')).toContain('Pengunjung Uji')
    expect(window.location.hash).toBe('')
    await expect(resource.admin()).rejects.toMatchObject({ response: { status: 401 } })
    expect(localStorage.getItem('inotal_token')).toBeNull()
    expect(localStorage.getItem('inotal_user')).toBeNull()
    expect(window.location.hash).toBe('#login')
  })

  test.each(['sukses', 'invalid', 'reject'])('unmount meng-abort request dan mengabaikan hasil %s terlambat', async (outcome) => {
    const response = deferred()
    const get = vi.spyOn(api, 'get').mockReturnValueOnce(response.promise)
    const renders = []
    const { unmount } = renderHook(() => {
      const content = resource.hook()
      renders.push(content)
      return content
    })
    const signal = get.mock.calls[0][1].signal
    unmount()
    expect(signal.aborted).toBe(true)
    await act(async () => {
      if (outcome === 'reject') response.reject(new Error('Respons terlambat'))
      else response.resolve({ data: { success: true, data: outcome === 'invalid' ? {} : resource.live } })
    })
    expect(renders).toEqual([resource.defaults])
  })

  test.each(['sukses', 'invalid', 'reject'])('StrictMode mengabaikan respons %s dari mount yang dibatalkan', async (outcome) => {
    const first = deferred()
    const active = deferred()
    const get = vi.spyOn(api, 'get').mockReturnValueOnce(first.promise).mockReturnValueOnce(active.promise)
    const { result, rerender, unmount } = renderHook(resource.hook, { wrapper: StrictMode })
    expect(get).toHaveBeenCalledTimes(2)
    const firstSignal = get.mock.calls[0][1].signal
    const activeSignal = get.mock.calls[1][1].signal
    expect(firstSignal.aborted).toBe(true)
    expect(activeSignal.aborted).toBe(false)
    expect(firstSignal).not.toBe(activeSignal)
    await act(async () => { active.resolve({ data: { success: true, data: resource.live } }) })
    expect(result.current).toEqual(resource.live)
    const accepted = result.current
    await act(async () => {
      if (outcome === 'reject') first.reject(new Error('Respons gagal terlambat'))
      else first.resolve({ data: { success: true, data: outcome === 'invalid' ? {} : resource.defaults } })
    })
    expect(result.current).toBe(accepted)
    rerender()
    expect(get).toHaveBeenCalledTimes(2)
    unmount()
    expect(activeSignal.aborted).toBe(true)
  })

  test('mount baru tetap meminta server; tidak ada cache atau state lintas instance', async () => {
    const load = vi.spyOn(resource.module, resource.loader).mockResolvedValue(resource.live)
    const first = renderHook(resource.hook)
    await act(async () => {})
    expect(first.result.current).toBe(resource.live)
    first.unmount()
    const second = renderHook(resource.hook)
    expect(second.result.current).toBe(resource.defaults)
    expect(load).toHaveBeenCalledTimes(2)
    expect(load.mock.calls[0][0].signal.aborted).toBe(true)
    expect(load.mock.calls[1][0].signal.aborted).toBe(false)
    await act(async () => {})
    expect(second.result.current).toBe(resource.live)
  })
})
