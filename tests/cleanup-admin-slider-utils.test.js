import { expect, test } from 'vitest'
import { createSliderDraft, toBannerStatusPayload, unwrapBannerList } from '../src/utils/sliders'

test('slider draft factories return independent three-button drafts and preserve original defaults', () => {
  const first = createSliderDraft()
  const second = createSliderDraft(null)
  expect(first).toEqual({
    title: '', buttons: [{ label: '', url: '' }, { label: '', url: '' }, { label: '', url: '' }],
    imageUrl: '', imageFile: null, imagePreview: '', order: 1,
  })
  first.buttons[0].label = 'Edited'
  expect(first.buttons[1].label).toBe('')
  expect(second.buttons[0].label).toBe('')
})

test('slider draft uses array position, not stored button order, and keeps only three slots', () => {
  expect(createSliderDraft({
    title: 'Judul', background_image: '/uploads/slider.jpg', order: '5',
    buttons: [{ label: 'A', url: '/a', order: 9 }, null, { url: '/c', order: 1 }, { label: 'D' }],
  })).toEqual({
    title: 'Judul', buttons: [{ label: 'A', url: '/a' }, { label: '', url: '' }, { label: '', url: '/c' }],
    imageUrl: '/uploads/slider.jpg', imageFile: null, imagePreview: 'http://localhost:8080/uploads/slider.jpg', order: 5,
  })
  expect(createSliderDraft({ title: null, buttons: {}, order: 0 }).order).toBe(1)
})

test.each([undefined, null, {}, { data: {} }, { banners: {} }, { data: [], banners: [{ id: 2 }] }])('unrecognized or empty higher-priority list envelopes remain empty: %j', (response) => {
  expect(unwrapBannerList(response)).toEqual([])
})

test('slider list envelope precedence is direct array, data, then banners without copying', () => {
  const list = [{ id: 1 }]
  expect(unwrapBannerList(list)).toBe(list)
  expect(unwrapBannerList({ data: list, banners: [{ id: 2 }] })).toBe(list)
  expect(unwrapBannerList({ data: {}, banners: list })).toBe(list)
})

test('status payload keeps every original button including ids, extra fields and unnormalized order', () => {
  const buttons = [{ id: 4, label: 'A', description: 'Desc', url: '/a', order: 8, custom: true }]
  expect(toBannerStatusPayload({ title: 'Judul', background_image: '/a.jpg', order: '5', buttons }, false)).toEqual({
    title: 'Judul', background_image: '/a.jpg', order: 5, is_active: false, buttons,
  })
  expect(toBannerStatusPayload({ buttons }, true).buttons).toBe(buttons)
  expect(toBannerStatusPayload({ title: null, background_image: null, order: 0, buttons: {} }, true)).toEqual({
    title: '', background_image: '', order: 1, is_active: true, buttons: [],
  })
})
