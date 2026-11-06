import { expect, test } from 'vitest'
import { http, HttpResponse } from 'msw'
import { getAboutIntroApi, getPublicAboutIntroApi, saveAboutIntroApi } from '../src/api/aboutIntro'
import { DEFAULT_ABOUT_INTRO } from '../src/data/aboutIntro'
import { isAboutIntroRecord, toAboutIntroPayload, validateAboutIntro } from '../src/utils/aboutIntro'
import { isSafeImageUrl, normalizeImageUrl } from '../src/utils/imageUrl'
import { server } from './setup'

const withChange = (patch) => ({ ...DEFAULT_ABOUT_INTRO, ...patch })
const invalidRecords = [
  {}, [], 'teks',
  withChange({ eyebrow: '' }),
  withChange({ headline: 'x'.repeat(161) }),
  withChange({ photo_url: 'javascript:alert(1)' }),
  withChange({ photo_url: '/uploads/../rahasia.png' }),
  withChange({ progress: [] }),
  withChange({ progress: [{ label: 'a', percent: 50 }] }),
  withChange({ progress: [{ label: 'a', percent: 50 }, { label: 'b', percent: 101 }] }),
  withChange({ progress: [{ label: '', percent: 50 }, { label: 'b', percent: 50 }] }),
  withChange({ mission: { ...DEFAULT_ABOUT_INTRO.mission, items: ['satu', 'dua'] } }),
  withChange({ vision: { ...DEFAULT_ABOUT_INTRO.vision, description: '' } }),
  withChange({ cta_target: 'dashboard' }),
  withChange({ cta_target: 'https://jahat.example' }),
]

test.each(invalidRecords.map((data) => [data]))('record tidak valid ditolak oleh validator dan API: %#', async (data) => {
  expect(isAboutIntroRecord(data)).toBe(false)
  expect(Object.keys(validateAboutIntro(data)).length).toBeGreaterThan(0)
  server.use(
    http.get('*/api/about/intro', () => HttpResponse.json({ success: true, data })),
    http.get('*/api/public/about/intro', () => HttpResponse.json({ success: true, data })),
  )
  await expect(getAboutIntroApi()).rejects.toThrow('kontrak')
  await expect(getPublicAboutIntroApi()).rejects.toThrow('kontrak')
})

test('data null berarti belum diatur, bukan error kontrak', async () => {
  server.use(
    http.get('*/api/about/intro', () => HttpResponse.json({ success: true, data: null })),
    http.get('*/api/public/about/intro', () => HttpResponse.json({ success: true, data: null })),
  )
  expect(isAboutIntroRecord(null)).toBe(false)
  await expect(getAboutIntroApi()).resolves.toBeNull()
  await expect(getPublicAboutIntroApi()).resolves.toBeNull()
})

test('teks bawaan yang dipakai halaman lolos validasi', () => {
  expect(isAboutIntroRecord(DEFAULT_ABOUT_INTRO)).toBe(true)
  expect(validateAboutIntro(DEFAULT_ABOUT_INTRO)).toEqual({})
})

test('PUT hanya mengirim field kontrak, sudah dirapikan, dan skema dinormalkan', async () => {
  let payload
  server.use(http.put('*/api/about/intro', async ({ request }) => {
    payload = await request.json()
    return HttpResponse.json({ success: true })
  }))
  await saveAboutIntroApi({
    ...DEFAULT_ABOUT_INTRO,
    eyebrow: '  Label  ',
    photo_url: 'HTTPS://images.example.test/intro.png',
    progress: [{ label: ' A ', percent: 10 }, { label: 'B', percent: 20 }],
    cta_label: ' Tombol ',
    id: 'jangan-kirim',
    role: 'admin',
    updated_at: '2026-01-01',
  })
  expect(payload).toEqual({
    ...DEFAULT_ABOUT_INTRO,
    eyebrow: 'Label',
    photo_url: 'https://images.example.test/intro.png',
    progress: [{ label: 'A', percent: 10 }, { label: 'B', percent: 20 }],
    cta_label: 'Tombol',
  })
  expect(Object.keys(payload).sort()).toEqual([
    'cta_label', 'cta_target', 'eyebrow', 'headline', 'headline_accent', 'mission',
    'photo_alt', 'photo_url', 'progress', 'progress_title', 'vision',
  ])
})

test('respons GET publik dinormalkan sebelum dirender', async () => {
  server.use(http.get('*/api/public/about/intro', () => HttpResponse.json({
    success: true,
    data: { ...DEFAULT_ABOUT_INTRO, photo_url: 'HTTPS://images.example.test/kiri.png' },
  })))
  const record = await getPublicAboutIntroApi()
  expect(record.photo_url).toBe('https://images.example.test/kiri.png')
})

test('success false dan respons tanpa konfirmasi bukan bukti tersimpan', async () => {
  server.use(http.put('*/api/about/intro', () => HttpResponse.json({ success: false, message: 'Ditolak backend.' })))
  await expect(saveAboutIntroApi(DEFAULT_ABOUT_INTRO)).rejects.toThrow('Ditolak backend.')
  server.use(http.put('*/api/about/intro', () => HttpResponse.json({ data: DEFAULT_ABOUT_INTRO })))
  await expect(saveAboutIntroApi(DEFAULT_ABOUT_INTRO)).rejects.toThrow('belum mengonfirmasi')
})

test('helper URL gambar menolak protokol aktif, traversal, dan kredensial', () => {
  expect(isSafeImageUrl('https://images.example.test/a.png')).toBe(true)
  expect(isSafeImageUrl('/uploads/a.webp')).toBe(true)
  expect(normalizeImageUrl('HTTPS://images.example.test/a.png')).toBe('https://images.example.test/a.png')
  for (const bad of ['javascript:alert(1)', 'data:image/png;base64,AAA', '/uploads/../x.png',
    'https://user:pass@example.test/a.png', '//example.test/a.png', 'https://example.test/a b.png']) {
    expect(isSafeImageUrl(bad)).toBe(false)
  }
})

test('normalisasi payload tidak menerima angka progres berupa string', () => {
  const payload = toAboutIntroPayload({ ...DEFAULT_ABOUT_INTRO, progress: [{ label: 'A', percent: '50' }, { label: 'B', percent: 20 }] })
  expect(payload.progress[0].percent).toBe(50)
  expect(isAboutIntroRecord({ ...payload, progress: [{ label: 'A', percent: '50' }, { label: 'B', percent: 20 }] })).toBe(false)
})
