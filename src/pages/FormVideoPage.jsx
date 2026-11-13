import React, { useState, useEffect } from 'react'
import {
  Save,
  List,
  AlertCircle,
  ShieldAlert,
  ChevronRight,
  Video,
  X,
  Play,
  CheckCircle2,
} from 'lucide-react'
import {
  createAboutVideoApi,
  getAboutVideoByIdApi,
  updateAboutVideoApi,
} from '../api/about'
import { useAuth } from '../hooks/useAuth'

export default function FormVideoPage({
  editingVideo = null,
  onFinish,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    ''
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const isEditing = !!editingVideo

  // Form states
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [isActive, setIsActive] = useState(true)

  const [loadingDetail, setLoadingDetail] = useState(isEditing)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Fallback YouTube thumbnail state
  const [useFallbackThumb, setUseFallbackThumb] = useState(false)

  // Inisialisasi data form saat mode tambah atau edit
  useEffect(() => {
    let isMounted = true

    if (!isEditing) {
      setTitle('')
      setDescription('')
      setVideoUrl('')
      setIsActive(true)
      setError('')
      setLoadingDetail(false)
      return
    }

    const loadDetail = async () => {
      setLoadingDetail(true)
      setError('')

      // Isi dari props jika sudah ada
      if (editingVideo) {
        setTitle(editingVideo.title || '')
        setDescription(editingVideo.description || '')
        setVideoUrl(editingVideo.video_url || '')
        setIsActive(editingVideo.is_active !== false)
      }

      // Ambil data fresh dari API jika ada ID
      if (editingVideo?.id) {
        try {
          const freshData = await getAboutVideoByIdApi(editingVideo.id)
          if (isMounted && freshData) {
            setTitle(freshData.title || '')
            setDescription(freshData.description || '')
            setVideoUrl(freshData.video_url || '')
            setIsActive(freshData.is_active !== false)
          }
        } catch (err) {
          console.warn('Gagal memuat detail terbaru video profil:', err)
        }
      }

      if (isMounted) {
        setLoadingDetail(false)
      }
    }

    loadDetail()

    return () => {
      isMounted = false
    }
  }, [editingVideo, isEditing])

  // Ekstrak YouTube ID untuk thumbnail preview otomatis
  const getYouTubeId = (url) => {
    if (!url) return null
    try {
      const parsed = new URL(url.trim())
      if (parsed.hostname.includes('youtu.be')) {
        return parsed.pathname.slice(1).split('/')[0]
      }
      if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/watch')) {
          return parsed.searchParams.get('v')
        }
        if (
          parsed.pathname.startsWith('/embed/') ||
          parsed.pathname.startsWith('/shorts/') ||
          parsed.pathname.startsWith('/live/')
        ) {
          return parsed.pathname.split('/')[2]
        }
      }
    } catch {
      // Abaikan jika string URL belum valid
    }
    return null
  }

  const detectedYouTubeId = getYouTubeId(videoUrl)

  // Reset status fallback saat ID YouTube berubah
  useEffect(() => {
    setUseFallbackThumb(false)
  }, [detectedYouTubeId])

  const previewThumbnailSrc = detectedYouTubeId
    ? useFallbackThumb
      ? `https://img.youtube.com/vi/${detectedYouTubeId}/hqdefault.jpg`
      : `https://img.youtube.com/vi/${detectedYouTubeId}/maxresdefault.jpg`
    : ''

  // Handle Submit Form
  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAdmin) {
      setError('Hanya admin dan super_admin yang dapat menyimpan data video profil.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedVideoUrl = videoUrl.trim()
    const trimmedDesc = description.trim()

    // Validasi frontend
    if (!trimmedTitle) {
      setError('Judul video wajib diisi.')
      return
    }
    if (trimmedTitle.length > 255) {
      setError('Judul video tidak boleh melebihi 255 karakter.')
      return
    }
    if (!trimmedVideoUrl) {
      setError('URL video YouTube wajib diisi.')
      return
    }

    setSaving(true)
    setError('')

    const payload = {
      title: trimmedTitle,
      description: trimmedDesc,
      video_url: trimmedVideoUrl,
      thumbnail_url: '',
      is_active: isActive,
    }

    try {
      if (isEditing) {
        await updateAboutVideoApi(editingVideo.id, payload)
      } else {
        await createAboutVideoApi(payload)
      }

      if (onFinish) {
        onFinish()
      } else if (onOpenList) {
        onOpenList()
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menyimpan data video profil'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6 w-full max-w-none">
      {/* ── Breadcrumb & Action bar ────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {/* <Video className="text-sky-600" size={24} /> */}
            {isEditing ? 'Edit Video Profil' : 'Tambah Video Profil Baru'}
          </h1>
        </div>

        
      </div>

      {/* ── Banner Proteksi Non-Admin ──────────────────────────────────── */}
      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
          <ShieldAlert size={18} className="shrink-0 text-amber-600" />
          <span>
            Hanya <strong>Admin</strong> atau <strong>Super Admin</strong> yang
            diizinkan untuk menambah atau mengedit video profil.
          </span>
        </div>
      )}

      {/* ── Notifikasi Error ───────────────────────────────────────────── */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-500 hover:text-red-700 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Form Card ─────────────────────────────────────────────────── */}
      <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-6 sm:p-8">
        {loadingDetail ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Memuat detail data video...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Input Judul Video */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-gray-700">
                  Judul Video <span className="text-red-500">*</span>
                </label>
                <span
                  className={`text-[11px] ${
                    title.length > 255
                      ? 'text-red-500 font-bold'
                      : 'text-gray-400'
                  }`}
                >
                  {title.length}/255 karakter
                </span>
              </div>
              <input
                type="text"
                placeholder="Contoh: Profil INOTAL Partner — Menghubungkan Kolaborasi & Talenta"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={255}
                disabled={!isAdmin || saving}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>

            {/* Input URL Video YouTube */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                URL Video YouTube <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: https://www.youtube.com/watch?v=aqz-KE-bpKQ atau https://youtu.be/aqz-KE-bpKQ"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                disabled={!isAdmin || saving}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 font-mono placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-gray-400">
                Format didukung: tautan YouTube standar (watch?v=...), tautan pendek (youtu.be/...), shorts, atau embed.
              </p>
            </div>

            {/* Preview Thumbnail Otomatis YouTube */}
            {detectedYouTubeId && (
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider flex items-center gap-1.5">
                    <Video size={14} className="text-sky-500" />
                    Preview Thumbnail Otomatis YouTube
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium">
                    {useFallbackThumb ? 'Kualitas HQ (Fallback)' : 'Kualitas Maksimal (HD)'}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <div className="w-56 aspect-video rounded-xl overflow-hidden bg-slate-200 border border-slate-300 relative group shrink-0 shadow-xs">
                    <img
                      key={previewThumbnailSrc}
                      src={previewThumbnailSrc}
                      alt="Preview Thumbnail YouTube"
                      className="w-full h-full object-cover"
                      onError={() => {
                        if (!useFallbackThumb) {
                          setUseFallbackThumb(true)
                        }
                      }}
                    />

                    {/* Play Button Overlay */}
                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center transition-all group-hover:bg-black/30">
                      <div className="w-10 h-10 rounded-full bg-white/90 backdrop-blur-xs flex items-center justify-center shadow-md">
                        <Play size={18} className="fill-sky-600 text-sky-600 ml-0.5" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5 flex-1 min-w-0 pt-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600">
                      <CheckCircle2 size={15} />
                      <span>Thumbnail otomatis terdeteksi dari YouTube</span>
                    </div>

                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Thumbnail akan dimuat secara otomatis dari video YouTube dengan resolusi terbaik ({useFallbackThumb ? 'hqdefault' : 'maxresdefault'}).
                    </p>

                    <p className="text-[11px] text-gray-400 break-all font-mono">
                      {previewThumbnailSrc}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Input Deskripsi Video */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Deskripsi Video (Opsional)
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan ringkasan singkat atau poin-poin yang dibahas dalam video profil ini..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!isAdmin || saving}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors resize-y"
              />
            </div>

            {/* Status Aktif */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border border-slate-200/70 rounded-xl">
              <div>
                <p className="text-xs font-semibold text-gray-800">
                  Status Publikasi Video
                </p>
                <p className="text-[11px] text-gray-500 mt-0.5">
                  Jika aktif, video ini akan ditampilkan pada section Video Profil di halaman publik.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  disabled={!isAdmin || saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" />
              </label>
            </div>

            {/* Tombol Aksi */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <button
                type="button"
                onClick={onOpenList}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 border border-slate-200 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              {isAdmin && (
                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <Save size={15} />
                  {saving
                    ? 'Menyimpan...'
                    : isEditing
                    ? 'Simpan Perubahan'
                    : 'Tambah Video'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
