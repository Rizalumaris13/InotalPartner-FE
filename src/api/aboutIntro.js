import api from './axios'
import { isAboutIntroRecord, toAboutIntroPayload } from '../utils/aboutIntro'

export const ABOUT_INTRO_PATH = '/about/intro'

const readResponse = ({ data: body }) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true || (body.data !== null && !isAboutIntroRecord(body.data))) {
    throw new Error('Format data intro Tentang tidak sesuai kontrak.')
  }
  return body.data === null ? null : toAboutIntroPayload(body.data)
}

export const getPublicAboutIntroApi = (options = {}) =>
  api.get(`/public${ABOUT_INTRO_PATH}`, options).then(readResponse)

export const getAboutIntroApi = (options = {}) =>
  api.get(ABOUT_INTRO_PATH, options).then(readResponse)

export const saveAboutIntroApi = (record) => {
  const payload = toAboutIntroPayload(record)
  if (!isAboutIntroRecord(payload)) throw new Error('Isian intro Tentang belum valid.')
  return api.put(ABOUT_INTRO_PATH, payload).then(({ data: body }) => {
    if (body?.success !== true) {
      throw new Error(typeof body?.message === 'string' && body.message.trim()
        ? body.message : 'Backend belum mengonfirmasi penerimaan intro Tentang.')
    }
    // Bukti tersimpan adalah GET ulang oleh pemanggil, bukan respons PUT ini.
  })
}
