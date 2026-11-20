import { expect, test } from 'vitest'
import { extractYouTubeId } from '../src/utils/youtube'
import { availableMemberOrders, toMemberDraft } from '../src/utils/editorDrafts'

test.each([
  ['https://youtube.com/watch?v=watch&x=1#f', 'watch'],
  ['  https://youtu.be/short/extra?t=1  ', 'short'],
  ['https://youtube.com/embed/embed/extra', 'embed'],
  ['https://youtube.com/shorts/shorts?x=1', 'shorts'],
  ['https://youtube.com/live/live#f', 'live'],
  ['https://youtube.com/watch-extra?v=prefix', 'prefix'],
  ['https://notyoutube.com/watch?v=includes', 'includes'],
  ['https://youtube.com.example.org/watch?v=suffix', 'suffix'],
  ['https://notyoutu.be/accepted', 'accepted'],
  ['https://youtu.be//not-stripped', ''],
  ['https://youtu.be/', ''],
  ['https://youtube.com/embed/', ''],
  ['https://youtube.com/watch?v=', ''],
  ['https://youtube.com/watch', null],
  ['https://youtube.com/', null],
  ['https://example.org/watch?v=ignored', null],
  ['not a URL', null],
  ['', null],
  [null, null],
  [undefined, null],
  [42, null],
])('admin extractYouTubeId keeps includes/slice semantics for %j', (input, expected) => {
  expect(extractYouTubeId(input)).toBe(expected)
})

test('member draft factory keeps different create/edit defaults and field normalization', () => {
  expect(toMemberDraft()).toEqual({ name: '', position: '', displayOrder: 0, isActive: true, photoUrl: '', imageFile: null, imagePreview: '' })
  expect(toMemberDraft(null, 1).displayOrder).toBe(1)
  expect(toMemberDraft({ name: 'Nama', display_order: '3', is_active: null, photo_url: '/uploads/member.png' }, 1)).toEqual({
    name: 'Nama', position: '', displayOrder: 1, isActive: null, photoUrl: '/uploads/member.png', imageFile: null, imagePreview: '/uploads/member.png',
  })
  expect(toMemberDraft({ display_order: 0, is_active: false }, 1).displayOrder).toBe(0)
})

test('available member orders use only active records and retain existing numeric/string order rules', () => {
  const members = [{ is_active: true, display_order: 1 }, { is_active: true, display_order: 3 }, { is_active: false, display_order: 2 }, { is_active: true, display_order: '4' }]
  expect(availableMemberOrders(members, 4)).toEqual([2, 4, 5, 6])
  expect(availableMemberOrders(members, 1)).toEqual([2])
  expect(availableMemberOrders([], 4)).toEqual([1, 2, 3, 4])
})
