import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 detik
})

// Request interceptor
// Otomatis menyisipkan JWT token dari localStorage ke setiap request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('inotal_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Endpoint publik tidak butuh sesi: 401 di sana bukan alasan mengeluarkan pengunjung.
const isPublicPath = (url = '') => {
  let path = String(url)
  try {
    path = new URL(path, window.location.origin).pathname
  } catch {
    // URL relatif yang tidak bisa diparse tetap diperiksa apa adanya.
  }
  return path.startsWith('/api/public/') || path.startsWith('/public/')
}

// Response interceptor 
// Tangani error 401 secara global: hapus token dan redirect ke login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !isPublicPath(error.config?.url)) {
      localStorage.removeItem('inotal_token')
      localStorage.removeItem('inotal_user')
      // Redirect ke login
      window.location.hash = 'login'
    }
    return Promise.reject(error)
  }
)

export default api