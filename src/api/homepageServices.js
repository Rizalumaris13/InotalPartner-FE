import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import { isHomepageServicesRecord, toHomepageServicesPayload } from '../utils/homepageServices'

export const HOMEPAGE_SERVICES_PATH = '/homepage/services'

const readResponse = ({ data: body }) => {
  const record = readNullableContent(body, isHomepageServicesRecord, 'Format data layanan Beranda tidak sesuai kontrak.')
  return record === null ? null : toHomepageServicesPayload(record)
}

export const getPublicHomepageServicesApi = (options = {}) =>
  api.get(`/public${HOMEPAGE_SERVICES_PATH}`, options).then(readResponse)

export const getHomepageServicesApi = (options = {}) =>
  api.get(HOMEPAGE_SERVICES_PATH, options).then(readResponse)

export const saveHomepageServicesApi = (record) => {
  const payload = toHomepageServicesPayload(record)
  if (!isHomepageServicesRecord(payload)) throw new Error('Isian layanan Beranda belum valid.')
  return api.put(HOMEPAGE_SERVICES_PATH, payload).then(({ data: body }) =>
    requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan layanan Beranda.'),
  )
}
