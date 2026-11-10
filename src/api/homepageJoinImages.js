import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import { isJoinImagesRecord, toJoinImagesPayload } from '../utils/homepageJoinImages'

export const JOIN_IMAGES_PATH = '/homepage/join-images'

const readResponse = ({ data: body }) => {
  const record = readNullableContent(body, isJoinImagesRecord, 'Format data gambar kolase tidak sesuai kontrak.')
  // Respons tervalidasi tetap dinormalisasi agar cocok dengan resolveImageUrl.
  return record === null ? null : toJoinImagesPayload(record)
}

// Resource khusus tiga foto kolase; tidak memakai resource banner/slider.
export const getPublicJoinImagesApi = (options = {}) =>
  api.get(`/public${JOIN_IMAGES_PATH}`, options).then(readResponse)

export const getJoinImagesApi = (options = {}) =>
  api.get(JOIN_IMAGES_PATH, options).then(readResponse)

export const saveJoinImagesApi = (form) => {
  const payload = toJoinImagesPayload(form)
  if (!isJoinImagesRecord(payload)) throw new Error('Ketiga URL gambar kolase harus valid.')
  return api.put(JOIN_IMAGES_PATH, payload).then(({ data: body }) =>
    requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan gambar kolase.'),
  )
}
