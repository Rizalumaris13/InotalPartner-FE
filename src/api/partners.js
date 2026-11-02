import api from './axios'
import {
  PARTNER_NAME_MAX_LENGTH,
  PARTNER_NAME_MIN_LENGTH,
} from '../utils/partners'

// Kontrak backend Go dijelaskan di docs/api-kemitraan.md.
const PARTNERS_PATH = '/homepage/partners'

const isPartner = (partner) =>
  Boolean(
    partner &&
    typeof partner === 'object' &&
    Number.isSafeInteger(partner.id) &&
    partner.id > 0 &&
    typeof partner.name === 'string' &&
    partner.name.trim().length >= PARTNER_NAME_MIN_LENGTH &&
    partner.name.trim().length <= PARTNER_NAME_MAX_LENGTH &&
    typeof partner.logo_url === 'string' &&
    typeof partner.website_url === 'string' &&
    Number.isSafeInteger(partner.sort_order) &&
    partner.sort_order >= 0 &&
    typeof partner.is_active === 'boolean',
  )

const assertSuccess = (response) => {
  if (response.data?.success === false) {
    const message = response.data.message
    throw new Error(
      typeof message === 'string' && message.trim()
        ? message
        : 'Backend menolak perubahan mitra.',
    )
  }
}

const readList = (response) => {
  assertSuccess(response)
  const data = response.data?.data
  if (
    !Array.isArray(data) ||
    !data.every(isPartner) ||
    new Set(data.map((item) => item.id)).size !== data.length
  ) {
    throw new Error('Format data mitra dari backend tidak sesuai kontrak.')
  }
  return data
}

const readSaved = (response, expectedId) => {
  assertSuccess(response)
  const partner = response.data?.data
  if (!isPartner(partner))
    throw new Error('Respons penyimpanan mitra tidak sesuai kontrak.')
  if (expectedId !== undefined && partner.id !== expectedId)
    throw new Error('ID mitra pada respons backend tidak sesuai.')
  return partner
}

export const getPublicPartnersApi = ({ signal } = {}) =>
  api.get(`/public${PARTNERS_PATH}`, { signal }).then(readList)

export const listPartnersApi = ({ signal } = {}) =>
  api.get(PARTNERS_PATH, { signal }).then(readList)

export const createPartnerApi = (payload) =>
  api.post(PARTNERS_PATH, payload).then(readSaved)

export const updatePartnerApi = (id, payload) =>
  api
    .put(`${PARTNERS_PATH}/${encodeURIComponent(id)}`, payload)
    .then((response) => readSaved(response, id))

export const deletePartnerApi = (id) =>
  api.delete(`${PARTNERS_PATH}/${encodeURIComponent(id)}`).then((response) => {
    assertSuccess(response)
    if (response.status !== 204 && response.data?.success !== true) {
      throw new Error('Backend tidak mengonfirmasi penghapusan mitra.')
    }
    return response.data?.data ?? null
  })
