import { describe, expect, test } from 'vitest'
import { getAboutCardErrorMessage } from '../src/utils/aboutCards'
import { getAboutIntroErrorMessage } from '../src/utils/aboutIntro'
import { getJoinCardsErrorMessage } from '../src/utils/homepageJoinCards'
import {
  getJoinImagesErrorMessage, isJoinImageUrl, isJoinImagesRecord,
  JOIN_IMAGE_MIME_TYPES, MAX_JOIN_IMAGE_BYTES, MAX_JOIN_IMAGE_URL_LENGTH,
  normalizeJoinImageUrl, toJoinImagesPayload, validateJoinImageFile,
} from '../src/utils/homepageJoinImages'
import { getHomepageServicesErrorMessage } from '../src/utils/homepageServices'
import { getPartnerErrorMessage } from '../src/utils/partners'
import { getPageBannerErrorMessage } from '../src/utils/pageBanners'
import {
  IMAGE_MIME_TYPES, isSafeImageUrl, MAX_IMAGE_BYTES, MAX_IMAGE_URL_LENGTH,
  normalizeImageUrl, validateImageFile,
} from '../src/utils/imageUrl'

const formatters = [
  { name: 'aboutCards', format: getAboutCardErrorMessage },
  { name: 'aboutIntro', format: getAboutIntroErrorMessage },
  { name: 'homepageJoinCards', format: getJoinCardsErrorMessage },
  { name: 'homepageJoinImages', format: getJoinImagesErrorMessage },
  { name: 'homepageServices', format: getHomepageServicesErrorMessage },
  { name: 'partners', format: getPartnerErrorMessage },
]

const messages = [
  { name: 'undefined', error: undefined, expected: 'Cadangan.' },
  { name: 'null', error: null, expected: 'Cadangan.' },
  { name: 'objek kosong', error: {}, expected: 'Cadangan.' },
  { name: 'backend tidak dirapikan', error: { response: { data: { message: '  Pesan backend.  ' } }, message: 'Lokal' }, expected: '  Pesan backend.  ' },
  { name: 'backend menang atas Axios', error: { isAxiosError: true, response: { data: { message: 'Backend' } }, message: 'Network Error' }, expected: 'Backend' },
  { name: 'backend kosong lalu lokal', error: { response: { data: { message: '' } }, message: 'Lokal' }, expected: 'Lokal' },
  { name: 'backend whitespace lalu lokal', error: { response: { data: { message: ' \t\n' } }, message: '  Lokal  ' }, expected: '  Lokal  ' },
  { name: 'backend nonstring lalu lokal', error: { response: { data: { message: 42 } }, message: 'Lokal' }, expected: 'Lokal' },
  { name: 'backend objek lalu lokal', error: { response: { data: { message: { text: 'Backend' } } }, message: 'Lokal' }, expected: 'Lokal' },
  { name: 'body.error tidak dipakai', error: { response: { data: { error: 'Khusus banner' } } }, expected: 'Cadangan.' },
  { name: 'local Error', error: new Error('  Validasi lokal.  '), expected: '  Validasi lokal.  ' },
  { name: 'local kosong', error: new Error(''), expected: 'Cadangan.' },
  { name: 'local whitespace', error: { message: ' \t\n ' }, expected: 'Cadangan.' },
  { name: 'local nonstring', error: { message: 42 }, expected: 'Cadangan.' },
  { name: 'Axios jaringan tidak ditampilkan', error: { isAxiosError: true, message: 'Network Error' }, expected: 'Cadangan.' },
  { name: 'Axios dengan backend whitespace', error: { isAxiosError: true, message: 'Request failed', response: { data: { message: '  ' } } }, expected: 'Cadangan.' },
  { name: 'Axios flag truthy', error: { isAxiosError: 'ya', message: 'Raw' }, expected: 'Cadangan.' },
  { name: 'Axios flag false', error: { isAxiosError: false, message: 'Lokal' }, expected: 'Lokal' },
]

describe.each(formatters)('formatter kompatibel $name', ({ format }) => {
  test.each(messages)('$name', ({ error, expected }) => {
    expect(format(error, 'Cadangan.')).toBe(expected)
  })

  test('fallback tidak dikonversi atau diganti default baru', () => {
    expect(format(undefined)).toBeUndefined()
    expect(format({}, '')).toBe('')
    const fallback = { text: 'Cadangan caller' }
    expect(format(null, fallback)).toBe(fallback)
  })
})

test('formatter banner tetap memakai kebijakan body.error sendiri', () => {
  const error = { isAxiosError: true, response: { data: { message: ' ', error: '  Pesan banner.  ' } } }
  expect(getPageBannerErrorMessage(error, 'Cadangan.')).toBe('  Pesan banner.  ')
  for (const { format } of formatters) expect(format(error, 'Cadangan.')).toBe('Cadangan.')
})

const urls = [
  { value: '/uploads/foto.jpg', valid: true },
  { value: '/uploads/foto.JPEG', valid: true },
  { value: '/uploads/foto-1_2.webp', valid: true },
  { value: '/uploads/a..b.PNG', valid: true },
  { value: 'HTTPS://EXAMPLE.test:443/a/../b.PNG?Q=1#Foto', valid: true },
  { value: "https://example.test/team's-photo.png", valid: true },
  { value: 'https://example.test/path-tanpa-ekstensi', valid: true },
  { value: 'https://example.test/a%20b.png', valid: true },
  { value: 'https://example.test/' + 'a'.repeat(2048 - 'https://example.test/'.length), valid: true },
  { value: 'https://example.test/' + 'a'.repeat(2049 - 'https://example.test/'.length), valid: false },
  { value: 'https://example.test/' + '😀'.repeat(Math.floor((2048 - 'https://example.test/'.length) / 2)), valid: true },
  { value: 'https://example.test/' + '😀'.repeat(Math.floor((2048 - 'https://example.test/'.length) / 2) + 1), valid: false },
  { value: undefined, valid: false }, { value: null, valid: false },
  { value: 42, valid: false }, { value: {}, valid: false }, { value: '', valid: false },
  { value: ' /uploads/foto.png ', valid: false },
  { value: '/uploads/.foto.png', valid: false },
  { value: '/uploads/foto.svg', valid: false },
  { value: '/uploads/folder/foto.png', valid: false },
  { value: '/uploads/../foto.png', valid: false },
  { value: '/uploads/%2e%2e/foto.png', valid: false },
  { value: '/uploads/%2E%2E%2Ffoto.png', valid: false },
  { value: '/uploads/a%2fb.png', valid: false },
  { value: '/uploads/foto.png?size=1', valid: false },
  { value: '//example.test/foto.png', valid: false },
  { value: 'https://user:secret@example.test/foto.png', valid: false },
  { value: 'https://example.test/a b.png', valid: false },
  { value: 'https://example.test/a\tb.png', valid: false },
  { value: 'https://example.test/a\u007fb.png', valid: false },
  { value: 'https://example.test/a\\b.png', valid: false },
  { value: 'https://', valid: false },
  { value: 'javascript:alert(1)', valid: false },
  { value: 'data:image/png;base64,AAA', valid: false },
  { value: 'blob:foto-sementara', valid: false },
]

test.each(urls)('validator kolase dan helper gambar mempertahankan batas URL: %#', ({ value, valid }) => {
  expect(isJoinImageUrl(value)).toBe(valid)
  expect(isSafeImageUrl(value)).toBe(valid)
})

test.each([
  ['  HTTPS://EXAMPLE.test:443/a/../b.PNG?Q=1#Foto  ', 'https://EXAMPLE.test:443/a/../b.PNG?Q=1#Foto'],
  [' HTTP://example.test/foto.png ', 'http://example.test/foto.png'],
  [' /uploads/Foto.PNG ', '/uploads/Foto.PNG'],
  [' blob:sementara ', 'blob:sementara'],
  [' data:image/png;base64,AAA ', 'data:image/png;base64,AAA'],
  [null, ''], [undefined, ''], [42, ''], [{}, ''],
])('normalisasi hanya trim dan lowercase scheme: %#', (value, expected) => {
  expect(normalizeJoinImageUrl(value)).toBe(expected)
  expect(normalizeImageUrl(value)).toBe(expected)
})

test('konstanta dan pesan default file kolase tetap kompatibel', () => {
  expect(JOIN_IMAGE_MIME_TYPES).toEqual(['image/jpeg', 'image/png', 'image/webp'])
  expect(JOIN_IMAGE_MIME_TYPES).toEqual(IMAGE_MIME_TYPES)
  expect(MAX_JOIN_IMAGE_BYTES).toBe(5 * 1024 * 1024)
  expect(MAX_JOIN_IMAGE_BYTES).toBe(MAX_IMAGE_BYTES)
  expect(MAX_JOIN_IMAGE_URL_LENGTH).toBe(2048)
  expect(MAX_JOIN_IMAGE_URL_LENGTH).toBe(MAX_IMAGE_URL_LENGTH)
})

test.each([
  [undefined, 'Format foto harus JPG, PNG, atau WEBP.'],
  [null, 'Format foto harus JPG, PNG, atau WEBP.'],
  [{ type: 'image/svg+xml', size: 10 }, 'Format foto harus JPG, PNG, atau WEBP.'],
  [{ type: 'IMAGE/PNG', size: 10 }, 'Format foto harus JPG, PNG, atau WEBP.'],
  [{ type: 'image/png', size: 0 }, 'File foto tidak boleh kosong.'],
  [{ type: 'image/png', size: -1 }, 'File foto tidak boleh kosong.'],
  [{ type: 'image/png', size: 5 * 1024 * 1024 + 1 }, 'Ukuran foto maksimal 5 MB.'],
  [{ type: 'image/png', size: 5 * 1024 * 1024 }, ''],
  [{ type: 'image/webp', size: 1 }, ''],
  [{ type: 'image/jpeg', size: 1 }, ''],
])('validator file mempertahankan jenis/ukuran/pesan: %#', (file, expected) => {
  expect(validateJoinImageFile(file)).toBe(expected)
  expect(validateImageFile(file)).toBe(expected)
})

test('wrapper domain kolase tetap memilih ketiga slot dan menolak blob pada record', () => {
  const form = {
    top_left_url: ' HTTPS://example.test/Kiri.PNG ',
    center_url: '/uploads/tengah.webp',
    bottom_right_url: '/uploads/kanan.jpg',
    image_url: '/uploads/bukan-slot.png',
  }
  const payload = toJoinImagesPayload(form)
  expect(payload).toEqual({
    top_left_url: 'https://example.test/Kiri.PNG',
    center_url: '/uploads/tengah.webp',
    bottom_right_url: '/uploads/kanan.jpg',
  })
  expect(isJoinImagesRecord(form)).toBe(false)
  expect(isJoinImagesRecord(payload)).toBe(true)
  expect(isJoinImagesRecord({ ...payload, center_url: 'blob:preview' })).toBe(false)
  expect(toJoinImagesPayload(null)).toEqual({ top_left_url: '', bottom_right_url: '', center_url: '' })
})
