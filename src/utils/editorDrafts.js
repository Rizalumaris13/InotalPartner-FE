import { resolveImageUrl } from '../api/posts'

export function toMemberDraft(member, defaultOrder = 0) {
  const photoUrl = member?.photo_url || ''
  return {
    name: member?.name || '',
    position: member?.position || '',
    displayOrder: typeof member?.display_order === 'number' ? member.display_order : defaultOrder,
    isActive: member?.is_active !== undefined ? member.is_active : true,
    photoUrl,
    imageFile: null,
    imagePreview: photoUrl ? resolveImageUrl(photoUrl) : '',
  }
}

export function availableMemberOrders(members, count) {
  const usedOrders = new Set(
    (members || []).filter((member) => member.is_active).map((member) => member.display_order)
  )
  const orders = []
  let candidate = 1
  while (orders.length < count) {
    if (!usedOrders.has(candidate)) orders.push(candidate)
    candidate++
  }
  return orders
}
