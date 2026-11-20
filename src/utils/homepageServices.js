import { HOMEPAGE_SERVICES_LIMITS, SERVICE_COUNT } from '../data/homepageServices'
import { SERVICE_ICON_VALUES } from '../data/partnershipServiceIcons'
import { isSafeImageUrl, normalizeImageUrl } from './imageUrl'

const text = (value) => (typeof value === 'string' ? value.trim() : '')
const isFilled = (value, limit) => Boolean(text(value)) && text(value).length <= limit
const isService = (service) => Boolean(service && typeof service === 'object' && !Array.isArray(service)) &&
  SERVICE_ICON_VALUES.includes(service.icon) &&
  isFilled(service.title, HOMEPAGE_SERVICES_LIMITS.service_title) &&
  isFilled(service.description, HOMEPAGE_SERVICES_LIMITS.service_description)

export const isHomepageServicesRecord = (record) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false
  const services = record.services
  return isFilled(record.eyebrow, HOMEPAGE_SERVICES_LIMITS.eyebrow) &&
    isFilled(record.title, HOMEPAGE_SERVICES_LIMITS.title) &&
    isFilled(record.description, HOMEPAGE_SERVICES_LIMITS.description) &&
    isFilled(record.badge_value, HOMEPAGE_SERVICES_LIMITS.badge_value) &&
    isFilled(record.badge_label, HOMEPAGE_SERVICES_LIMITS.badge_label) &&
    isSafeImageUrl(normalizeImageUrl(record.photo_primary_url)) &&
    isFilled(record.photo_primary_alt, 160) &&
    isSafeImageUrl(normalizeImageUrl(record.photo_secondary_url)) &&
    isFilled(record.photo_secondary_alt, 160) &&
    Array.isArray(services) && services.length === SERVICE_COUNT && services.every(isService)
}

export const toHomepageServicesPayload = (record) => ({
  eyebrow: text(record?.eyebrow),
  title: text(record?.title),
  description: text(record?.description),
  badge_value: text(record?.badge_value),
  badge_label: text(record?.badge_label),
  photo_primary_url: normalizeImageUrl(record?.photo_primary_url),
  photo_primary_alt: text(record?.photo_primary_alt),
  photo_secondary_url: normalizeImageUrl(record?.photo_secondary_url),
  photo_secondary_alt: text(record?.photo_secondary_alt),
  services: (Array.isArray(record?.services) ? record.services : []).map((service) => ({
    icon: text(service?.icon),
    title: text(service?.title),
    description: text(service?.description),
  })),
})

export const validateHomepageServices = (record) => {
  const errors = {}
  const check = (key, value, limit, label) => {
    if (!text(value)) errors[key] = `${label} wajib diisi.`
    else if (text(value).length > limit) errors[key] = `${label} maksimal ${limit} karakter.`
  }
  check('eyebrow', record?.eyebrow, HOMEPAGE_SERVICES_LIMITS.eyebrow, 'Label kecil')
  check('title', record?.title, HOMEPAGE_SERVICES_LIMITS.title, 'Judul bagian')
  check('description', record?.description, HOMEPAGE_SERVICES_LIMITS.description, 'Deskripsi bagian')
  check('badge_value', record?.badge_value, HOMEPAGE_SERVICES_LIMITS.badge_value, 'Angka badge')
  check('badge_label', record?.badge_label, HOMEPAGE_SERVICES_LIMITS.badge_label, 'Label badge')
  if (!isSafeImageUrl(normalizeImageUrl(record?.photo_primary_url))) {
    errors.photo_primary_url = 'Isi URL http/https atau path /uploads/ gambar JPG, PNG, atau WEBP.'
  }
  check('photo_primary_alt', record?.photo_primary_alt, 160, 'Teks alternatif foto utama')
  if (!isSafeImageUrl(normalizeImageUrl(record?.photo_secondary_url))) {
    errors.photo_secondary_url = 'Isi URL http/https atau path /uploads/ gambar JPG, PNG, atau WEBP.'
  }
  check('photo_secondary_alt', record?.photo_secondary_alt, 160, 'Teks alternatif foto kedua')

  const services = Array.isArray(record?.services) ? record.services : []
  if (services.length !== SERVICE_COUNT) {
    errors.services = `Isi tepat ${SERVICE_COUNT} kartu layanan.`
  } else {
    services.forEach((service, index) => {
      const number = index + 1
      if (!SERVICE_ICON_VALUES.includes(service?.icon)) errors[`service-${index}-icon`] = `Pilih ikon kartu ${number}.`
      check(`service-${index}-title`, service?.title, HOMEPAGE_SERVICES_LIMITS.service_title, `Judul kartu ${number}`)
      check(`service-${index}-description`, service?.description, HOMEPAGE_SERVICES_LIMITS.service_description, `Deskripsi kartu ${number}`)
    })
  }
  return errors
}

export { getApiErrorMessage as getHomepageServicesErrorMessage } from './apiErrors'
