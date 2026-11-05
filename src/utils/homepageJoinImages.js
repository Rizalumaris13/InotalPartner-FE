import { JOIN_IMAGE_SLOTS } from '../data/homepageJoinImages'

export const MAX_JOIN_IMAGE_URL_LENGTH = 2048
export const JOIN_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_JOIN_IMAGE_BYTES = 5 * 1024 * 1024

export const validateJoinImageFile = (file) => {
  if (!file || !JOIN_IMAGE_MIME_TYPES.includes(file.type)) return 'Format foto harus JPG, PNG, atau WEBP.'
  if (file.size <= 0) return 'File foto tidak boleh kosong.'
  if (file.size > MAX_JOIN_IMAGE_BYTES) return 'Ukuran foto maksimal 5 MB.'
  return ''
}

export const isJoinImageUrl = (value) => {
  if (typeof value !== 'string' || !value || value.length > MAX_JOIN_IMAGE_URL_LENGTH) return false
  if ([...value].some((char) => char.codePointAt(0) <= 0x20 || char.codePointAt(0) === 0x7f || char === '\\')) return false
  if (/^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(value)) return true
  if (!/^https?:\/\//i.test(value)) return false
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

export const isJoinImagesRecord = (record) =>
  Boolean(record && typeof record === 'object' && !Array.isArray(record)) &&
  JOIN_IMAGE_SLOTS.every(({ key }) => isJoinImageUrl(record[key]))

// resolveImageUrl bawaan hanya mengenali skema huruf kecil; selaraskan skema absolut.
export const normalizeJoinImageUrl = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/^(https?):\/\//i, (_, scheme) => `${scheme.toLowerCase()}://`)
    : ''

export const toJoinImagesPayload = (form) => Object.fromEntries(
  JOIN_IMAGE_SLOTS.map(({ key }) => [key, normalizeJoinImageUrl(form?.[key])]),
)

export const getJoinImagesErrorMessage = (error, fallback) => {
  const message = error?.response?.data?.message
  if (typeof message === 'string' && message.trim()) return message
  if (!error?.isAxiosError && typeof error?.message === 'string' && error.message.trim()) return error.message
  return fallback
}
