import api from './axios'

/**
 * Mengambil daftar testimoni aktif untuk landing page publik.
 * GET /api/public/testimonials
 */
export const getPublicTestimonialsApi = async () => {
  try {
    const response = await api.get('/public/testimonials')
    return response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil data testimoni'
    throw new Error(message)
  }
}

/**
 * Mengambil seluruh testimoni (aktif maupun nonaktif) untuk admin.
 * GET /api/testimonials
 */
export const getTestimonialsApi = async () => {
  try {
    const response = await api.get('/testimonials')
    return response.data?.data || []
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil daftar testimoni'
    throw new Error(message)
  }
}

/**
 * Mengambil detail testimoni berdasarkan ID.
 * GET /api/testimonials/:id
 */
export const getTestimonialByIdApi = async (id) => {
  try {
    const response = await api.get(`/testimonials/${id}`)
    return response.data?.data || null
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal mengambil detail testimoni'
    throw new Error(message)
  }
}

/**
 * Membuat testimoni baru.
 * POST /api/testimonials
 */
export const createTestimonialApi = async (payload) => {
  try {
    const response = await api.post('/testimonials', payload)
    return response.data?.data || response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal membuat testimoni'
    throw new Error(message)
  }
}

/**
 * Memperbarui testimoni berdasarkan ID.
 * PUT /api/testimonials/:id
 */
export const updateTestimonialApi = async (id, payload) => {
  try {
    const response = await api.put(`/testimonials/${id}`, payload)
    return response.data?.data || response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal memperbarui testimoni'
    throw new Error(message)
  }
}

/**
 * Menghapus testimoni berdasarkan ID.
 * DELETE /api/testimonials/:id
 */
export const deleteTestimonialApi = async (id) => {
  try {
    const response = await api.delete(`/testimonials/${id}`)
    return response.data
  } catch (error) {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      'Gagal menghapus testimoni'
    throw new Error(message)
  }
}
