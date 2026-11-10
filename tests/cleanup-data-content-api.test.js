import { describe, expect, test, vi } from 'vitest'
import { http, HttpResponse } from 'msw'
import api from '../src/api/axios'
import { ABOUT_INTRO_PATH, getAboutIntroApi, getPublicAboutIntroApi, saveAboutIntroApi } from '../src/api/aboutIntro'
import { JOIN_CARDS_PATH, getJoinCardsApi, getPublicJoinCardsApi, saveJoinCardsApi } from '../src/api/homepageJoinCards'
import { JOIN_IMAGES_PATH, getJoinImagesApi, getPublicJoinImagesApi, saveJoinImagesApi } from '../src/api/homepageJoinImages'
import { HOMEPAGE_SERVICES_PATH, getHomepageServicesApi, getPublicHomepageServicesApi, saveHomepageServicesApi } from '../src/api/homepageServices'
import { DEFAULT_ABOUT_INTRO } from '../src/data/aboutIntro'
import { DEFAULT_JOIN_CARDS } from '../src/data/homepageJoinCards'
import { DEFAULT_JOIN_IMAGES } from '../src/data/homepageJoinImages'
import { DEFAULT_HOMEPAGE_SERVICES } from '../src/data/homepageServices'
import { server } from './setup'

const resources = [
  { name: 'intro Tentang', path: ABOUT_INTRO_PATH, expectedPath: '/about/intro', admin: getAboutIntroApi, public: getPublicAboutIntroApi, save: saveAboutIntroApi, record: DEFAULT_ABOUT_INTRO,
    invalidMessage: 'Isian intro Tentang belum valid.', formatMessage: 'Format data intro Tentang tidak sesuai kontrak.', acknowledgement: 'Backend belum mengonfirmasi penerimaan intro Tentang.' },
  { name: 'kartu Mengapa Bergabung', path: JOIN_CARDS_PATH, expectedPath: '/homepage/join-cards', admin: getJoinCardsApi, public: getPublicJoinCardsApi, save: saveJoinCardsApi, record: DEFAULT_JOIN_CARDS,
    invalidMessage: 'Enam kartu wajib berisi posisi, judul, dan deskripsi yang valid.', formatMessage: 'Format data kartu Mengapa Bergabung tidak sesuai kontrak.', acknowledgement: 'Backend belum mengonfirmasi penerimaan kartu.' },
  { name: 'gambar kolase', path: JOIN_IMAGES_PATH, expectedPath: '/homepage/join-images', admin: getJoinImagesApi, public: getPublicJoinImagesApi, save: saveJoinImagesApi, record: DEFAULT_JOIN_IMAGES,
    invalidMessage: 'Ketiga URL gambar kolase harus valid.', formatMessage: 'Format data gambar kolase tidak sesuai kontrak.', acknowledgement: 'Backend belum mengonfirmasi penerimaan gambar kolase.' },
  { name: 'layanan Beranda', path: HOMEPAGE_SERVICES_PATH, expectedPath: '/homepage/services', admin: getHomepageServicesApi, public: getPublicHomepageServicesApi, save: saveHomepageServicesApi, record: DEFAULT_HOMEPAGE_SERVICES,
    invalidMessage: 'Isian layanan Beranda belum valid.', formatMessage: 'Format data layanan Beranda tidak sesuai kontrak.', acknowledgement: 'Backend belum mengonfirmasi penerimaan layanan Beranda.' },
]

describe.each(resources)('singleton $name', (resource) => {
  describe.each(['admin', 'public'])('GET %s', (access) => {
    test('endpoint, opsi, signal, dan objek awal tetap sama', async () => {
      const options = { signal: new AbortController().signal, params: { contoh: 'tetap' }, timeout: 731 }
      const request = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: resource.record } })
      expect(resource.path).toBe(resource.expectedPath)
      expect(await resource[access](options)).toEqual(resource.record)
      expect(request).toHaveBeenCalledExactlyOnceWith(`${access === 'public' ? '/public' : ''}${resource.expectedPath}`, options)
      expect(request.mock.calls[0][1]).toBe(options)
    })

    test('tanpa opsi tetap mengirim objek kosong dan data null diterima', async () => {
      const request = vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: true, data: null } })
      await expect(resource[access]()).resolves.toBeNull()
      expect(request).toHaveBeenCalledExactlyOnceWith(`${access === 'public' ? '/public' : ''}${resource.expectedPath}`, {})
    })

    test.each([
      { name: 'body undefined', body: undefined },
      { name: 'body null', body: null },
      { name: 'body kosong', body: {} },
      { name: 'body array', body: [] },
      { name: 'body string', body: 'teks' },
      { name: 'body boolean', body: true },
      { name: 'body angka', body: 1 },
      { name: 'data tidak ada', body: { success: true } },
      { name: 'data kosong', body: { success: true, data: [] } },
      { name: 'data objek invalid', body: { success: true, data: {} } },
      { name: 'data nonobjek', body: { success: true, data: 'teks' } },
      { name: 'data falsy', body: { success: true, data: false } },
      { name: 'data nol', body: { success: true, data: 0 } },
      { name: 'success hilang', body: { data: null, message: 'Jangan diprioritaskan' } },
      { name: 'success string', body: { success: 'true', data: null, message: 'Jangan diprioritaskan' } },
      { name: 'success angka', body: { success: 1, data: null } },
      { name: 'success false pesan blank', body: { success: false, data: null, message: ' \t' } },
      { name: 'success false pesan nonstring', body: { success: false, data: null, message: 42 } },
      { name: 'success false body.error saja', body: { success: false, data: null, error: 'Jangan diprioritaskan' } },
      { name: 'data invalid pesan sukses diabaikan', body: { success: true, data: {}, message: 'Jangan diprioritaskan' } },
    ])('menolak $name dengan pesan format lama', async ({ body }) => {
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: body })
      await expect(resource[access]()).rejects.toThrow(resource.formatMessage)
    })

    test('success false mengutamakan pesan nonblank tanpa trim', async () => {
      vi.spyOn(api, 'get').mockResolvedValueOnce({ data: { success: false, data: {}, message: '  Ditolak backend.  ' } })
      await expect(resource[access]()).rejects.toThrow('  Ditolak backend.  ')
    })

    test.each([404, 500])('HTTP %s tetap reject transport; bukan konfigurasi null', async (status) => {
      server.use(http.get(`*/api${access === 'public' ? '/public' : ''}${resource.expectedPath}`, () =>
        HttpResponse.json({ message: 'Gagal dari server.' }, { status })))
      await expect(resource[access]()).rejects.toMatchObject({ isAxiosError: true, response: { status } })
    })

    test('error transport diteruskan apa adanya tanpa dibungkus', async () => {
      const original = new Error('Jaringan')
      vi.spyOn(api, 'get').mockRejectedValueOnce(original)
      await expect(resource[access]()).rejects.toBe(original)
    })
  })

  test.each([undefined, null, {}, [], 'teks'])('input invalid ditolak sinkron sebelum PUT: %#', (record) => {
    const request = vi.spyOn(api, 'put')
    expect(() => resource.save(record)).toThrow(resource.invalidMessage)
    expect(request).not.toHaveBeenCalled()
  })

  test.each([
    { name: 'body undefined', body: undefined }, { name: 'body null', body: null },
    { name: 'body kosong', body: {} }, { name: 'body array', body: [] },
    { name: 'body string', body: 'teks' }, { name: 'body boolean', body: true },
    { name: 'success false', body: { success: false } },
    { name: 'success string', body: { success: 'true' } },
    { name: 'success angka', body: { success: 1 } },
    { name: 'pesan blank', body: { success: false, message: ' \t' } },
    { name: 'pesan nonstring', body: { success: false, message: 42 } },
    { name: 'body.error', body: { success: false, error: 'Tidak dipakai' } },
  ])('PUT $name memakai pesan acknowledgement lama', async ({ body }) => {
    vi.spyOn(api, 'put').mockResolvedValueOnce({ data: body })
    await expect(resource.save(resource.record)).rejects.toThrow(resource.acknowledgement)
  })

  test.each([false, undefined, 'true', 1])('PUT status %s tetap mengutamakan pesan backend nonblank', async (success) => {
    vi.spyOn(api, 'put').mockResolvedValueOnce({ data: { success, message: '  Belum diterima.  ' } })
    await expect(resource.save(resource.record)).rejects.toThrow('  Belum diterima.  ')
  })

  test.each([undefined, null, {}, [], 'bukan record'])('PUT success true resolve undefined tanpa parsing data atau GET tersembunyi: %#', async (data) => {
    const read = vi.spyOn(api, 'get')
    const write = vi.spyOn(api, 'put').mockResolvedValueOnce({ data: { success: true, data } })
    await expect(resource.save(resource.record)).resolves.toBeUndefined()
    const expected = resource.path === JOIN_CARDS_PATH ? { cards: resource.record } : resource.record
    expect(write).toHaveBeenCalledExactlyOnceWith(resource.expectedPath, expected)
    expect(read).not.toHaveBeenCalled()
  })
})

test('GET kartu melakukan sort-copy saja: whitespace, field tambahan, dan referensi kartu tidak hilang', async () => {
  const cards = DEFAULT_JOIN_CARDS.map((card) => ({ ...card, title: ` ${card.title} `, id: `id-${card.position}`, extra: true })).reverse()
  const previous = [...cards]
  const read = vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: cards } })
  for (const load of [getJoinCardsApi, getPublicJoinCardsApi]) {
    const result = await load()
    expect(result).not.toBe(cards)
    expect(result.map(({ position }) => position)).toEqual([1, 2, 3, 4, 5, 6])
    expect(result[0]).toBe(cards[5])
    expect(result[0].title).toBe(` ${DEFAULT_JOIN_CARDS[0].title} `)
    expect(result[0].extra).toBe(true)
    expect(result[0].id).toBe('id-1')
    expect(cards).toEqual(previous)
  }
  expect(read).toHaveBeenCalledTimes(2)
  const write = vi.spyOn(api, 'put').mockResolvedValueOnce({ data: { success: true } })
  await saveJoinCardsApi(cards)
  expect(write).toHaveBeenCalledExactlyOnceWith('/homepage/join-cards', { cards: DEFAULT_JOIN_CARDS })
})

test.each([
  { name: 'intro', load: getAboutIntroApi, publicLoad: getPublicAboutIntroApi, save: saveAboutIntroApi, defaults: DEFAULT_ABOUT_INTRO, textKey: 'eyebrow', imageKey: 'photo_url' },
  { name: 'layanan', load: getHomepageServicesApi, publicLoad: getPublicHomepageServicesApi, save: saveHomepageServicesApi, defaults: DEFAULT_HOMEPAGE_SERVICES, textKey: 'title', imageKey: 'photo_primary_url' },
])('normalisasi GET/PUT $name tetap berbeda dari sort-copy kartu', async ({ load, publicLoad, save, defaults, textKey, imageKey }) => {
  const record = { ...defaults, [textKey]: `  ${defaults[textKey]}  `, [imageKey]: ' HTTPS://EXAMPLE.test:443/a/../Foto.PNG ', id: 17, role: 'admin' }
  const expected = { ...defaults, [imageKey]: 'https://EXAMPLE.test:443/a/../Foto.PNG' }
  vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: record } })
  expect(await load()).toEqual(expected)
  expect(await publicLoad()).toEqual(expected)
  const write = vi.spyOn(api, 'put').mockResolvedValueOnce({ data: { success: true } })
  await save(record)
  expect(write.mock.calls[0][1]).toEqual(expected)
  expect(record[textKey]).toBe(`  ${defaults[textKey]}  `)
})

test('GET kolase tidak menerima whitespace sebelum validasi; PUT tetap menormalisasi dahulu', async () => {
  const record = { ...DEFAULT_JOIN_IMAGES, top_left_url: ' HTTPS://EXAMPLE.test/Foto.PNG ', role: 'admin' }
  vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: record } })
  await expect(getJoinImagesApi()).rejects.toThrow('Format data gambar kolase tidak sesuai kontrak.')
  await expect(getPublicJoinImagesApi()).rejects.toThrow('Format data gambar kolase tidak sesuai kontrak.')
  const write = vi.spyOn(api, 'put').mockResolvedValueOnce({ data: { success: true } })
  await saveJoinImagesApi(record)
  expect(write).toHaveBeenCalledExactlyOnceWith('/homepage/join-images', { ...DEFAULT_JOIN_IMAGES, top_left_url: 'https://EXAMPLE.test/Foto.PNG' })
})

test('GET kolase menerima uppercase scheme lalu membuang field tambahan', async () => {
  const record = { ...DEFAULT_JOIN_IMAGES, top_left_url: 'HTTPS://EXAMPLE.test/Foto.PNG', role: 'admin' }
  vi.spyOn(api, 'get').mockResolvedValue({ data: { success: true, data: record } })
  for (const load of [getJoinImagesApi, getPublicJoinImagesApi]) {
    expect(await load()).toEqual({ ...DEFAULT_JOIN_IMAGES, top_left_url: 'https://EXAMPLE.test/Foto.PNG' })
  }
})
