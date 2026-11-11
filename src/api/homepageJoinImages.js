import api from './axios'
import { isJoinImagesRecord, toJoinImagesPayload } from '../utils/homepageJoinImages'

// Endpoint backend yang sebenarnya untuk pengaturan section & gambar Mengapa Bergabung:
// - Admin: GET /api/homepage/reason-settings, PUT /api/homepage/reason-settings
// - Public: GET /api/public/homepage/reasons
export const REASON_SETTINGS_PATH = '/homepage/reason-settings'
export const PUBLIC_REASONS_PATH = '/public/homepage/reasons'

/**
 * Mengubah format dari backend model (image_one_url, image_two_url, image_three_url)
 * ke format frontend slot (top_left_url, bottom_right_url, center_url).
 * 
 * Sesuai dokumentasi dan desain tampilan:
 * - image_one_url   -> top_left_url     (kiri atas, tim diskusi)
 * - image_two_url   -> bottom_right_url (kanan bawah, kemitraan)
 * - image_three_url -> center_url       (tengah utama, kolaborasi)
 */
export const mapBackendSettingToImages = (data) => {
  if (!data) return null
  return {
    top_left_url: data.image_one_url || '',
    bottom_right_url: data.image_two_url || '',
    center_url: data.image_three_url || '',
  }
}

/**
 * Mengubah format dari frontend slot ke payload PUT /api/homepage/reason-settings backend.
 */
export const mapImagesToBackendPayload = (images, existingSetting = {}) => ({
  section_label: existingSetting?.section_label || 'MENGAPA BERGABUNG',
  section_title: existingSetting?.section_title || 'Saatnya Bersama Beraksi',
  section_description: existingSetting?.section_description || 'Indonesia butuh pemuda generasi masa depan emas 2045.',
  image_one_url: images.top_left_url || '',
  image_two_url: images.bottom_right_url || '',
  image_three_url: images.center_url || '',
  is_active: existingSetting?.is_active ?? true,
})

const readAdminResponse = ({ data: body }) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true) {
    throw new Error('Format data gambar kolase tidak sesuai kontrak.')
  }
  if (!body.data) return null
  const images = mapBackendSettingToImages(body.data)
  return toJoinImagesPayload(images)
}

const readPublicResponse = ({ data: body }) => {
  if (body?.success === false && typeof body.message === 'string' && body.message.trim()) {
    throw new Error(body.message)
  }
  if (body?.success !== true) {
    throw new Error('Format data publik Mengapa Bergabung tidak sesuai kontrak.')
  }
  const setting = body.data?.setting
  if (!setting) return null
  const images = mapBackendSettingToImages(setting)
  return toJoinImagesPayload(images)
}

// GET /api/public/homepage/reasons
export const getPublicJoinImagesApi = (options = {}) =>
  api.get(PUBLIC_REASONS_PATH, options).then(readPublicResponse)

// GET /api/homepage/reason-settings
export const getJoinImagesApi = (options = {}) =>
  api.get(REASON_SETTINGS_PATH, options).then(readAdminResponse)

// PUT /api/homepage/reason-settings
export const saveJoinImagesApi = async (form) => {
  const imagesPayload = toJoinImagesPayload(form)
  if (!isJoinImagesRecord(imagesPayload)) {
    throw new Error('Ketiga URL gambar kolase harus valid.')
  }

  // Dapatkan setting saat ini agar section_label, title, description tidak tertimpa kosong
  let currentSetting = null
  try {
    const res = await api.get(REASON_SETTINGS_PATH)
    if (res.data?.success && res.data?.data) {
      currentSetting = res.data.data
    }
  } catch {
    // Gunakan fallback default jika get setting gagal
  }

  const payload = mapImagesToBackendPayload(imagesPayload, currentSetting)

  const { data: body } = await api.put(REASON_SETTINGS_PATH, payload)
  if (body?.success !== true) {
    throw new Error(
      typeof body?.message === 'string' && body.message.trim()
        ? body.message
        : 'Backend belum mengonfirmasi penerimaan gambar kolase.'
    )
  }
  return body.data
}
