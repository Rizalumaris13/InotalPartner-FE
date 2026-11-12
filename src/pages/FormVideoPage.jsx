import { useState, useEffect } from 'react'
import {
  Save,
  AlertCircle,
  ShieldAlert,
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
import { extractYouTubeId } from '../utils/youtube'

function toVideoDraft(data) {
  return {
    title: data?.title || '',
    description: data?.description || '',
    videoUrl: data?.video_url || '',
    isActive: data?.is_active !== false,
  }
}

function YouTubeThumbnail({ videoId, useFallbackThumb, onFallback }) {
  const previewThumbnailSrc = `https://img.youtube.com/vi/${videoId}/${useFallbackThumb ? 'hqdefault' : 'maxresdefault'}.jpg`

  return (
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
                onFallback()
              }
            }}
          />

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
  )
}

export default function FormVideoPage({
  editingVideo = null,
  onFinish,
  onOpenList,
}) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const isEditing = !!editingVideo

  const [source, setSource] = useState(editingVideo)
  const [draft, setDraft] = useState(() => toVideoDraft(editingVideo))
  const { title, description, videoUrl, isActive } = draft
  const [loadingDetail, setLoadingDetail] = useState(!!editingVideo?.id)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Prop identity matters: a refreshed record with the same ID is a new source.
  // Adjust before commit rather than remounting inputs or resetting in an effect.
  if (source !== editingVideo) {
    setSource(editingVideo)
    setDraft(toVideoDraft(editingVideo))
    setLoadingDetail(!!editingVideo?.id)
    setError('')
  }

  const updateDraft = (changes) => setDraft((previous) => ({ ...previous, ...changes }))

  useEffect(() => {
    if (!editingVideo?.id) return
    let cancelled = false

    const loadDetail = async () => {
      try {
        const freshData = await getAboutVideoByIdApi(editingVideo.id)
        if (!cancelled && freshData) setDraft(toVideoDraft(freshData))
      } catch (err) {
        // The seeded props remain usable when the optional refresh fails.
        console.warn('Gagal memuat detail terbaru video profil:', err)
      } finally {
        if (!cancelled) setLoadingDetail(false)
      }
    }

    loadDetail()
    return () => {
      cancelled = true
    }
  }, [editingVideo])

  const detectedYouTubeId = extractYouTubeId(videoUrl)
  const [thumbnail, setThumbnail] = useState(() => ({ videoId: detectedYouTubeId, fallback: false }))
  // Loading hides the preview even when its ID stays the same. Keep this state
  // outside that branch; reset on every ID transition, including A → B → A.
  if (thumbnail.videoId !== detectedYouTubeId) {
    setThumbnail({ videoId: detectedYouTubeId, fallback: false })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isAdmin) {
      setError('Hanya admin dan super_admin yang dapat menyimpan data video profil.')
      return
    }

    const trimmedTitle = title.trim()
    const trimmedVideoUrl = videoUrl.trim()
    const trimmedDesc = description.trim()

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            {/* <Video className="text-sky-600" size={24} /> */}
            {isEditing ? 'Edit Video Profil' : 'Tambah Video Profil Baru'}
          </h1>
        </div>

      </div>

      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
          <ShieldAlert size={18} className="shrink-0 text-amber-600" />
          <span>
            Hanya <strong>Admin</strong> atau <strong>Super Admin</strong> yang
            diizinkan untuk menambah atau mengedit video profil.
          </span>
        </div>
      )}

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

      <div className="bg-white border border-sky-100 rounded-2xl shadow-sm p-6 sm:p-8">
        {loadingDetail ? (
          <div className="py-16 text-center text-gray-400">
            <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-medium">Memuat detail data video...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
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
                onChange={(e) => updateDraft({ title: e.target.value })}
                maxLength={255}
                disabled={!isAdmin || saving}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                URL Video YouTube <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: https://www.youtube.com/watch?v=aqz-KE-bpKQ atau https://youtu.be/aqz-KE-bpKQ"
                value={videoUrl}
                onChange={(e) => updateDraft({ videoUrl: e.target.value })}
                disabled={!isAdmin || saving}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 font-mono placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
              />
              <p className="text-[11px] text-gray-400">
                Format didukung: tautan YouTube standar (watch?v=...), tautan pendek (youtu.be/...), shorts, atau embed.
              </p>
            </div>

            {detectedYouTubeId && (
              <YouTubeThumbnail
                videoId={detectedYouTubeId}
                useFallbackThumb={thumbnail.fallback}
                onFallback={() => setThumbnail({ videoId: detectedYouTubeId, fallback: true })}
              />
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-700">
                Deskripsi Video (Opsional)
              </label>
              <textarea
                rows={4}
                placeholder="Tuliskan ringkasan singkat atau poin-poin yang dibahas dalam video profil ini..."
                value={description}
                onChange={(e) => updateDraft({ description: e.target.value })}
                disabled={!isAdmin || saving}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors resize-y"
              />
            </div>

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
                  onChange={(e) => updateDraft({ isActive: e.target.checked })}
                  disabled={!isAdmin || saving}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500" />
              </label>
            </div>

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
