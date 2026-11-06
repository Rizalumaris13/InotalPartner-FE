// Helper URL gambar bersama untuk konten publik (dipakai kolase & intro Tentang).
export const MAX_IMAGE_URL_LENGTH = 2048

// resolveImageUrl bawaan hanya mengenali skema huruf kecil.
export const normalizeImageUrl = (value) =>
  typeof value === 'string'
    ? value.trim().replace(/^(https?):\/\//i, (_, scheme) => `${scheme.toLowerCase()}://`)
    : ''

export const isSafeImageUrl = (value) => {
  if (typeof value !== 'string' || !value || value.length > MAX_IMAGE_URL_LENGTH) return false
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

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

export const validateImageFile = (file) => {
  if (!file || !IMAGE_MIME_TYPES.includes(file.type)) return 'Format foto harus JPG, PNG, atau WEBP.'
  if (file.size <= 0) return 'File foto tidak boleh kosong.'
  if (file.size > MAX_IMAGE_BYTES) return 'Ukuran foto maksimal 5 MB.'
  return ''
}
