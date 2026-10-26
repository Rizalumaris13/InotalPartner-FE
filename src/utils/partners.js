export const PARTNER_NAME_MIN_LENGTH = 2
export const PARTNER_NAME_MAX_LENGTH = 150

export const getPartnerErrorMessage = (error, fallback) => {
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

export const sortPartners = (partners) =>
  [...partners].sort(
    (a, b) => a.sort_order - b.sort_order || Number(a.id) - Number(b.id),
  )

export const MAX_PARTNER_LOGO_SIZE = 5 * 1024 * 1024

export const validateLogoFile = (file) => {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type))
    return 'Format logo harus JPG, PNG, atau WEBP.'
  if (file.size <= 0) return 'File logo tidak boleh kosong.'
  if (file.size > MAX_PARTNER_LOGO_SIZE) return 'Ukuran logo maksimal 5 MB.'
  return ''
}

export const isHttpUrl = (value) => {
  if (typeof value !== 'string' || !/^https?:\/\//i.test(value)) return false
  try {
    const url = new URL(value)
    return ['http:', 'https:'].includes(url.protocol) && Boolean(url.hostname)
  } catch {
    return false
  }
}

export const isLogoUrl = (value) =>
  isHttpUrl(value) ||
  (typeof value === 'string' &&
    /^\/uploads\/[A-Za-z0-9_-][A-Za-z0-9._-]*$/.test(value))

export const toPartnerPayload = (form) => ({
  name: form.name.trim(),
  logo_url: form.logo_url.trim(),
  website_url: form.website_url.trim(),
  sort_order: Number(form.sort_order),
  is_active: form.is_active === true,
})

export const validatePartnerForm = (form) => {
  const payload = toPartnerPayload(form)
  const errors = {}
  if (!payload.name) errors.name = 'Nama mitra wajib diisi.'
  else if (payload.name.length < PARTNER_NAME_MIN_LENGTH)
    errors.name = `Nama mitra minimal ${PARTNER_NAME_MIN_LENGTH} karakter.`
  else if (payload.name.length > PARTNER_NAME_MAX_LENGTH)
    errors.name = `Nama mitra maksimal ${PARTNER_NAME_MAX_LENGTH} karakter.`
  if (payload.logo_url && !isLogoUrl(payload.logo_url)) {
    errors.logo_url = 'Logo harus berupa URL http/https atau path /uploads/.'
  }
  if (payload.website_url && !isHttpUrl(payload.website_url)) {
    errors.website_url =
      'Tautan situs harus berupa URL http atau https yang valid.'
  }
  if (
    !form.sort_order.trim() ||
    !Number.isSafeInteger(payload.sort_order) ||
    payload.sort_order < 0
  ) {
    errors.sort_order = 'Urutan tampil harus bilangan bulat nol atau lebih.'
  }
  return errors
}
