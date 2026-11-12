import { ABOUT_EMPOWERING_FIELDS, ABOUT_EMPOWERING_LABELS, ABOUT_EMPOWERING_RULES } from '../data/aboutEmpowering'

const patterns = Object.fromEntries(ABOUT_EMPOWERING_FIELDS.map((key) => [key, new RegExp(ABOUT_EMPOWERING_RULES[key].pattern, 'u')]))

const fieldError = (key, value) => {
  const label = ABOUT_EMPOWERING_LABELS[key]
  if (typeof value !== 'string') return `${label} harus berupa teks.`
  if (patterns[key].exec(value)?.[0] !== value) return `${label} tidak boleh memuat karakter kontrol atau baris baru.`
  const rule = ABOUT_EMPOWERING_RULES[key]
  const length = Array.from(value.trim()).length
  if (length < rule.minLength) return length === 0 ? `${label} wajib diisi.` : `${label} minimal ${rule.minLength} karakter.`
  if (length > rule.maxLength) return `${label} maksimal ${rule.maxLength} karakter.`
  return ''
}

export const validateAboutEmpowering = (record) => Object.fromEntries(
  ABOUT_EMPOWERING_FIELDS.map((key) => [key, fieldError(key, record?.[key])]).filter(([, error]) => error),
)

export const isAboutEmpoweringRecord = (record) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false
  return Object.keys(validateAboutEmpowering(record)).length === 0
}

export const toAboutEmpoweringPayload = (record) => Object.fromEntries(
  ABOUT_EMPOWERING_FIELDS.map((key) => [key, typeof record?.[key] === 'string' ? record[key].trim() : '']),
)
