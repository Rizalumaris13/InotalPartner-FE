import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import { isAboutIntroRecord, toAboutIntroPayload } from '../utils/aboutIntro'

export const ABOUT_INTRO_PATH = '/about/intro'

const readResponse = ({ data: body }) => {
  const record = readNullableContent(body, isAboutIntroRecord, 'Format data intro Tentang tidak sesuai kontrak.')
  return record === null ? null : toAboutIntroPayload(record)
}

export const getPublicAboutIntroApi = (options = {}) =>
  api.get(`/public${ABOUT_INTRO_PATH}`, options).then(readResponse)

export const getAboutIntroApi = (options = {}) =>
  api.get(ABOUT_INTRO_PATH, options).then(readResponse)

export const saveAboutIntroApi = (record) => {
  const payload = toAboutIntroPayload(record)
  if (!isAboutIntroRecord(payload)) throw new Error('Isian intro Tentang belum valid.')
  return api.put(ABOUT_INTRO_PATH, payload).then(({ data: body }) =>
    requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan intro Tentang.'),
  )
}
