import { afterEach, describe, expect, test, vi } from 'vitest'
import api from '../src/api/axios'
import {
  JOIN_CARDS_PATH, REASONS_PATH, getJoinCardsApi, getPublicJoinCardsApi,
  normalizeToSixCards, saveJoinCardsApi,
} from '../src/api/homepageJoinCards'
import {
  JOIN_IMAGES_PATH, REASON_SETTINGS_PATH, getJoinImagesApi, getPublicJoinImagesApi,
  mapImagesToBackendPayload, saveJoinImagesApi,
} from '../src/api/homepageJoinImages'
import { DEFAULT_JOIN_CARDS } from '../src/data/homepageJoinCards'
import { DEFAULT_JOIN_IMAGES } from '../src/data/homepageJoinImages'

const missingRoute = { isAxiosError: true, response: { status: 404 } }
const response = (data) => ({ data: { success: true, data } })
const acknowledgement = () => ({ data: { success: true, message: 'Tersimpan.' } })
const reasons = DEFAULT_JOIN_CARDS.map((card) => ({
  id: card.position + 100,
  number: String(card.position).padStart(2, '0'),
  title: card.title,
  description: card.description,
  display_order: card.position - 1,
  is_active: true,
}))
const setting = {
  ...mapImagesToBackendPayload(DEFAULT_JOIN_IMAGES),
  section_label: 'Label tersimpan',
  section_title: 'Judul tersimpan',
  section_description: 'Deskripsi tersimpan',
  is_active: false,
}
const publicData = { setting, reasons }
const resources = [
  { name: 'kartu', path: JOIN_CARDS_PATH, backend: REASONS_PATH, record: DEFAULT_JOIN_CARDS,
    backendRecord: reasons, admin: getJoinCardsApi, public: getPublicJoinCardsApi, save: saveJoinCardsApi },
  { name: 'kolase', path: JOIN_IMAGES_PATH, backend: REASON_SETTINGS_PATH, record: DEFAULT_JOIN_IMAGES,
    backendRecord: setting, admin: getJoinImagesApi, public: getPublicJoinImagesApi, save: saveJoinImagesApi },
]

afterEach(() => vi.restoreAllMocks())

describe.each(resources)('kompatibilitas endpoint $name', (resource) => {
  test.each(['admin', 'public'])('GET %s memakai kontrak lama bila tersedia', async (kind) => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(response(resource.record))
    const options = { params: { page: 1 }, signal: new AbortController().signal }
    expect(await resource[kind](options)).toEqual(resource.record)
    expect(get).toHaveBeenCalledExactlyOnceWith(`${kind === 'public' ? '/public' : ''}${resource.path}`, options)
  })

  test.each(['admin', 'public'])('GET %s pada 404 memetakan kontrak tim dan meneruskan opsi', async (kind) => {
    const get = vi.spyOn(api, 'get').mockRejectedValueOnce(missingRoute)
      .mockResolvedValueOnce(response(kind === 'public' ? publicData : resource.backendRecord))
    const options = { params: { test: 'mapping' }, signal: new AbortController().signal }
    const result = await resource[kind](options)
    if (resource.name === 'kartu') {
      expect(result.map(({ position, title, description }) => ({ position, title, description }))).toEqual(resource.record)
    } else {
      expect(result).toEqual(resource.record)
    }
    expect(get.mock.calls).toEqual([
      [`${kind === 'public' ? '/public' : ''}${resource.path}`, options],
      [kind === 'public' ? '/public/homepage/reasons' : resource.backend, options],
    ])
  })

  test.each([401, 403, 409, 500, 503])('HTTP %s bukan alasan berganti endpoint atau menulis ulang', async (status) => {
    const error = { isAxiosError: true, response: { status } }
    const get = vi.spyOn(api, 'get').mockRejectedValue(error)
    const put = vi.spyOn(api, 'put').mockRejectedValue(error)
    const post = vi.spyOn(api, 'post')
    await expect(resource.admin()).rejects.toBe(error)
    await expect(resource.save(resource.record)).rejects.toBe(error)
    expect(get).toHaveBeenCalledOnce()
    expect(put).toHaveBeenCalledOnce()
    expect(post).not.toHaveBeenCalled()
  })

  test('error jaringan dan pembatalan GET diteruskan tanpa fallback', async () => {
    const error = new Error('Network Error')
    const get = vi.spyOn(api, 'get').mockRejectedValue(error)
    await expect(resource.public()).rejects.toBe(error)
    expect(get).toHaveBeenCalledOnce()
  })

  test('kontrak lama yang malformed ditolak, bukan dialihkan ke backend lain', async () => {
    const get = vi.spyOn(api, 'get').mockResolvedValue(response({}))
    await expect(resource.admin()).rejects.toThrow('kontrak')
    expect(get).toHaveBeenCalledOnce()
  })

  test.each([401, 403, 404, 503])('GET preflight tim gagal %s: tidak ada write baru', async (status) => {
    const error = { isAxiosError: true, response: { status } }
    const put = vi.spyOn(api, 'put').mockRejectedValueOnce(missingRoute)
    const get = vi.spyOn(api, 'get').mockRejectedValue(error)
    const post = vi.spyOn(api, 'post')
    await expect(resource.save(resource.record)).rejects.toBe(error)
    expect(get).toHaveBeenCalledExactlyOnceWith(resource.backend)
    expect(put).toHaveBeenCalledOnce()
    expect(post).not.toHaveBeenCalled()
  })

  test('GET preflight malformed: tidak menganggap database kosong', async () => {
    const put = vi.spyOn(api, 'put').mockRejectedValueOnce(missingRoute)
    vi.spyOn(api, 'get').mockResolvedValue(response({}))
    const post = vi.spyOn(api, 'post')
    await expect(resource.save(resource.record)).rejects.toThrow('kontrak')
    expect(put).toHaveBeenCalledOnce()
    expect(post).not.toHaveBeenCalled()
  })

  test('konfirmasi write lama false bukan pemicu fallback', async () => {
    const put = vi.spyOn(api, 'put').mockResolvedValue({ data: { success: false, message: 'Tulis ditolak.' } })
    const get = vi.spyOn(api, 'get')
    await expect(resource.save(resource.record)).rejects.toThrow('Tulis ditolak.')
    expect(put).toHaveBeenCalledOnce()
    expect(get).not.toHaveBeenCalled()
  })
})

test('normalisasi kartu mengisi slot yang kosong tanpa memutasi default atau record backend', () => {
  const row = { ...reasons[2], title: 'Judul tim' }
  const result = normalizeToSixCards([row])
  expect(result).toHaveLength(6)
  expect(result[2]).toEqual({ id: row.id, position: 3, title: row.title, description: row.description })
  expect(result[0]).toEqual(DEFAULT_JOIN_CARDS[0])
  expect(result[0]).not.toBe(DEFAULT_JOIN_CARDS[0])
  result[0].title = 'Draf'
  expect(DEFAULT_JOIN_CARDS[0].title).not.toBe('Draf')
  expect(row).toEqual({ ...reasons[2], title: 'Judul tim' })
  expect(normalizeToSixCards([{ ...row, number: undefined, display_order: 2 }])[2].position).toBe(3)
})

test.each([
  undefined, {}, [null], [...reasons, reasons[0]],
  [{ ...reasons[0], id: '../users/1' }], [{ ...reasons[0], id: 0 }],
  [{ ...reasons[0], number: '1junk' }], [{ ...reasons[0], number: '7' }],
  [{ ...reasons[0], number: '', display_order: -1 }],
  [{ ...reasons[0], title: '' }], [{ ...reasons[0], description: {} }],
  [{ ...reasons[0], is_active: 'false' }], [reasons[0], { ...reasons[1], number: '01' }],
].map((rows) => [rows]))('kontrak kartu tim malformed ditolak admin dan publik: %#', async (rows) => {
  vi.spyOn(api, 'get').mockRejectedValueOnce(missingRoute).mockResolvedValueOnce(response(rows))
    .mockRejectedValueOnce(missingRoute).mockResolvedValueOnce(response({ reasons: rows }))
  await expect(getJoinCardsApi()).rejects.toThrow('kontrak')
  await expect(getPublicJoinCardsApi()).rejects.toThrow('kontrak')
})

test.each([null, []].map((rows) => [rows]))('kartu tim yang belum dibuat mengembalikan null: %#', async (rows) => {
  vi.spyOn(api, 'get').mockRejectedValueOnce(missingRoute).mockResolvedValueOnce(response(rows))
  expect(await getJoinCardsApi()).toBeNull()
})

test('write kartu tim memakai ID berdasarkan number, menjaga status, dan tidak mengirim field asing', async () => {
  const existing = reasons.map((row, index) => ({ ...row, display_order: 5 - index, is_active: index !== 1 })).reverse()
  vi.spyOn(api, 'get').mockResolvedValue(response(existing))
  const put = vi.spyOn(api, 'put').mockRejectedValueOnce(missingRoute).mockImplementation(acknowledgement)
  const post = vi.spyOn(api, 'post')
  const input = DEFAULT_JOIN_CARDS.map((card) => ({ ...card, title: ` ${card.title} `, id: 'untrusted', role: 'admin' })).reverse()
  expect(await saveJoinCardsApi(input)).toBeUndefined()
  expect(put.mock.calls.slice(1)).toEqual(reasons.map((row, index) => [
    `${REASONS_PATH}/${row.id}`,
    { number: row.number, title: row.title, description: row.description, display_order: index, is_active: index !== 1 },
  ]))
  expect(post).not.toHaveBeenCalled()
})

test('write kartu tim hanya membuat slot yang tidak ada dan berhenti pada konfirmasi gagal', async () => {
  vi.spyOn(api, 'get').mockResolvedValue(response([reasons[0]]))
  const put = vi.spyOn(api, 'put').mockRejectedValueOnce(missingRoute).mockImplementation(acknowledgement)
  const post = vi.spyOn(api, 'post').mockResolvedValueOnce({ data: { success: false, message: 'Kartu 02 gagal.' } })
  await expect(saveJoinCardsApi(DEFAULT_JOIN_CARDS)).rejects.toThrow('Kartu 02 gagal.')
  expect(put).toHaveBeenCalledTimes(2)
  expect(post).toHaveBeenCalledExactlyOnceWith(REASONS_PATH, {
    number: '02', title: reasons[1].title, description: reasons[1].description, display_order: 1, is_active: true,
  })
})

test.each([null, 1, false, [], {}].map((message) => [message]))('write kartu tim menolak message bukan string: %#', async (message) => {
  vi.spyOn(api, 'get').mockResolvedValue(response(reasons))
  const put = vi.spyOn(api, 'put').mockRejectedValueOnce(missingRoute)
    .mockResolvedValueOnce({ data: { success: true, message } })
  await expect(saveJoinCardsApi(DEFAULT_JOIN_CARDS)).rejects.toThrow('belum mengonfirmasi')
  expect(put).toHaveBeenCalledTimes(2)
})

test('write kolase tim menjaga teks kosong yang disengaja, status nonaktif, dan pemetaan slot', async () => {
  const existing = { ...setting, section_label: '', section_description: '', role: 'admin' }
  vi.spyOn(api, 'get').mockResolvedValue(response(existing))
  const put = vi.spyOn(api, 'put').mockRejectedValueOnce(missingRoute).mockImplementation(acknowledgement)
  const images = { ...DEFAULT_JOIN_IMAGES, center_url: '/uploads/pusat.png', title: 'Jangan kirim', role: 'guest' }
  expect(await saveJoinImagesApi(images)).toBeUndefined()
  expect(put.mock.calls[1]).toEqual([REASON_SETTINGS_PATH, {
    section_label: '', section_title: existing.section_title, section_description: '',
    image_one_url: images.top_left_url, image_two_url: images.bottom_right_url, image_three_url: images.center_url,
    is_active: false,
  }])
})

test('write kolase tim hanya memakai default section setelah GET valid dengan data null', async () => {
  vi.spyOn(api, 'get').mockResolvedValue(response(null))
  const put = vi.spyOn(api, 'put').mockRejectedValueOnce(missingRoute).mockImplementation(acknowledgement)
  await saveJoinImagesApi(DEFAULT_JOIN_IMAGES)
  expect(put.mock.calls[1]).toEqual([REASON_SETTINGS_PATH, mapImagesToBackendPayload(DEFAULT_JOIN_IMAGES)])
})

test.each([
  {}, [], { ...setting, image_one_url: 'javascript:alert(1)' },
  { ...setting, image_two_url: 'data:image/svg+xml,<svg/>' },
  { ...setting, image_three_url: '/uploads/../private.png' },
  { ...setting, section_title: {} }, { ...setting, is_active: 'false' },
].map((data) => [data]))('kontrak kolase tim malformed tidak menjadi default: %#', async (data) => {
  vi.spyOn(api, 'get').mockRejectedValueOnce(missingRoute).mockResolvedValueOnce(response(data))
    .mockRejectedValueOnce(missingRoute).mockResolvedValueOnce(response({ setting: data }))
  await expect(getJoinImagesApi()).rejects.toThrow('kontrak')
  await expect(getPublicJoinImagesApi()).rejects.toThrow('kontrak')
})

test('public kolase menerima setting null dan tidak menerima envelope tanpa setting', async () => {
  vi.spyOn(api, 'get').mockRejectedValueOnce(missingRoute).mockResolvedValueOnce(response({ setting: null, reasons: [] }))
    .mockRejectedValueOnce(missingRoute).mockResolvedValueOnce(response({ reasons: [] }))
  expect(await getPublicJoinImagesApi()).toBeNull()
  await expect(getPublicJoinImagesApi()).rejects.toThrow('kontrak')
})
