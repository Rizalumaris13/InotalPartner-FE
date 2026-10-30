import { expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { server } from './setup'
import {
  createAboutCardApi,
  deleteAboutCardApi,
  getPublicAboutCardsApi,
  listAboutCardsApi,
  updateAboutCardApi,
} from '../src/api/aboutCards'
import {
  getAboutCardTarget,
  isAboutCardList,
  isAboutCardPayload,
  toAboutCardPayload,
  validateAboutCardForm,
} from '../src/utils/aboutCards'
import { ABOUT_CARD_ICONS } from '../src/data/aboutCardIcons'
import schema from '../src/contracts/aboutCard.schema.json'

const payload = {
  title: 'Kartu API Uji',
  description: 'Deskripsi untuk pengujian kartu API.',
  icon: 'target',
  url: '#program',
  sort_order: 1,
}
const card = { id: 1, ...payload }

test('kontrak membentuk katalog ikon dan payload eksplisit tanpa field tambahan', () => {
  expect(ABOUT_CARD_ICONS.map((item) => item.value)).toEqual(
    schema.properties.icon.enum,
  )
  expect(ABOUT_CARD_ICONS.every((item) => item.Icon && item.label)).toBe(true)
  expect(
    toAboutCardPayload({
      id: 90,
      title: ' Kartu API Uji ',
      description: ' Deskripsi untuk pengujian kartu API. ',
      icon: 'target',
      url: ' #program ',
      sort_order: '1',
      ignored: true,
    }),
  ).toEqual(payload)
  expect(isAboutCardPayload({ ...payload, id: 90 })).toBe(false)
})

test.each([
  '#program',
  '/#kontak',
  '#berita/contoh-slug',
  'https://example.test/a?b=2',
  'http://example.test/',
])('URL tujuan aman diterima: %s', (url) => {
  expect(getAboutCardTarget(url)).not.toBeNull()
})

test.each([
  'javascript:alert(1)',
  'data:text/html,test',
  'file:///etc/passwd',
  '//example.test',
  '#dashboard',
  '#login',
  '#berita/../kontak',
  '#berita/a/b',
  'https://user:pass@example.test/',
  'https://example.test/a b',
  'https://example.test/\n',
  'https://example.test/\\kontak',
  'https://example.test/' + String.fromCharCode(0),
  '',
  '/path',
])('URL tujuan tidak aman ditolak: %s', (url) => {
  expect(getAboutCardTarget(url)).toBeNull()
})

test('validasi posisi dan panjang memakai schema serta karakter Unicode', () => {
  const base = { ...payload, sort_order: '1' }
  expect(
    validateAboutCardForm({ ...base, title: '😀'.repeat(150) }, 2),
  ).toEqual({})
  expect(
    validateAboutCardForm({ ...base, title: '😀'.repeat(151) }, 2).title,
  ).toBeTruthy()
  for (const value of ['', '0', '-1', '1.5', '1e1', '3', '9007199254740992']) {
    expect(
      validateAboutCardForm({ ...base, sort_order: value }, 2).sort_order,
    ).toBeTruthy()
  }
  expect(
    validateAboutCardForm(
      { ...base, description: '', icon: '<svg />', url: 'javascript:alert(1)' },
      2,
    ),
  ).toMatchObject({
    description: expect.any(String),
    icon: expect.any(String),
    url: expect.any(String),
  })
})

test('daftar menolak ID dan posisi duplikat, lubang urutan dan field tidak valid', () => {
  expect(isAboutCardList([])).toBe(true)
  expect(isAboutCardList([{ ...card, id: 2, sort_order: 2 }, card])).toBe(true)
  for (const list of [
    null,
    [card, card],
    [card, { ...card, id: 2 }],
    [{ ...card, sort_order: 2 }],
    [{ ...card, icon: 'unknown' }],
    [{ ...card, url: 'javascript:alert(1)' }],
    [{ ...card, description: null }],
  ]) {
    expect(isAboutCardList(list)).toBe(false)
  }
})

test('API membaca koleksi publik/admin melalui kontrak yang sama', async () => {
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({ success: true, data: [card] }),
    ),
    http.get('*/api/public/about/cards', () =>
      HttpResponse.json({ success: true, data: [] }),
    ),
  )
  expect(await listAboutCardsApi()).toEqual([card])
  expect(await getPublicAboutCardsApi()).toEqual([])
})

test('API menolak respons simpan yang tidak mencerminkan perubahan atau ID edit', async () => {
  server.use(
    http.post('*/api/about/cards', () =>
      HttpResponse.json(
        { success: true, data: { ...card, title: 'Judul Tidak Berubah' } },
        { status: 201 },
      ),
    ),
  )
  await expect(createAboutCardApi(payload)).rejects.toThrow(
    'belum mencerminkan',
  )
  server.use(
    http.put('*/api/about/cards/:id', () =>
      HttpResponse.json({ success: true, data: { ...card, id: 9 } }),
    ),
  )
  await expect(updateAboutCardApi(1, payload)).rejects.toThrow('ID kartu')
})

test('API menolak success false, koleksi invalid dan penghapusan tanpa konfirmasi', async () => {
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({
        success: false,
        message: 'Tidak diizinkan',
        data: [],
      }),
    ),
  )
  await expect(listAboutCardsApi()).rejects.toThrow('Tidak diizinkan')
  server.use(
    http.get('*/api/about/cards', () =>
      HttpResponse.json({ success: true, data: [{ ...card, sort_order: 2 }] }),
    ),
  )
  await expect(listAboutCardsApi()).rejects.toThrow('tidak sesuai kontrak')
  server.use(
    http.delete('*/api/about/cards/:id', () =>
      HttpResponse.json({ data: null }),
    ),
  )
  await expect(deleteAboutCardApi(1)).rejects.toThrow('tidak mengonfirmasi')
  server.use(
    http.delete(
      '*/api/about/cards/:id',
      () => new HttpResponse(null, { status: 204 }),
    ),
  )
  await expect(deleteAboutCardApi(1)).resolves.toBeUndefined()
})

test('API menolak identifier atau payload invalid sebelum mengirim request', () => {
  expect(() => updateAboutCardApi('1', payload)).toThrow('ID')
  expect(() => deleteAboutCardApi('../1')).toThrow('ID')
  expect(() => createAboutCardApi({ ...payload, sort_order: 0 })).toThrow(
    'Data',
  )
})
