import { expect, test } from 'vitest'
import { render } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { getJoinCardsApi, getPublicJoinCardsApi, saveJoinCardsApi } from '../src/api/homepageJoinCards'
import HomepageJoinCard from '../src/components/HomepageJoinCard'
import { DEFAULT_JOIN_CARDS, JOIN_CARD_FIELDS } from '../src/data/homepageJoinCards'
import { getJoinCardsErrorMessage, isJoinCardsRecord, validateJoinCards } from '../src/utils/homepageJoinCards'
import { server } from './setup'

const change = (fields) => DEFAULT_JOIN_CARDS.map((card, index) => index ? card : { ...card, ...fields })
const invalidRecords = [
  undefined, {}, [], DEFAULT_JOIN_CARDS.slice(1), [...DEFAULT_JOIN_CARDS, DEFAULT_JOIN_CARDS[0]],
  change({ position: '1' }), change({ position: 0 }), change({ position: 7 }), change({ position: 1.5 }),
  change({ position: 2 }), change({ title: '' }), change({ title: '  ' }), change({ description: '' }),
  change({ title: null }), change({ description: { text: 'bukan string' } }),
]

test.each(invalidRecords.map((data) => [data]))('admin dan publik menolak record yang tidak memenuhi kontrak: %#', async (data) => {
  server.use(
    http.get('*/api/homepage/join-cards', () => HttpResponse.json({ success: true, data })),
    http.get('*/api/public/homepage/join-cards', () => HttpResponse.json({ success: true, data })),
  )
  await expect(getJoinCardsApi()).rejects.toThrow('kontrak')
  await expect(getPublicJoinCardsApi()).rejects.toThrow('kontrak')
})

test.each(JOIN_CARD_FIELDS)('batas $key tepat diterima, batas berlebih ditolak', ({ key, maxLength }) => {
  const atLimit = change({ [key]: 'a'.repeat(maxLength) })
  expect(isJoinCardsRecord(atLimit)).toBe(true)
  expect(validateJoinCards(atLimit)).toEqual({})
  const tooLong = change({ [key]: 'a'.repeat(maxLength + 1) })
  expect(isJoinCardsRecord(tooLong)).toBe(false)
  expect(validateJoinCards(tooLong)[`1-${key}`]).toContain(`maksimal ${maxLength}`)
  expect(() => saveJoinCardsApi(tooLong)).toThrow('valid')
})

test('PUT hanya mengirim enam posisi, judul, dan deskripsi; field foto atau role tidak ikut', async () => {
  let payload
  server.use(http.put('*/api/homepage/join-cards', async ({ request }) => {
    payload = await request.json()
    return HttpResponse.json({ success: true })
  }))
  const cards = DEFAULT_JOIN_CARDS.map((card) => ({ ...card, title: ` ${card.title} `,
    image_url: '/uploads/jangan-kirim.png', role: 'admin', id: 'abaikan',
  })).reverse()
  await saveJoinCardsApi(cards)
  expect(payload).toEqual({ cards: DEFAULT_JOIN_CARDS })
  expect(() => saveJoinCardsApi(undefined)).toThrow('valid')
})

test('success false dan respons tanpa konfirmasi bukan bukti write diterima', async () => {
  server.use(http.put('*/api/homepage/join-cards', () => HttpResponse.json({ success: false, message: 'Ditolak oleh backend.' })))
  await expect(saveJoinCardsApi(DEFAULT_JOIN_CARDS)).rejects.toThrow('Ditolak oleh backend.')
  server.use(http.put('*/api/homepage/join-cards', () => HttpResponse.json({ data: DEFAULT_JOIN_CARDS })))
  await expect(saveJoinCardsApi(DEFAULT_JOIN_CARDS)).rejects.toThrow('belum mengonfirmasi')
})

test('judul duplikat tetap valid; teks HTML dirender sebagai teks, bukan markup aktif', () => {
  const repeated = DEFAULT_JOIN_CARDS.map((card) => ({ ...card, title: 'Judul yang sama' }))
  expect(isJoinCardsRecord(repeated)).toBe(true)
  const card = { position: 1, title: '<img src=x onerror=alert(1)>', description: '<script>alert(1)</script>\nTeks biasa.' }
  const { container } = render(<HomepageJoinCard card={card} />)
  expect(container.textContent).toContain(card.title)
  expect(container.textContent).toContain(card.description)
  expect(container.querySelector('script, img')).toBeNull()
})

test('pesan backend diprioritaskan, error jaringan mentah memakai fallback', () => {
  expect(getJoinCardsErrorMessage({ response: { data: { message: 'Pesan server.' } } }, 'Fallback.')).toBe('Pesan server.')
  expect(getJoinCardsErrorMessage({ isAxiosError: true, message: 'Network Error' }, 'Periksa koneksi.')).toBe('Periksa koneksi.')
  expect(getJoinCardsErrorMessage(new Error('Verifikasi belum cocok.'), 'Fallback.')).toBe('Verifikasi belum cocok.')
})
