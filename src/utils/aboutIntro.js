import { ABOUT_INTRO_CTA_TARGETS, ABOUT_INTRO_LIMITS, CARD_ITEMS, PROGRESS_ROWS } from '../data/aboutIntro'
import { isSafeImageUrl, normalizeImageUrl } from './imageUrl'

const text = (value) => (typeof value === 'string' ? value.trim() : '')
const isFilled = (value, limit) => Boolean(text(value)) && text(value).length <= limit
// Persentase dari form boleh berupa string; hanya digit 0–100 yang diterima,
// supaya "2.5", "-1", atau "1e2" tidak berubah diam-diam jadi angka lain.
const isPercentInput = (value) => (typeof value === 'number'
  ? Number.isInteger(value) && value >= 0 && value <= 100
  : typeof value === 'string' && /^\d{1,3}$/.test(value) && Number(value) <= 100)
const isCard = (card) => Boolean(card && typeof card === 'object' && !Array.isArray(card)) &&
  isFilled(card.title, ABOUT_INTRO_LIMITS.card_title) &&
  isFilled(card.description, ABOUT_INTRO_LIMITS.card_description) &&
  Array.isArray(card.items) &&
  card.items.length === CARD_ITEMS &&
  card.items.every((item) => isFilled(item, ABOUT_INTRO_LIMITS.item))

export const isAboutIntroRecord = (record) => {
  if (!record || typeof record !== 'object' || Array.isArray(record)) return false
  const progress = record.progress
  return isFilled(record.eyebrow, ABOUT_INTRO_LIMITS.eyebrow) &&
    isFilled(record.headline, ABOUT_INTRO_LIMITS.headline) &&
    isFilled(record.headline_accent, ABOUT_INTRO_LIMITS.headline_accent) &&
    isSafeImageUrl(normalizeImageUrl(record.photo_url)) &&
    isFilled(record.photo_alt, ABOUT_INTRO_LIMITS.photo_alt) &&
    isFilled(record.progress_title, ABOUT_INTRO_LIMITS.progress_title) &&
    Array.isArray(progress) && progress.length === PROGRESS_ROWS &&
    progress.every((row) => isFilled(row?.label, ABOUT_INTRO_LIMITS.progress_label) &&
      Number.isInteger(row?.percent) && row.percent >= 0 && row.percent <= 100) &&
    isCard(record.mission) && isCard(record.vision) &&
    isFilled(record.cta_label, ABOUT_INTRO_LIMITS.cta_label) &&
    ABOUT_INTRO_CTA_TARGETS.some((target) => target.value === record.cta_target)
}

export const toAboutIntroPayload = (record) => ({
  eyebrow: text(record?.eyebrow),
  headline: text(record?.headline),
  headline_accent: text(record?.headline_accent),
  photo_url: normalizeImageUrl(record?.photo_url),
  photo_alt: text(record?.photo_alt),
  progress_title: text(record?.progress_title),
  progress: (Array.isArray(record?.progress) ? record.progress : []).map((row) => ({
    label: text(row?.label),
    percent: Number.isInteger(row?.percent) ? row.percent : Number(row?.percent),
  })),
  mission: normalizeCard(record?.mission),
  vision: normalizeCard(record?.vision),
  cta_label: text(record?.cta_label),
  cta_target: text(record?.cta_target),
})

function normalizeCard(card) {
  return {
    title: text(card?.title),
    description: text(card?.description),
    items: (Array.isArray(card?.items) ? card.items : []).map(text),
  }
}

export const validateAboutIntro = (record) => {
  const errors = {}
  const check = (key, value, limit, label) => {
    if (!text(value)) errors[key] = `${label} wajib diisi.`
    else if (text(value).length > limit) errors[key] = `${label} maksimal ${limit} karakter.`
  }
  check('eyebrow', record?.eyebrow, ABOUT_INTRO_LIMITS.eyebrow, 'Label kecil')
  check('headline', record?.headline, ABOUT_INTRO_LIMITS.headline, 'Judul utama')
  check('headline_accent', record?.headline_accent, ABOUT_INTRO_LIMITS.headline_accent, 'Judul aksen')
  if (!isSafeImageUrl(normalizeImageUrl(record?.photo_url))) {
    errors.photo_url = 'Isi URL http/https atau path /uploads/ gambar JPG, PNG, atau WEBP.'
  }
  check('photo_alt', record?.photo_alt, ABOUT_INTRO_LIMITS.photo_alt, 'Teks alternatif foto')
  check('progress_title', record?.progress_title, ABOUT_INTRO_LIMITS.progress_title, 'Judul kartu progres')

  const progress = Array.isArray(record?.progress) ? record.progress : []
  if (progress.length !== PROGRESS_ROWS) {
    errors.progress = `Isi tepat ${PROGRESS_ROWS} baris progres.`
  } else {
    progress.forEach((row, index) => {
      check(`progress-${index}-label`, row?.label, ABOUT_INTRO_LIMITS.progress_label, `Label progres ${index + 1}`)
      if (!isPercentInput(row?.percent)) {
        errors[`progress-${index}-percent`] = `Persentase progres ${index + 1} harus bilangan bulat 0–100.`
      }
    })
  }

  for (const key of ['mission', 'vision']) {
    const card = record?.[key]
    const name = key === 'mission' ? 'Misi' : 'Visi'
    check(`${key}-title`, card?.title, ABOUT_INTRO_LIMITS.card_title, `Judul ${name}`)
    check(`${key}-description`, card?.description, ABOUT_INTRO_LIMITS.card_description, `Deskripsi ${name}`)
    const items = Array.isArray(card?.items) ? card.items : []
    if (items.length !== CARD_ITEMS) {
      errors[`${key}-items`] = `Isi tepat ${CARD_ITEMS} poin ${name.toLowerCase()}.`
    } else {
      items.forEach((item, index) => {
        check(`${key}-item-${index}`, item, ABOUT_INTRO_LIMITS.item, `Poin ${name} ${index + 1}`)
      })
    }
  }

  check('cta_label', record?.cta_label, ABOUT_INTRO_LIMITS.cta_label, 'Label tombol')
  if (!ABOUT_INTRO_CTA_TARGETS.some((target) => target.value === record?.cta_target)) {
    errors.cta_target = 'Pilih halaman tujuan tombol.'
  }
  return errors
}

export { getApiErrorMessage as getAboutIntroErrorMessage } from './apiErrors'
