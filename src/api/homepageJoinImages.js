import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import { withEndpointFallback } from './endpointFallback'
import { isJoinImagesRecord, toJoinImagesPayload } from '../utils/homepageJoinImages'

// Endpoint backend yang sebenarnya untuk pengaturan section & gambar Mengapa Bergabung:
// - Admin: GET /api/homepage/reason-settings, PUT /api/homepage/reason-settings
// - Public: GET /api/public/homepage/reasons
export const REASON_SETTINGS_PATH = '/homepage/reason-settings'
export const PUBLIC_REASONS_PATH = '/public/homepage/reasons'
export const JOIN_IMAGES_PATH = '/homepage/join-images'

const readResponse = ({ data: body }) => {
  const record = readNullableContent(body, isJoinImagesRecord, 'Format data gambar kolase tidak sesuai kontrak.')
  // Respons tervalidasi tetap dinormalisasi agar cocok dengan resolveImageUrl.
  return record === null ? null : toJoinImagesPayload(record)
}

const DEFAULT_REASON_SETTING = {
  section_label: 'MENGAPA BERGABUNG',
  section_title: 'Saatnya Bersama Beraksi',
  section_description: 'Indonesia butuh pemuda generasi masa depan emas 2045.',
  is_active: true,
}
const CONTRACT_ERROR = 'Format data gambar kolase tidak sesuai kontrak.'

// Backend slots one/two/three correspond to top-left/bottom-right/center.
export const mapBackendSettingToImages = (data) => {
  if (data === null) return null
  return {
    top_left_url: data?.image_one_url,
    bottom_right_url: data?.image_two_url,
    center_url: data?.image_three_url,
  }
}

export const mapImagesToBackendPayload = (images, existingSetting = {}) => ({
  section_label: existingSetting?.section_label ?? DEFAULT_REASON_SETTING.section_label,
  section_title: existingSetting?.section_title ?? DEFAULT_REASON_SETTING.section_title,
  section_description: existingSetting?.section_description ?? DEFAULT_REASON_SETTING.section_description,
  image_one_url: images.top_left_url,
  image_two_url: images.bottom_right_url,
  image_three_url: images.center_url,
  is_active: existingSetting?.is_active ?? DEFAULT_REASON_SETTING.is_active,
})

const isBackendSetting = (data) => Boolean(data && typeof data === 'object' && !Array.isArray(data)) &&
  isJoinImagesRecord(mapBackendSettingToImages(data)) &&
  ['section_label', 'section_title', 'section_description'].every((key) =>
    !Object.hasOwn(data, key) || typeof data[key] === 'string') &&
  (!Object.hasOwn(data, 'is_active') || typeof data.is_active === 'boolean')

const readSetting = ({ data: body }) => readNullableContent(body, isBackendSetting, CONTRACT_ERROR)

const readAdminResponse = ({ data: body }) => {
  const setting = readSetting({ data: body })
  return setting === null ? null : toJoinImagesPayload(mapBackendSettingToImages(setting))
}

const readPublicResponse = ({ data: body }) => {
  const data = readNullableContent(body, (value) => Boolean(value && typeof value === 'object' &&
    !Array.isArray(value) && Object.hasOwn(value, 'setting') &&
    (value.setting === null || isBackendSetting(value.setting))), CONTRACT_ERROR)
  return data === null || data.setting === null ? null : toJoinImagesPayload(mapBackendSettingToImages(data.setting))
}

export const getPublicJoinImagesApi = (options = {}) =>
  withEndpointFallback(
    api.get(`/public${JOIN_IMAGES_PATH}`, options).then(readResponse),
    () => api.get(PUBLIC_REASONS_PATH, options).then(readPublicResponse),
  )

export const getJoinImagesApi = (options = {}) =>
  withEndpointFallback(
    api.get(JOIN_IMAGES_PATH, options).then(readResponse),
    () => api.get(REASON_SETTINGS_PATH, options).then(readAdminResponse),
  )

export const saveJoinImagesApi = (form) => {
  const payload = toJoinImagesPayload(form)
  if (!isJoinImagesRecord(payload)) throw new Error('Ketiga URL gambar kolase harus valid.')
  return withEndpointFallback(
    api.put(JOIN_IMAGES_PATH, payload).then(({ data: body }) =>
      requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan gambar kolase.'),
    ),
    () => saveBackendSetting(payload),
  )
}

const saveBackendSetting = async (images) => {
  // Preserve the section copy and publication state; a failed GET blocks PUT.
  const currentSetting = await api.get(REASON_SETTINGS_PATH).then(readSetting)
  const payload = mapImagesToBackendPayload(images, currentSetting)
  const { data: body } = await api.put(REASON_SETTINGS_PATH, payload)
  requireContentAcknowledgement(body, 'Backend belum mengonfirmasi penerimaan gambar kolase.')
}
