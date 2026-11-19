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
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
            <span>About</span>
            <ChevronRight size={12} />
            <span>Video Profil</span>
            <ChevronRight size={12} />
            <span className="text-gray-900 font-semibold">{isEditing ? 'Edit Video' : 'Tambah Video'}</span>
          </div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight">
            {isEditing ? 'Edit Video Profil' : 'Tambah Video Profil Baru'}
          </h1>
        </div>

        <button
          type="button"
          onClick={onOpenList}
          className="inline-flex items-center gap-2 px-3.5 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition self-start sm:self-auto shadow-sm"
        >
          <List size={16} />
          Daftar Video
        </button>
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

      {/* ── Form & Preview Content ──────────────────────────────────── */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          {/* KOLOM KIRI: FORM INPUT */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden flex flex-col justify-between">
            <div className="p-6 sm:p-8 space-y-6">
              {loadingDetail ? (
                <div className="py-16 text-center text-gray-400">
                  <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  <p className="text-xs font-medium">Memuat detail data video...</p>
                </div>
              ) : (
                <>
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
                      required
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
                      required
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 font-mono placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
                    />
                    <p className="text-[11px] text-gray-400">
                      Format didukung: tautan YouTube standar (watch?v=...), tautan pendek (youtu.be/...), shorts, atau embed.
                    </p>
                  </div>

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
                </>
              )}
            </div>

            {/* Form Actions Footer */}
            <div className="px-6 md:px-8 py-4 bg-gray-50/80 border-t border-gray-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onOpenList}
                disabled={saving}
                className="px-5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition shadow-sm disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={saving || loadingDetail || !isAdmin}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#0284c7] text-white text-sm font-bold hover:bg-[#0369a1] transition shadow-md shadow-sky-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                {saving
                  ? 'Menyimpan...'
                  : isEditing
                  ? 'Simpan Perubahan'
                  : 'Tambah Video'}
              </button>
            </div>
          </div>

          {/* KOLOM KANAN: PRATINJAU KARTU VIDEO PROFIL */}
          <aside className="space-y-4">
            <section className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
              <div className="mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-sky-600 flex items-center gap-1.5">
                  <Video size={15} />
                  Pratinjau Video Profil
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  Tampilan kartu video yang muncul pada section Video Profil di halaman publik.
                </p>
              </div>

              {/* Area simulasi tampilan kartu video publik */}
              <div className="space-y-4">
                {/* Kartu Video seperti di TentangPage */}
                <div className="relative rounded-2xl overflow-hidden bg-[#0c4a6e] aspect-[16/10] w-full shadow-md group">
                  {detectedYouTubeId ? (
                    <img
                      key={previewThumbnailSrc}
                      src={previewThumbnailSrc}
                      alt={title || 'Pratinjau Video'}
                      className="absolute inset-0 h-full w-full object-cover"
                      onError={() => {
                        if (!useFallbackThumb) {
                          setUseFallbackThumb(true)
                        }
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-[#0c4a6e] flex flex-col items-center justify-center p-6 text-center text-white/60">
                      <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2 text-sky-400">
                        <Video size={24} />
                      </div>
                      <p className="text-xs font-medium text-white/80">Masukkan URL YouTube yang valid</p>
                      <p className="text-[10px] text-white/50 mt-1">Thumbnail akan otomatis tampil di sini</p>
                    </div>
                  )}

                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0c4a6e]/95 via-[#0c4a6e]/40 to-[#0c4a6e]/50 pointer-events-none" />

                  {/* Play Button Icon */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="relative grid place-items-center w-12 h-12 rounded-full bg-white/95 text-[#0c4a6e] shadow-lg transition-transform duration-300 group-hover:scale-110">
                      <Play size={18} className="fill-[#0c4a6e] ml-0.5" />
                    </span>
                  </div>

                  {/* Judul & Deskripsi Overlay di Bawah */}
                  <div className="absolute left-0 right-0 bottom-0 p-4 text-white">
                    <p className="font-bold text-sm leading-snug line-clamp-1">
                      {title.trim() ? title : 'Judul Video Profil'}
                    </p>
                    {description.trim() ? (
                      <p className="text-white/70 text-xs mt-1 line-clamp-2 leading-relaxed">
                        {description}
                      </p>
                    ) : (
                      <p className="text-white/50 text-[11px] mt-1 line-clamp-1 italic">
                        Deskripsi video akan tampil di sini jika diisi.
                      </p>
                    )}
                  </div>
                </div>

                {/* Detail Meta Pratinjau */}
                <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2 text-xs">
                  {/* Status Publikasi */}
                  <div className="flex items-center justify-between pb-2 border-b border-slate-200/60">
                    <span className="text-gray-500 font-medium">Status Publikasi</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full font-semibold text-[11px] ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-gray-100 text-gray-600 border border-gray-200'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-emerald-500' : 'bg-gray-400'
                        }`}
                      />
                      {isActive ? 'Aktif (Tampil)' : 'Nonaktif (Disembunyikan)'}
                    </span>
                  </div>

                  {/* Status URL YouTube */}
                  <div className="flex items-start justify-between gap-2 pt-0.5">
                    <span className="text-gray-500 font-medium shrink-0">Sumber Video</span>
                    {detectedYouTubeId ? (
                      <div className="text-right min-w-0">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 size={13} />
                          YouTube ID: <span className="font-mono">{detectedYouTubeId}</span>
                        </span>
                        <p className="text-[10px] text-gray-400 truncate max-w-[200px]" title={videoUrl}>
                          {videoUrl}
                        </p>
                      </div>
                    ) : (
                      <span className="text-[11px] text-amber-600 font-medium text-right">
                        {videoUrl.trim() ? 'URL belum dikenali sebagai YouTube' : 'Belum diisi'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </aside>
        </div>
      </form>
    </div>
  )
}
