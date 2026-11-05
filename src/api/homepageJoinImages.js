import api from './axios'
import { isJoinImagesRecord, toJoinImagesPayload } from '../utils/homepageJoinImages'

export const JOIN_IMAGES_PATH = '/homepage/join-images'

const readResponse = ({ data: body }) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true || (body.data !== null && !isJoinImagesRecord(body.data))) {
    throw new Error('Format data gambar kolase tidak sesuai kontrak.')
  }
  // Respons tervalidasi tetap dinormalisasi agar cocok dengan resolveImageUrl.
  return body.data === null ? null : toJoinImagesPayload(body.data)
}

// Resource khusus tiga foto kolase; tidak memakai resource banner/slider.
export const getPublicJoinImagesApi = (options = {}) =>
  api.get(`/public${JOIN_IMAGES_PATH}`, options).then(readResponse)

export const getJoinImagesApi = (options = {}) =>
  api.get(JOIN_IMAGES_PATH, options).then(readResponse)

export const saveJoinImagesApi = (form) => {
  const payload = toJoinImagesPayload(form)
  if (!isJoinImagesRecord(payload)) throw new Error('Ketiga URL gambar kolase harus valid.')
  return api.put(JOIN_IMAGES_PATH, payload).then(({ data: body }) => {
    if (body?.success !== true) {
      throw new Error(typeof body?.message === 'string' && body.message.trim()
        ? body.message : 'Backend belum mengonfirmasi penerimaan gambar kolase.')
    }
    // Penerimaan PUT bukan bukti tersimpan: pemanggil wajib memverifikasi dengan GET.
  })
}
