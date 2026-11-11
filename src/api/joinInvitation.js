import api from './axios'

/**
 * Mengambil data Ajakan Bergabung aktif untuk publik.
 * GET /api/public/home/cta
 */
export const getPublicJoinInvitationApi = async () => {
  try {
    const response = await api.get('/public/home/cta')
    return response.data?.data || null
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil data Ajakan Bergabung'
    throw new Error(message)
  }
}

/**
 * Mengambil seluruh data Ajakan Bergabung untuk admin (termasuk nonaktif).
 * GET /api/home/cta
 */
export const getJoinInvitationsApi = async () => {
  try {
    const response = await api.get('/home/cta')
    return response.data?.data || []
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil daftar Ajakan Bergabung'
    throw new Error(message)
  }
}

/**
 * Mengambil detail data Ajakan Bergabung berdasarkan ID.
 * GET /api/home/cta/:id
 */
export const getJoinInvitationByIdApi = async (id) => {
  try {
    const response = await api.get(`/home/cta/${id}`)
    return response.data?.data || null
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil detail Ajakan Bergabung'
    throw new Error(message)
  }
}

/**
 * Membuat data Ajakan Bergabung baru.
 * POST /api/home/cta
 */
export const createJoinInvitationApi = async (payload) => {
  try {
    const response = await api.post('/home/cta', payload)
    return response.data?.data || response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal membuat Ajakan Bergabung'
    throw new Error(message)
  }
}

/**
 * Memperbarui data Ajakan Bergabung.
 * PUT /api/home/cta/:id
 */
export const updateJoinInvitationApi = async (id, payload) => {
  try {
    const response = await api.put(`/home/cta/${id}`, payload)
    return response.data?.data || response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal memperbarui Ajakan Bergabung'
    throw new Error(message)
  }
}

/**
 * Menghapus data Ajakan Bergabung.
 * DELETE /api/home/cta/:id
 */
export const deleteJoinInvitationApi = async (id) => {
  try {
    const response = await api.delete(`/home/cta/${id}`)
    return response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal menghapus Ajakan Bergabung'
    throw new Error(message)
  }
}

// Backward compatibility alias jika ada yang memanggil nama lama
export const getPublicHomeCTAApi = getPublicJoinInvitationApi
export const getHomeCTAsApi = getJoinInvitationsApi
export const getHomeCTAByIdApi = getJoinInvitationByIdApi
export const createHomeCTAApi = createJoinInvitationApi
export const updateHomeCTAApi = updateJoinInvitationApi
export const deleteHomeCTAApi = deleteJoinInvitationApi

