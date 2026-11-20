import api from './axios'
import { readNullableContent, requireContentAcknowledgement } from './contentResponse'
import { positiveResourceId } from '../utils/resourceId'

const isStatistic = (value) => Boolean(value && typeof value === 'object' && !Array.isArray(value)) &&
  Number.isSafeInteger(value.id) && value.id > 0 &&
  ['title', 'icon', 'statistic_value'].every((key) => typeof value[key] === 'string') &&
  ['statistic_suffix', 'description'].every((key) => value[key] === undefined || typeof value[key] === 'string') &&
  (value.display_order === undefined || (Number.isInteger(value.display_order) && value.display_order >= 0)) &&
  (value.is_active === undefined || typeof value.is_active === 'boolean')

const readList = (body) => readNullableContent(body,
  (value) => Array.isArray(value) && value.every(isStatistic), 'Format data statistik tidak sesuai kontrak.') ?? []

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

/**
 * Mengambil daftar statistik aktif untuk halaman publik.
 * GET /api/public/about/statistics
 */
export const getPublicStatisticsApi = async (options = {}) => {
  const response = await api.get('/public/about/statistics', options)
  return readList(response.data)
}

// ─── ADMIN API ──────────────────────────────────────────────────────────────

/**
 * Mengambil seluruh data statistik untuk dashboard admin (termasuk yang nonaktif).
 * GET /api/about/statistics
 */
export const getStatisticsApi = async () => {
  const response = await api.get('/about/statistics')
  return readList(response.data)
}

/**
 * Mengambil detail statistik berdasarkan ID.
 * GET /api/about/statistics/:id
 * @param {number|string} id
 */
export const getStatisticByIdApi = async (id) => {
  const response = await api.get(`/about/statistics/${positiveResourceId(id)}`)
  return readNullableContent(response.data, isStatistic, 'Format detail statistik tidak sesuai kontrak.')
}

/**
 * Menambahkan data statistik baru.
 * POST /api/about/statistics
 * @param {{ title: string, icon: string, statistic_value: string, statistic_suffix?: string, description?: string, display_order?: number, is_active?: boolean }} payload
 */
export const createStatisticApi = async (payload) => {
  const response = await api.post('/about/statistics', payload)
  requireContentAcknowledgement(response.data, 'Backend belum mengonfirmasi penerimaan statistik.')
  return response.data?.data
}

/**
 * Memperbarui data statistik berdasarkan ID.
 * PUT /api/about/statistics/:id
 * @param {number|string} id
 * @param {{ title: string, icon: string, statistic_value: string, statistic_suffix?: string, description?: string, display_order?: number, is_active?: boolean }} payload
 */
export const updateStatisticApi = async (id, payload) => {
  const response = await api.put(`/about/statistics/${positiveResourceId(id)}`, payload)
  requireContentAcknowledgement(response.data, 'Backend belum mengonfirmasi penerimaan statistik.')
  return response.data?.data
}

/**
 * Menghapus data statistik berdasarkan ID.
 * DELETE /api/about/statistics/:id
 * @param {number|string} id
 */
export const deleteStatisticApi = async (id) => {
  const response = await api.delete(`/about/statistics/${positiveResourceId(id)}`)
  requireContentAcknowledgement(response.data, 'Backend belum mengonfirmasi penghapusan statistik.')
  return response.data
}
