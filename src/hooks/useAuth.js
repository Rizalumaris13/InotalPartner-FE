import { useState, useCallback } from 'react'
import { loginApi, registerApi, loginWithGoogle } from '../api/auth'
import { changePasswordApi } from '../api/users' 

// Key untuk localStorage
const TOKEN_KEY = 'inotal_token'
const USER_KEY  = 'inotal_user'

// Helper: simpan sesi ke localStorage
const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

// Helper: hapus sesi dari localStorage
const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

// Helper: baca user tersimpan (untuk restore sesi setelah refresh)
const getSavedUser = () => {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function useAuth() {
  // Inisialisasi dari localStorage agar sesi tetap ada setelah refresh
  const [user, setUser]       = useState(getSavedUser)
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY))
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  // ── Login dengan email & password ──────────────────────────────
  const login = useCallback(async (email, password) => {
    setLoading(true)
    setError(null)
    try {
      const data = await loginApi({ email, password })
      saveSession(data.token, data.user)
      setToken(data.token)
      setUser(data.user)
      return data
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal, coba lagi'
      setError(msg)
      throw new Error(msg, { cause: err })
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Register ───────────────────────────────────────────────────
  const register = useCallback(async ({ fullName, company, email, password }) => {
    setLoading(true)
    setError(null)
    try {
      const data = await registerApi({ fullName, company, email, password })
      saveSession(data.token, data.user)
      setToken(data.token)
      setUser(data.user)
      return data
    } catch (err) {
      const msg = err.response?.data?.message || 'Registrasi gagal, coba lagi'
      setError(msg)
      throw new Error(msg, { cause: err })
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Login dengan Google ────────────────────────────────────────
  // Mengarahkan browser ke BE, tidak perlu state di sini
  const googleLogin = useCallback(() => {
    loginWithGoogle()
  }, [])

  // ── Change Password ────────────────────────────────────────────
  const changePassword = useCallback(async ({ oldPassword, newPassword, confirmPassword }) => {
    setLoading(true)
    setError(null)
    try {
      const data = await changePasswordApi({ oldPassword, newPassword, confirmPassword })
      return data
    } catch (err) {
      const msg = err.response?.data?.message || 'Gagal mengubah password'
      setError(msg)
      throw new Error(msg, { cause: err })
    } finally {
      setLoading(false)
    }
  }, [])

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(() => {
    clearSession()
    setToken(null)
    setUser(null)
  }, [])

  return {
    user,
    role: user?.role || 'guest', // Expose role langsung, default ke guest jika belum login
    token,
    loading,
    error,
    isLoggedIn: !!token,
    login,
    register,
    googleLogin,
    changePassword,
    logout,
    setError,
  }
}