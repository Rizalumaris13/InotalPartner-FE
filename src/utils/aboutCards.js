import schema from '../contracts/aboutCard.schema.json'

export const ABOUT_CARD_FIELDS = schema.$defs.payload.required
export const ABOUT_CARD_RULES = schema.properties
const publicRoutes = new Set([
  'landing',
  'tentang',
  'program',
  'event',
  'berita',
  'artikel',
  'partnership',
  'kontak',
])
const textLength = (value) => [...value].length

export const getAboutCardTarget = (value) => {
  if (
    typeof value !== 'string' ||
    !value ||
    textLength(value) > ABOUT_CARD_RULES.url.maxLength ||
    /[\s\\]/.test(value) ||
    [...value].some(
      (char) => char.codePointAt(0) < 32 || char.codePointAt(0) === 127,
    )
  )
    return null
  const local = /^\/?#(.+)$/.exec(value)
  if (local) {
    const route = local[1]
    return publicRoutes.has(route) || /^berita\/[A-Za-z0-9_-]+$/.test(route)
      ? { kind: 'internal', route, href: value }
      : null
  }
  if (!/^https?:\/\//i.test(value)) return null
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) &&
      url.hostname &&
      !url.username &&
      !url.password
      ? { kind: 'external', href: value }
      : null
  } catch {
    return null
  }
}

const validText = (value, rule) =>
  typeof value === 'string' &&
  value === value.trim() &&
  textLength(value) >= rule.minLength &&
  textLength(value) <= rule.maxLength

export const isAboutCard = (card) =>
  Boolean(
    card &&
    typeof card === 'object' &&
    Number.isSafeInteger(card.id) &&
    card.id >= ABOUT_CARD_RULES.id.minimum &&
    validText(card.title, ABOUT_CARD_RULES.title) &&
    validText(card.description, ABOUT_CARD_RULES.description) &&
    ABOUT_CARD_RULES.icon.enum.includes(card.icon) &&
    getAboutCardTarget(card.url) &&
    Number.isSafeInteger(card.sort_order) &&
    card.sort_order >= ABOUT_CARD_RULES.sort_order.minimum,
  )

export const sortAboutCards = (cards) =>
  [...cards].sort((a, b) => a.sort_order - b.sort_order || a.id - b.id)

export const isAboutCardList = (cards) =>
  Array.isArray(cards) &&
  cards.every(isAboutCard) &&
  new Set(cards.map((card) => card.id)).size === cards.length &&
  sortAboutCards(cards).every((card, index) => card.sort_order === index + 1)

export const toAboutCardPayload = (form) => ({
  title: form.title.trim(),
  description: form.description.trim(),
  icon: form.icon,
  url: form.url.trim(),
  sort_order: Number(form.sort_order),
})

export const isAboutCardPayload = (payload) =>
  Boolean(
    payload &&
    Object.keys(payload).length === ABOUT_CARD_FIELDS.length &&
    ABOUT_CARD_FIELDS.every((field) => Object.hasOwn(payload, field)) &&
    isAboutCard({ ...payload, id: 1 }),
  )

export const sameAboutCardPayload = (card, payload) =>
  ABOUT_CARD_FIELDS.every((field) => card[field] === payload[field])

export const validateAboutCardForm = (form, maxPosition) => {
  const payload = toAboutCardPayload(form)
  const errors = {}
  for (const field of ['title', 'description']) {
    const rule = ABOUT_CARD_RULES[field]
    const label = field === 'title' ? 'Judul' : 'Deskripsi'
    const length = textLength(payload[field])
    if (!length) errors[field] = `${label} wajib diisi.`
    else if (length < rule.minLength || length > rule.maxLength)
      errors[field] =
        `${label} harus ${rule.minLength}–${rule.maxLength} karakter.`
  }
  if (!ABOUT_CARD_RULES.icon.enum.includes(payload.icon))
    errors.icon = 'Pilih ikon dari katalog yang tersedia.'
  if (!getAboutCardTarget(payload.url))
    errors.url = 'URL harus http/https atau route publik seperti #program.'
  if (
    !/^\d+$/.test(String(form.sort_order)) ||
    !Number.isSafeInteger(payload.sort_order) ||
    payload.sort_order < 1 ||
    payload.sort_order > maxPosition
  ) {
    errors.sort_order = `Posisi harus bilangan bulat antara 1 dan ${maxPosition}.`
  }
  return errors
}

export const getAboutCardErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message
  if (
    !error?.isAxiosError &&
    typeof error?.message === 'string' &&
    error.message.trim()
  )
    return error.message
  return fallback
}

export const formatAboutCardPosition = (position) =>
  String(position).padStart(2, '0')
