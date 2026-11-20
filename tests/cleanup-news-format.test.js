import { expect, test } from 'vitest'
import * as newsFormat from '../src/utils/newsFormat'

const cases = [
  ['formatDate', undefined, '-'],
  ['formatDate', null, '-'],
  ['formatDate', '', '-'],
  ['formatDate', '2026-09-29T20:00:17+07:00', '29 September 2026'],
  ['formatDate', '2026-09-29T22:30:00Z', '30 September 2026'],
  ['formatDate', 'not-a-date', 'Invalid Date'],
  ['formatDate', 0, '-'],
  ['formatTime', undefined, '--:--'],
  ['formatTime', null, '--:--'],
  ['formatTime', '', '--:--'],
  ['formatTime', '2026-09-29T20:00:17+07:00', '20.00'],
  ['formatTime', '2026-09-29T22:30:00Z', '05.30'],
  ['formatTime', 'not-a-date', 'Invalid Date'],
  ['formatTime', 0, '--:--'],
  ['formatViewCount', undefined, '0'],
  ['formatViewCount', null, '0'],
  ['formatViewCount', '', '0'],
  ['formatViewCount', 0, '0'],
  ['formatViewCount', 1200, '1.200'],
  ['formatViewCount', '1200', '1.200'],
  ['formatViewCount', 'not-a-number', 'NaN'],
]

test.each(cases)('%s(%s) mempertahankan format WIB dan fallback lama', (name, value, expected) => {
  expect(newsFormat[name](value)).toBe(expected)
})

test('formatter tanggal dan waktu menangkap kegagalan konversi tanpa mengubah Invalid Date', () => {
  const invalid = { [Symbol.toPrimitive]() { throw new Error('tanggal tak dapat dikonversi') } }
  expect(newsFormat.formatDate(invalid)).toBe('-')
  expect(newsFormat.formatTime(invalid)).toBe('--:--')
})
