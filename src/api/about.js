// API fungsi untuk halaman About Us (publik dan admin)

import api from './axios'
import { resolveImageUrl, uploadImageApi } from './posts'

// ─── API Publik ──────────────────────────────────────────────────────────────

/**
 * Mengambil konfigurasi judul halaman Tentang yang aktif.
 * GET /api/public/about
 * Mengembalikan null pada `data` jika belum ada konfigurasi aktif.
 */
export const getPublicAboutSettingApi = async () => {
  const response = await api.get('/public/about')
  return response.data
}

/**
 * Mengambil daftar anggota tim aktif yang nama dan fotonya valid,
 * diurutkan berdasarkan display_order ASC, id ASC.
 * GET /api/public/about/team
 * Mengembalikan array kosong jika belum ada data.
 */
export const getPublicTeamMembersApi = async () => {
  const response = await api.get('/public/about/team')
  return response.data
}

/**
 * Mengambil daftar FAQ aktif untuk halaman publik Tentang Kami.
 * GET /api/public/about/faqs
 * Mengembalikan array data FAQ aktif yang diurutkan berdasarkan display_order ASC, id ASC.
 */
export const getPublicAboutFAQsApi = async () => {
  const response = await api.get('/public/about/faqs')
  return response.data
}

/**
 * Mengambil daftar video profil aktif untuk halaman publik Tentang Kami.
 * GET /api/public/about/video
 * Mengembalikan array data video profil aktif yang diurutkan berdasarkan id DESC.
 */
export const getPublicAboutVideosApi = async () => {
  const response = await api.get('/public/about/video')
  return response.data
}

/**
 * Mengambil pengaturan section video profil aktif untuk halaman publik.
 * GET /api/public/about/video-setting
 */
export const getPublicAboutVideoSettingApi = async () => {
  const response = await api.get('/public/about/video-setting')
  return response.data
}

/**
 * Mengambil daftar highlight video profil aktif untuk halaman publik.
 * GET /api/public/about/video-highlights
 */
export const getPublicAboutVideoHighlightsApi = async () => {
  const response = await api.get('/public/about/video-highlights')
  return response.data
}


// ─── API Pengelolaan Admin (Pengaturan Judul) ─────────────────────────────────

/**
 * Mengambil konfigurasi judul aktif untuk kebutuhan admin.
 * GET /api/about
 */
export const getAboutSettingApi = async () => {
  try {
    const response = await api.get('/about')
    return response.data?.data || null
  } catch (error) {
    if (error.response?.status === 404) {
      return null
    }
    throw error
  }
}

/**
 * Menyimpan / memperbarui judul halaman Tentang yang aktif.
 * PUT /api/about
 * @param {{ title: string, team_title?: string, is_active?: boolean }} payload
 */
export const saveAboutSettingApi = async (payload) => {
  const response = await api.put('/about', payload)
  return response.data?.data
}

// ─── API Pengelolaan Admin (Anggota Tim) ──────────────────────────────────────

/**
 * Mengambil seluruh anggota tim (termasuk yang nonaktif).
 * GET /api/about/team
 */
export const getTeamMembersApi = async () => {
  const response = await api.get('/about/team')
  return response.data?.data || []
}

/**
 * Mengambil detail anggota tim berdasarkan ID.
 * GET /api/about/team/:id
 */
export const getTeamMemberByIdApi = async (id) => {
  const response = await api.get(`/about/team/${id}`)
  return response.data?.data
}

/**
 * Menambahkan anggota tim baru.
 * POST /api/about/team
 * @param {{ name: string, position: string, photo_url: string, display_order: number, is_active: boolean }} payload
 */
export const createTeamMemberApi = async (payload) => {
  const response = await api.post('/about/team', payload)
  return response.data?.data
}

/**
 * Memperbarui anggota tim berdasarkan ID.
 * PUT /api/about/team/:id
 * @param {number|string} id
 * @param {{ name: string, position: string, photo_url: string, display_order?: number, is_active?: boolean }} payload
 */
export const updateTeamMemberApi = async (id, payload) => {
  const response = await api.put(`/about/team/${id}`, payload)
  return response.data?.data
}

/**
 * Menghapus anggota tim berdasarkan ID.
 * DELETE /api/about/team/:id
 * @param {number|string} id
 */
export const deleteTeamMemberApi = async (id) => {
  const response = await api.delete(`/about/team/${id}`)
  return response.data
}

// ─── API Pengelolaan Admin (FAQ) ──────────────────────────────────────────────

/**
 * Mengambil seluruh FAQ (termasuk yang nonaktif).
 * GET /api/about/faqs
 */
export const getAboutFAQsApi = async () => {
  const response = await api.get('/about/faqs')
  return response.data?.data || []
}

/**
 * Mengambil detail FAQ berdasarkan ID.
 * GET /api/about/faqs/:id
 * @param {number|string} id
 */
export const getAboutFAQByIdApi = async (id) => {
  const response = await api.get(`/about/faqs/${id}`)
  return response.data?.data
}

/**
 * Menambahkan FAQ baru.
 * POST /api/about/faqs
 * @param {{ question: string, answer: string, display_order: number, is_active: boolean }} payload
 */
export const createAboutFAQApi = async (payload) => {
  const response = await api.post('/about/faqs', payload)
  return response.data?.data
}

/**
 * Memperbarui data FAQ berdasarkan ID.
 * PUT /api/about/faqs/:id
 * @param {number|string} id
 * @param {{ question: string, answer: string, display_order?: number, is_active?: boolean }} payload
 */
export const updateAboutFAQApi = async (id, payload) => {
  const response = await api.put(`/about/faqs/${id}`, payload)
  return response.data?.data
}

/**
 * Menghapus FAQ berdasarkan ID.
 * DELETE /api/about/faqs/:id
 * @param {number|string} id
 */
export const deleteAboutFAQApi = async (id) => {
  const response = await api.delete(`/about/faqs/${id}`)
  return response.data
}

// ─── API Pengelolaan Admin (Video Profil) ─────────────────────────────────────

/**
 * Mengambil seluruh video profil (termasuk yang nonaktif).
 * GET /api/about/video
 */
export const getAboutVideosApi = async () => {
  const response = await api.get('/about/video')
  return response.data?.data || []
}

/**
 * Mengambil detail video profil berdasarkan ID.
 * GET /api/about/video/:id
 * @param {number|string} id
 */
export const getAboutVideoByIdApi = async (id) => {
  const response = await api.get(`/about/video/${id}`)
  return response.data?.data
}

/**
 * Menambahkan video profil baru.
 * POST /api/about/video
 * @param {{ title: string, description?: string, video_url: string, thumbnail_url?: string, is_active?: boolean }} payload
 */
export const createAboutVideoApi = async (payload) => {
  const response = await api.post('/about/video', payload)
  return response.data?.data
}

/**
 * Memperbarui data video profil berdasarkan ID.
 * PUT /api/about/video/:id
 * @param {number|string} id
 * @param {{ title: string, description?: string, video_url: string, thumbnail_url?: string, is_active?: boolean }} payload
 */
export const updateAboutVideoApi = async (id, payload) => {
  const response = await api.put(`/about/video/${id}`, payload)
  return response.data?.data
}

/**
 * Menghapus video profil berdasarkan ID.
 * DELETE /api/about/video/:id
 * @param {number|string} id
 */
export const deleteAboutVideoApi = async (id) => {
  const response = await api.delete(`/about/video/${id}`)
  return response.data
}


// ─── API Pengelolaan Admin (Pengaturan Section & Highlight Video Profil) ─────

/**
 * Mengambil pengaturan section video profil.
 * GET /api/about/video-setting
 */
export const getAboutVideoSettingApi = async () => {
  const response = await api.get('/about/video-setting')
  return response.data?.data
}

/**
 * Menyimpan/memperbarui pengaturan section video profil.
 * PUT /api/about/video-setting
 * @param {{ section_label?: string, section_title: string, section_description?: string, is_active?: boolean }} payload
 */
export const saveAboutVideoSettingApi = async (payload) => {
  const response = await api.put('/about/video-setting', payload)
  return response.data?.data
}

/**
 * Mengambil seluruh highlight video profil (termasuk yang nonaktif).
 * GET /api/about/video-highlights
 */
export const getAboutVideoHighlightsApi = async () => {
  const response = await api.get('/about/video-highlights')
  return response.data?.data || []
}

/**
 * Mengambil detail highlight video berdasarkan ID.
 * GET /api/about/video-highlights/:id
 * @param {number|string} id
 */
export const getAboutVideoHighlightByIdApi = async (id) => {
  const response = await api.get('/about/video-highlights/' + id)
  return response.data?.data
}

/**
 * Menambahkan highlight video baru.
 * POST /api/about/video-highlights
 * @param {{ icon?: string, title: string, description: string, display_order?: number, is_active?: boolean }} payload
 */
export const createAboutVideoHighlightApi = async (payload) => {
  const response = await api.post('/about/video-highlights', payload)
  return response.data?.data
}

/**
 * Memperbarui data highlight video berdasarkan ID.
 * PUT /api/about/video-highlights/:id
 * @param {number|string} id
 * @param {{ icon?: string, title: string, description: string, display_order?: number, is_active?: boolean }} payload
 */
export const updateAboutVideoHighlightApi = async (id, payload) => {
  const response = await api.put('/about/video-highlights/' + id, payload)
  return response.data?.data
}

/**
 * Menghapus highlight video berdasarkan ID.
 * DELETE /api/about/video-highlights/:id
 * @param {number|string} id
 */
export const deleteAboutVideoHighlightApi = async (id) => {
  const response = await api.delete('/about/video-highlights/' + id)
  return response.data
}

// Re-export helpers agar konsisten
export { resolveImageUrl, uploadImageApi }
