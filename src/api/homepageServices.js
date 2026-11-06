import api from './axios'
import { isHomepageServicesRecord, toHomepageServicesPayload } from '../utils/homepageServices'

export const HOMEPAGE_SERVICES_PATH = '/homepage/services'

const readResponse = ({ data: body }) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true || (body.data !== null && !isHomepageServicesRecord(body.data))) {
    throw new Error('Format data layanan Beranda tidak sesuai kontrak.')
  }
  return body.data === null ? null : toHomepageServicesPayload(body.data)
}

export const getPublicHomepageServicesApi = (options = {}) =>
  api.get(`/public${HOMEPAGE_SERVICES_PATH}`, options).then(readResponse)

export const getHomepageServicesApi = (options = {}) =>
  api.get(HOMEPAGE_SERVICES_PATH, options).then(readResponse)

export const saveHomepageServicesApi = (record) => {
  const payload = toHomepageServicesPayload(record)
  if (!isHomepageServicesRecord(payload)) throw new Error('Isian layanan Beranda belum valid.')
  return api.put(HOMEPAGE_SERVICES_PATH, payload).then(({ data: body }) => {
    if (body?.success !== true) {
      throw new Error(typeof body?.message === 'string' && body.message.trim()
        ? body.message : 'Backend belum mengonfirmasi penerimaan layanan Beranda.')
    }
    // Bukti tersimpan adalah GET ulang oleh pemanggil, bukan respons PUT ini.
  })
}
