import { expect, test } from 'vitest'
import {
  isJoinImageUrl, JOIN_IMAGE_MIME_TYPES, MAX_JOIN_IMAGE_BYTES,
  MAX_JOIN_IMAGE_URL_LENGTH, validateJoinImageFile,
} from '../src/utils/homepageJoinImages'

test.each(JOIN_IMAGE_MIME_TYPES)('file %s diterima sampai batas ukuran inklusif', (type) => {
  expect(validateJoinImageFile({ type, size: 1 })).toBe('')
  expect(validateJoinImageFile({ type, size: MAX_JOIN_IMAGE_BYTES })).toBe('')
})

test.each([
  [undefined, 'Format foto'],
  [{ type: 'image/svg+xml', size: 100 }, 'Format foto'],
  [{ type: 'application/pdf', size: 100 }, 'Format foto'],
  [{ type: 'image/png', size: 0 }, 'tidak boleh kosong'],
  [{ type: 'image/png', size: MAX_JOIN_IMAGE_BYTES + 1 }, 'maksimal 5 MB'],
])('file tidak valid ditolak: %j', (file, message) => {
  expect(validateJoinImageFile(file)).toContain(message)
})

test('URL gambar mendukung apostrof dan batas panjang tanpa menerima karakter kontrol', () => {
  expect(isJoinImageUrl("https://example.test/team's-photo.png")).toBe(true)
  expect(isJoinImageUrl('/uploads/photo.PNG')).toBe(true)
  const prefix = 'https://example.test/'
  const boundary = prefix + 'x'.repeat(MAX_JOIN_IMAGE_URL_LENGTH - prefix.length)
  expect(isJoinImageUrl(boundary)).toBe(true)
  expect(isJoinImageUrl(`${boundary}x`)).toBe(false)
  expect(isJoinImageUrl('https://example.test/\nphoto.png')).toBe(false)
})
