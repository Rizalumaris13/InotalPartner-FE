import api from './axios'

// ─── PUBLIC API ─────────────────────────────────────────────────────────────

/**
 * Mengambil daftar statistik aktif untuk halaman publik.
 * GET /api/public/about/statistics
 */
export const getPublicStatisticsApi = async () => {
  const response = await api.get('/public/about/statistics')
  return response.data?.data || []
}

// ─── ADMIN API ──────────────────────────────────────────────────────────────

/**
 * Mengambil seluruh data statistik untuk dashboard admin (termasuk yang nonaktif).
 * GET /api/about/statistics
 */
export const getStatisticsApi = async () => {
  const response = await api.get('/about/statistics')
  return response.data?.data || []
}

/**
 * Mengambil detail statistik berdasarkan ID.
 * GET /api/about/statistics/:id
 * @param {number|string} id
 */
export const getStatisticByIdApi = async (id) => {
  const response = await api.get(`/about/statistics/${id}`)
  return response.data?.data
}

/**
 * Menambahkan data statistik baru.
 * POST /api/about/statistics
 * @param {{ title: string, icon: string, statistic_value: string, statistic_suffix?: string, description?: string, display_order?: number, is_active?: boolean }} payload
 */
export const createStatisticApi = async (payload) => {
  const response = await api.post('/about/statistics', payload)
  return response.data?.data
}

/**
 * Memperbarui data statistik berdasarkan ID.
 * PUT /api/about/statistics/:id
 * @param {number|string} id
 * @param {{ title: string, icon: string, statistic_value: string, statistic_suffix?: string, description?: string, display_order?: number, is_active?: boolean }} payload
 */
export const updateStatisticApi = async (id, payload) => {
  const response = await api.put(`/about/statistics/${id}`, payload)
  return response.data?.data
}

/**
 * Menghapus data statistik berdasarkan ID.
 * DELETE /api/about/statistics/:id
 * @param {number|string} id
 */
export const deleteStatisticApi = async (id) => {
  const response = await api.delete(`/about/statistics/${id}`)
  return response.data
}

