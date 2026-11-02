import schema from '../contracts/pageBanner.schema.json'
import { getPageBannerMeta } from '../data/pageBanners'

export const isPageBannerPage = (page) => schema.properties.page.enum.includes(page)

export const getPageBannerLabel = (page) => getPageBannerMeta(page)?.name || 'Halaman'

const hasUnsafeImageChars = (value) =>
  [...value].some((char) => {
    const code = char.codePointAt(0)
    return code <= 0x20 || code === 0x7f || char === '\\'
  })

export const isPageBannerImageUrl = (value) => {
  if (typeof value !== 'string' || !value || value.length > schema.properties.image_url.maxLength)
    return false
  if (hasUnsafeImageChars(value)) return false
  if (/^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]*\.(?:jpe?g|png|webp)$/i.test(value))
    return true
  if (!/^https?:\/\//i.test(value)) return false
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname) && !url.username && !url.password
  } catch {
    return false
  }
}

const lengthOf = (value) => [...value].length

export const toPageBannerPayload = (form) => ({
  label: form.label.trim(),
  title: form.title.trim(),
  description: form.description.trim(),
  image_url: form.image_url.trim(),
})

export const validatePageBannerForm = (form) => {
  const payload = toPageBannerPayload(form)
  const errors = {}
  for (const key of ['label', 'title', 'description']) {
    if (!payload[key]) {
      errors[key] =
        key === 'label' ? 'Label wajib diisi.' : key === 'title' ? 'Judul wajib diisi.' : 'Deskripsi wajib diisi.'
    } else if (lengthOf(payload[key]) > schema.properties[key].maxLength) {
      errors[key] = `${getPageBannerLabel(form.page)}: ${key} maksimal ${schema.properties[key].maxLength} karakter.`
    }
  }
  if (!payload.image_url) errors.image_url = 'Gambar wajib diunggah atau diisi URL-nya.'
  else if (!isPageBannerImageUrl(payload.image_url))
    errors.image_url = 'URL gambar harus http/https atau path /uploads/ dengan ekstensi gambar.'
  return errors
}

export const validateBannerImageFile = (file) => {
  if (!file) return 'File gambar tidak ditemukan.'
  if (!schema['x-upload'].mimeTypes.includes(file.type))
    return 'Format gambar harus JPG, PNG, atau WEBP.'
  if (file.size <= 0) return 'File gambar tidak boleh kosong.'
  if (file.size > schema['x-upload'].maxBytes) return 'Ukuran gambar maksimal 5 MB.'
  return ''
}

export const isPageBannerRecord = (record, page) =>
  Boolean(record && !Array.isArray(record) && isPageBannerPage(page) && record.page === page) &&
  ['label', 'title', 'description'].every((key) => {
    const value = record[key]
    const rules = schema.properties[key]
    return typeof value === 'string' && value.trim() === value &&
      lengthOf(value) >= rules.minLength && lengthOf(value) <= rules.maxLength
  }) && isPageBannerImageUrl(record.image_url)

export const getPageBannerErrorMessage = (error, fallback) => {
  const body = error?.response?.data
  for (const message of [body?.message, body?.error]) {
    if (typeof message === 'string' && message.trim()) return message
  }
  if (!error?.isAxiosError && typeof error?.message === 'string' && error.message.trim())
    return error.message
  return fallback
}
