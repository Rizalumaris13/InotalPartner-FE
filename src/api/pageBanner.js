import api from './axios'

// ─── ADMIN / CMS PAGE BANNER API ──────────────────────────────────────────────

/**
 * Mengambil data hero banner berdasarkan page_type (about, event, news, contact).
 * GET /api/page-banners/:page_type
 */
export const getPageBannerApi = (pageType) => {
  return api
    .get(`/page-banners/${pageType}`)
    .then((response) => response.data?.data || null)
}

/**
 * Membuat data hero banner baru untuk page_type tertentu.
 * POST /api/page-banners/:page_type
 */
export const createPageBannerApi = (pageType, payload) => {
  return api
    .post(`/page-banners/${pageType}`, payload)
    .then((response) => response.data?.data || null)
}

/**
 * Memperbarui data hero banner untuk page_type tertentu.
 * PUT /api/page-banners/:page_type
 */
export const updatePageBannerApi = (pageType, payload) => {
  return api
    .put(`/page-banners/${pageType}`, payload)
    .then((response) => response.data?.data || null)
}

/**
 * Menghapus data hero banner untuk page_type tertentu.
 * DELETE /api/page-banners/:page_type
 */
export const deletePageBannerApi = (pageType) => {
  return api
    .delete(`/page-banners/${pageType}`)
    .then((response) => response.data)
}

// ─── PUBLIC PAGE BANNER API ───────────────────────────────────────────────────

/**
 * Mengambil data hero banner aktif untuk pengunjung halaman publik.
 * GET /api/public/page-banners/:page_type
 */
export const getPublicPageBannerApi = (pageType) => {
  return api
    .get(`/public/page-banners/${pageType}`)
    .then((response) => response.data?.data || null)
}

