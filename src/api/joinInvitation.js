import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import { positiveResourceId } from '../utils/resourceId'

const isInvitation = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value)) &&
  Number.isSafeInteger(value.id) && value.id > 0 &&
  ['section_label', 'title', 'button_text', 'button_url'].every((key) => typeof value[key] === 'string') &&
  (value.is_active === undefined || typeof value.is_active === 'boolean')

/**
 * Mengambil data Ajakan Bergabung aktif untuk publik.
 * GET /api/public/home/cta
 */
export const getPublicJoinInvitationApi = async (options = {}) => {
  try {
    const response = await api.get('/public/home/cta', options)
    return readNullableContent(response.data, isInvitation, 'Format data Ajakan Bergabung tidak sesuai kontrak.')
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil data Ajakan Bergabung'
    throw new Error(message, { cause: error })
  }
}

/**
 * Mengambil seluruh data Ajakan Bergabung untuk admin (termasuk nonaktif).
 * GET /api/home/cta
 */
export const getJoinInvitationsApi = async () => {
  try {
    const response = await api.get('/home/cta')
    return readNullableContent(response.data, (value) => Array.isArray(value) && value.every(isInvitation),
      'Format daftar Ajakan Bergabung tidak sesuai kontrak.') ?? []
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil daftar Ajakan Bergabung'
    throw new Error(message, { cause: error })
  }
}

/**
 * Mengambil detail data Ajakan Bergabung berdasarkan ID.
 * GET /api/home/cta/:id
 */
export const getJoinInvitationByIdApi = async (id) => {
  try {
    const response = await api.get(`/home/cta/${positiveResourceId(id)}`)
    return readNullableContent(response.data, isInvitation, 'Format detail Ajakan Bergabung tidak sesuai kontrak.')
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil detail Ajakan Bergabung'
    throw new Error(message, { cause: error })
  }
}

/**
 * Membuat data Ajakan Bergabung baru.
 * POST /api/home/cta
 */
export const createJoinInvitationApi = async (payload) => {
  try {
    const response = await api.post('/home/cta', payload)
    requireContentAcknowledgement(response.data, 'Backend belum mengonfirmasi penerimaan Ajakan Bergabung.')
    return response.data?.data || response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal membuat Ajakan Bergabung'
    throw new Error(message, { cause: error })
  }
}

/**
 * Memperbarui data Ajakan Bergabung.
 * PUT /api/home/cta/:id
 */
export const updateJoinInvitationApi = async (id, payload) => {
  try {
    const response = await api.put(`/home/cta/${positiveResourceId(id)}`, payload)
    requireContentAcknowledgement(response.data, 'Backend belum mengonfirmasi penerimaan Ajakan Bergabung.')
    return response.data?.data || response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal memperbarui Ajakan Bergabung'
    throw new Error(message, { cause: error })
  }
}

/**
 * Menghapus data Ajakan Bergabung.
 * DELETE /api/home/cta/:id
 */
export const deleteJoinInvitationApi = async (id) => {
  try {
    const response = await api.delete(`/home/cta/${positiveResourceId(id)}`)
    requireContentAcknowledgement(response.data, 'Backend belum mengonfirmasi penghapusan Ajakan Bergabung.')
    return response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal menghapus Ajakan Bergabung'
    throw new Error(message, { cause: error })
  }
}

// Backward compatibility alias jika ada yang memanggil nama lama
export const getPublicHomeCTAApi = getPublicJoinInvitationApi
export const getHomeCTAsApi = getJoinInvitationsApi
export const getHomeCTAByIdApi = getJoinInvitationByIdApi
export const createHomeCTAApi = createJoinInvitationApi
export const updateHomeCTAApi = updateJoinInvitationApi
export const deleteHomeCTAApi = deleteJoinInvitationApi
