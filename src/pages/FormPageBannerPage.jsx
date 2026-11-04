import React, { useState, useEffect, useRef } from 'react'
import {
  Save,
  Trash2,
  Upload,
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  ImageIcon,
  X,
  RefreshCw,
} from 'lucide-react'
import {
  getPageBannerApi,
  createPageBannerApi,
  updatePageBannerApi,
  deletePageBannerApi,
} from '../api/pageBanner'
import { uploadImageApi, resolveImageUrl } from '../api/posts'
import { useAuth } from '../hooks/useAuth'

const PAGE_META = {
  about: {
    title: 'Banner Halaman Tentang',
    description: 'Kelola gambar hero, subtitle, judul, dan deskripsi pada halaman Tentang Kami.',
    defaultSubtitle: 'Siapa Kami — Sejak 2019',
    defaultTitle: 'Tentang Kami',
    defaultDesc: 'Membangun sinergi inovasi dan kemitraan strategis.',
  },
  event: {
    title: 'Banner Halaman Event',
    description: 'Kelola gambar hero, subtitle, judul, dan deskripsi pada halaman Event & Workshop.',
    defaultSubtitle: 'Agenda & Kegiatan Mendatang',
    defaultTitle: 'Event & Kolaborasi',
    defaultDesc: 'Temukan berbagai kegiatan, webinar, dan temu kemitraan industri.',
  },
  news: {
    title: 'Banner Halaman Berita',
    description: 'Kelola gambar hero, subtitle, judul, dan deskripsi pada halaman Berita & Wawasan.',
    defaultSubtitle: 'Informasi Terkini',
    defaultTitle: 'Berita & Publikasi',
    defaultDesc: 'Kabar terbaru seputar inovasi teknologi, kemitraan, dan rilisan pers.',
  },
  contact: {
    title: 'Banner Halaman Kontak',
    description: 'Kelola gambar hero, subtitle, judul, dan deskripsi pada halaman Kontak Kami.',
    defaultSubtitle: 'Terhubung Bersama Kami',
    defaultTitle: 'Hubungi Kami',
    defaultDesc: 'Konsultasikan kebutuhan kemitraan atau program inovasi organisasi Anda.',
  },
}

export default function FormPageBannerPage({ pageType = 'about' }) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const meta = PAGE_META[pageType] || {
    title: `Banner Halaman ${pageType}`,
    description: `Kelola hero banner untuk halaman ${pageType}.`,
  }

  // Form states
  const [existingId, setExistingId] = useState(null)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [description, setDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  // Upload photo states
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const fileInputRef = useRef(null)

  // Loading & notification states
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Load banner data saat pageType berubah
  useEffect(() => {
    let isMounted = true

    const loadData = async () => {
      setLoading(true)
      setError('')
      setSuccess('')
      setImageFile(null)
      setImagePreview('')

      try {
        const data = await getPageBannerApi(pageType)
        if (isMounted && data) {
          setExistingId(data.id)
          setTitle(data.title || '')
          setSubtitle(data.subtitle || '')
          setDescription(data.description || '')
          setImageUrl(data.image_url || '')
          setIsActive(data.is_active !== false)
        } else if (isMounted) {
          // Banner belum tersedia di backend
          setExistingId(null)
          setTitle(meta.defaultTitle || '')
          setSubtitle(meta.defaultSubtitle || '')
          setDescription(meta.defaultDesc || '')
          setImageUrl('')
          setIsActive(true)
        }
      } catch (err) {
        if (isMounted) {
          // Jika 404 (belum ada data), set status baru
          if (err.response?.status === 404) {
            setExistingId(null)
            setTitle(meta.defaultTitle || '')
            setSubtitle(meta.defaultSubtitle || '')
            setDescription(meta.defaultDesc || '')
            setImageUrl('')
            setIsActive(true)
          } else {
            console.warn(`Gagal memuat banner ${pageType}:`, err)
            setError(
              err.response?.data?.message ||
                err.message ||
                'Gagal memuat data banner.'
            )
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [pageType])

  // Handle File Change
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPG, PNG, WEBP).')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran gambar maksimal 5MB.')
      return
    }

    setError('')
    setImageFile(file)
    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  // Handle Remove Image
  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setImageUrl('')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // Handle Submit (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAdmin) {
      setError('Hanya Admin dan Super Admin yang diizinkan mengelola banner.')
      return
    }

    const trimmedTitle = title.trim()
    if (!trimmedTitle) {
      setError('Judul banner wajib diisi.')
      return
    }
    if (trimmedTitle.length > 255) {
      setError('Judul banner maksimal 255 karakter.')
      return
    }

    const trimmedSubtitle = subtitle.trim()
    if (trimmedSubtitle.length > 255) {
      setError('Subtitle banner maksimal 255 karakter.')
      return
    }

    setSaving(true)
    setError('')
    setSuccess('')

    try {
      // 1. Upload gambar jika user memilih file baru
      let finalImageUrl = imageUrl
      if (imageFile) {
        setUploading(true)
        try {
          const uploadResult = await uploadImageApi(imageFile)
          if (typeof uploadResult === 'string') {
            finalImageUrl = uploadResult
          } else if (uploadResult?.url) {
            finalImageUrl = uploadResult.url
          } else if (uploadResult?.data?.url) {
            finalImageUrl = uploadResult.data.url
          } else {
            finalImageUrl = String(uploadResult || '')
          }
        } catch (uploadErr) {
          throw new Error(
            uploadErr.response?.data?.message ||
              uploadErr.message ||
              'Gagal mengunggah gambar banner.'
          )
        } finally {
          setUploading(false)
        }
      }

      // 2. Kirim payload
      const payload = {
        title: trimmedTitle,
        subtitle: trimmedSubtitle,
        description: description.trim(),
        image_url: finalImageUrl || '',
        is_active: isActive,
      }

      let result = null
      if (existingId) {
        result = await updatePageBannerApi(pageType, payload)
        setSuccess('Hero banner berhasil diperbarui.')
      } else {
        result = await createPageBannerApi(pageType, payload)
        setSuccess('Hero banner berhasil dibuat.')
      }

      if (result?.id) {
        setExistingId(result.id)
        setImageUrl(result.image_url || '')
        setImageFile(null)
        setImagePreview('')
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan hero banner.'
      )
    } finally {
      setSaving(false)
      setUploading(false)
    }
  }

  // Handle Delete Banner
  const handleDelete = async () => {
    if (!isAdmin || !existingId) return

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      await deletePageBannerApi(pageType)
      setExistingId(null)
      setTitle(meta.defaultTitle || '')
      setSubtitle(meta.defaultSubtitle || '')
      setDescription(meta.defaultDesc || '')
      setImageUrl('')
      setImageFile(null)
      setImagePreview('')
      setIsActive(true)
      setShowDeleteModal(false)
      setSuccess('Hero banner berhasil dihapus. Halaman ini sekarang kembali ke status belum memiliki banner.')
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menghapus hero banner.'
      )
    } finally {
      setDeleting(false)
    }
  }

  const isProcessing = saving || uploading || deleting
  const displayImageSrc = imagePreview || (imageUrl ? resolveImageUrl(imageUrl) : '')

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* ── Breadcrumb & Header ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Banner Halaman</span>
            <ChevronRight size={12} />
            <span className="text-sky-600 font-bold">{meta.title}</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <ImageIcon className="text-sky-500" size={26} />
            {meta.title}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{meta.description}</p>
        </div>

        {existingId && isAdmin && (
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            disabled={isProcessing}
            className="self-start sm:self-auto px-4 py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={15} />
            <span>Hapus Banner</span>
          </button>
        )}
      </div>

      {/* ── Role Warning jika bukan Admin ──────────────────────────────── */}
      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Akses Dibatasi</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Anda hanya memiliki izin melihat. Role Anda saat ini tidak dapat menyimpan perubahan banner.
            </p>
          </div>
        </div>
      )}

      {/* ── Toast Notifikasi Error ─────────────────────────────────────── */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start justify-between gap-3 text-rose-700 animate-in fade-in">
          <div className="flex items-start gap-3">
            <AlertCircle className="shrink-0 mt-0.5 text-rose-500" size={19} />
            <p className="text-sm font-medium">{error}</p>
          </div>
          <button
            onClick={() => setError('')}
            className="p-1 hover:bg-rose-100 rounded-lg text-rose-400 hover:text-rose-600 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Toast Notifikasi Sukses ────────────────────────────────────── */}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start justify-between gap-3 text-emerald-800 animate-in fade-in">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="shrink-0 mt-0.5 text-emerald-600" size={19} />
            <p className="text-sm font-medium">{success}</p>
          </div>
          <button
            onClick={() => setSuccess('')}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-500 hover:text-emerald-700 transition cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ── Status Banner Badge ────────────────────────────────────────── */}
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500">Status Data:</span>
        {existingId ? (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
            Tersimpan di Database (Mode Edit)
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Belum Tersimpan (Mode Buat Baru)
          </span>
        )}
      </div>

      {/* ── Form Card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl p-6 sm:p-8">
        {loading ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Memuat data banner...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Gambar Hero Banner */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Gambar Hero Banner (Background)
              </label>

              <div className="flex flex-col sm:flex-row items-start gap-5">
                {/* Preview Box */}
                <div className="w-full sm:w-80 aspect-[16/9] rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden relative group shrink-0 flex items-center justify-center">
                  {displayImageSrc ? (
                    <>
                      <img
                        src={displayImageSrc}
                        alt="Hero Banner Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={!isAdmin || isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-white/90 hover:bg-white text-gray-800 text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <RefreshCw size={13} />
                          Ganti
                        </button>
                        <button
                          type="button"
                          onClick={handleRemoveImage}
                          disabled={!isAdmin || isProcessing}
                          className="px-3 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                        >
                          <Trash2 size={13} />
                          Hapus
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <ImageIcon className="mx-auto text-slate-400 mb-2" size={32} />
                      <p className="text-xs text-slate-500 font-medium">Belum ada gambar</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Rasio disarankan 16:9 atau lebar</p>
                    </div>
                  )}
                </div>

                {/* Upload Control */}
                <div className="flex-1 space-y-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    disabled={!isAdmin || isProcessing}
                    className="hidden"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={!isAdmin || isProcessing}
                      className="px-4 py-2.5 rounded-xl border border-sky-200 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold flex items-center gap-2 transition cursor-pointer disabled:opacity-50"
                    >
                      <Upload size={15} />
                      <span>{displayImageSrc ? 'Ganti File Gambar' : 'Pilih File Gambar'}</span>
                    </button>

                    {displayImageSrc && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        disabled={!isAdmin || isProcessing}
                        className="px-3 py-2.5 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-semibold transition cursor-pointer"
                      >
                        Reset Gambar
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-gray-500 leading-relaxed">
                    Unggah gambar latar berkualitas tinggi untuk banner bagian atas halaman. Format yang didukung: JPG, PNG, WEBP (Maksimal 5MB). Gambar akan otomatis di-upload saat Anda menekan tombol Simpan.
                  </p>
                </div>
              </div>
            </div>

            {/* Input Subtitle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Subtitle Banner
                </label>
                <span className="text-[11px] text-gray-400">{subtitle.length}/255 karakter</span>
              </div>
              <input
                type="text"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                maxLength={255}
                disabled={!isAdmin || isProcessing}
                placeholder="Contoh: Siapa Kami — Sejak 2019"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60"
              />
              <p className="text-[11px] text-gray-400">
                Tulisan kecil di atas judul utama (berfungsi sebagai label pengantar / kicker).
              </p>
            </div>

            {/* Input Title */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Judul Utama (Title) <span className="text-rose-500">*</span>
                </label>
                <span
                  className={`text-[11px] ${
                    title.length > 255 ? 'text-red-500 font-bold' : 'text-gray-400'
                  }`}
                >
                  {title.length}/255 karakter
                </span>
              </div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                required
                disabled={!isAdmin || isProcessing}
                placeholder="Contoh: Tentang Kami"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm font-semibold focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60"
              />
            </div>

            {/* Input Deskripsi */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                Deskripsi Singkat Banner
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin || isProcessing}
                placeholder="Tuliskan kalimat penjelas singkat di bawah judul banner..."
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50/50 text-gray-800 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition disabled:opacity-60 resize-y"
              />
            </div>

            {/* Status Aktif */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/70 rounded-2xl">
              <div>
                <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                  Status Banner
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Jika aktif, banner kustom ini akan ditampilkan pada bagian atas halaman publik terkait.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={!isAdmin || isProcessing}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" />
              </label>
            </div>

            {/* Tombol Simpan */}
            <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
              {isAdmin && (
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 transition disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>{uploading ? 'Mengunggah gambar...' : 'Menyimpan banner...'}</span>
                    </>
                  ) : (
                    <>
                      <Save size={16} />
                      <span>{existingId ? 'Perbarui Banner' : 'Simpan Banner'}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ── Modal Konfirmasi Hapus ─────────────────────────────────────── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">Hapus Hero Banner?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Banner halaman <strong className="text-gray-800">{meta.title}</strong> akan dihapus dari sistem. Halaman publik akan kembali menampilkan banner bawaan (default).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                className="px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 active:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-500/20 transition disabled:opacity-50 cursor-pointer"
              >
                {deleting ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

