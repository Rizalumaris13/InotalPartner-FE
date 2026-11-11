import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ShieldAlert,
  Video,
  CheckCircle2,
  ExternalLink,
  Eye,
  X,
  Play,
} from 'lucide-react'
import {
  getAboutVideosApi,
  deleteAboutVideoApi,
  updateAboutVideoApi,
  resolveImageUrl,
} from '../api/about'
import { useAuth } from '../hooks/useAuth'

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'inactive', label: 'Tidak Aktif' },
]

export default function ListVideoPage({ onAddNew, onEdit }) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const [videos, setVideos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Modal preview deskripsi / detail video
  const [previewItem, setPreviewItem] = useState(null)

  // Filter & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [updatingStatusId, setUpdatingStatusId] = useState(null)
  const [brokenThumbnails, setBrokenThumbnails] = useState({})

  const handleThumbnailError = (id) => {
    setBrokenThumbnails((prev) => (prev[id] ? prev : { ...prev, [id]: true }))
  }

  // Ekstrak YouTube ID untuk fallback thumbnail jika thumbnail_url kosong
  const getYouTubeThumbnail = (url) => {
    if (!url) return null
    try {
      const parsed = new URL(url)
      let videoId = ''
      if (parsed.hostname.includes('youtu.be')) {
        videoId = parsed.pathname.slice(1).split('/')[0]
      } else if (parsed.hostname.includes('youtube.com')) {
        if (parsed.pathname.startsWith('/watch')) {
          videoId = parsed.searchParams.get('v')
        } else if (parsed.pathname.startsWith('/embed/') || parsed.pathname.startsWith('/shorts/') || parsed.pathname.startsWith('/live/')) {
          videoId = parsed.pathname.split('/')[2]
        }
      }
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
      }
    } catch {
      // Abaikan jika parsing URL gagal
    }
    return null
  }

  useEffect(() => {
    let isMounted = true

    const loadVideos = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getAboutVideosApi()
        if (isMounted) {
          setVideos(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Gagal mengambil daftar video profil'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadVideos()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  // Filter list data berdasarkan search dan status
  const filteredVideos = useMemo(() => {
    return videos.filter((item) => {
      const matchSearch =
        search === '' ||
        (item.title &&
          item.title.toLowerCase().includes(search.toLowerCase())) ||
        (item.description &&
          item.description.toLowerCase().includes(search.toLowerCase())) ||
        (item.video_url &&
          item.video_url.toLowerCase().includes(search.toLowerCase()))

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.is_active) ||
        (statusFilter === 'inactive' && !item.is_active)

      return matchSearch && matchStatus
    })
  }, [videos, search, statusFilter])

  // Toggle status aktif / tidak aktif
  const handleToggleStatus = async (item) => {
    if (!isAdmin) {
      alert('Hanya admin dan super_admin yang dapat mengubah status video.')
      return
    }
    if (updatingStatusId) return

    const newStatus = !item.is_active
    setUpdatingStatusId(item.id)

    try {
      await updateAboutVideoApi(item.id, {
        title: item.title,
        description: item.description,
        video_url: item.video_url,
        thumbnail_url: item.thumbnail_url,
        is_active: newStatus,
      })

      setVideos((prev) =>
        prev.map((v) => (v.id === item.id ? { ...v, is_active: newStatus } : v))
      )

      setFeedbackMessage(
        `Status video "${item.title.slice(0, 30)}..." diubah menjadi ${
          newStatus ? 'Aktif' : 'Tidak Aktif'
        }.`
      )
      setTimeout(() => setFeedbackMessage(''), 3500)
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Gagal memperbarui status video'
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Handle Delete Action
  const handleDeleteClick = async (item) => {
    if (!isAdmin) {
      alert('Hanya admin dan super_admin yang dapat menghapus video profil.')
      return
    }

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus video profil:\n"${item.title}"?`
      )
    ) {
      return
    }

    try {
      await deleteAboutVideoApi(item.id)
      setFeedbackMessage(`Video profil "${item.title}" berhasil dihapus.`)
      setTimeout(() => setFeedbackMessage(''), 4000)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Gagal menghapus video profil'
      )
    }
  }

  const iconBtn =
    'p-1.5 text-gray-400 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center'

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Daftar Video Profil Perusahaan
          </h1>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} />
            Tambah Video Baru
          </button>
        )}
      </div>

      {/* ── Banner Proteksi Non-Admin ──────────────────────────────────── */}
      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
          <ShieldAlert size={18} className="shrink-0 text-amber-600" />
          <span>
            Anda masuk dengan hak akses terbatas (hanya baca). Pengelolaan video profil
            memerlukan hak akses <strong>Admin</strong> atau{' '}
            <strong>Super Admin</strong>.
          </span>
        </div>
      )}

      {/* ── Feedback Message ──────────────────────────────────────────── */}
      {feedbackMessage && (
        <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage('')}
            className="text-emerald-600 hover:text-emerald-800 p-1"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── Panel Tabel & Filter ───────────────────────────────────────── */}
      <div className="bg-white border border-sky-100 rounded-2xl overflow-hidden shadow-sm">
        {/* Toolbar: Search & Filter */}
        <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Status filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                onClick={() => setStatusFilter(f.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0 cursor-pointer ${
                  statusFilter === f.key
                    ? 'bg-sky-500 text-white shadow-xs'
                    : 'bg-slate-100 text-gray-600 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Search box */}
          <div className="relative w-full md:w-72">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Cari judul, deskripsi, atau URL video..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-sky-500 focus:bg-white transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            )}
          </div>
        </div>

        {/* Tabel Konten */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-16 text-center text-gray-400">
              <div className="w-8 h-8 border-2 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs font-medium">Memuat daftar video profil...</p>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 space-y-2">
              <AlertCircle size={28} className="mx-auto" />
              <p className="text-xs font-medium">{error}</p>
              <button
                type="button"
                onClick={() => setRefreshKey((k) => k + 1)}
                className="text-xs text-sky-600 hover:underline font-semibold cursor-pointer"
              >
                Coba lagi
              </button>
            </div>
          ) : filteredVideos.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <Video size={32} className="mx-auto text-gray-300" />
              <p className="text-xs font-medium text-gray-600">
                {search || statusFilter !== 'all'
                  ? 'Tidak ada video profil yang cocok dengan filter atau kata kunci.'
                  : 'Belum ada data video profil.'}
              </p>
              {isAdmin && !search && statusFilter === 'all' && (
                <button
                  type="button"
                  onClick={onAddNew}
                  className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:underline font-semibold cursor-pointer pt-2"
                >
                  <Plus size={14} />
                  Tambah Video Sekarang
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/75">
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-12 text-center">
                    No
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    Thumbnail
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Judul &amp; Deskripsi
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    URL Video
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                    Status
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-24">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredVideos.map((item, index) => {
                  const resolvedThumb =
                    item.thumbnail_url && !brokenThumbnails[item.id]
                      ? resolveImageUrl(item.thumbnail_url)
                      : getYouTubeThumbnail(item.video_url)

                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-sky-50/30 transition-colors group"
                    >
                      {/* Nomor */}
                      <td className="px-5 py-3.5 text-center text-xs text-gray-500 font-medium">
                        {index + 1}
                      </td>

                      {/* Thumbnail */}
                      <td className="px-5 py-3.5">
                        <div className="w-20 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0 relative group/thumb">
                          {resolvedThumb && !brokenThumbnails[item.id] ? (
                            <img
                              src={resolvedThumb}
                              alt={item.title}
                              className="w-full h-full object-cover"
                              onError={() => handleThumbnailError(item.id)}
                            />
                          ) : (
                            <Video size={18} className="text-slate-400" />
                          )}
                          <a
                            href={item.video_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white"
                            title="Buka video di tab baru"
                          >
                            <Play size={14} className="fill-white" />
                          </a>
                        </div>
                      </td>

                      {/* Judul & Deskripsi */}
                      <td className="px-5 py-3.5 max-w-xs">
                        <p className="text-sm font-semibold text-gray-900 line-clamp-1">
                          {item.title}
                        </p>
                        {item.description ? (
                          <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                            {item.description}
                          </p>
                        ) : (
                          <p className="text-xs text-gray-400 italic mt-0.5">
                            Tidak ada deskripsi
                          </p>
                        )}
                        {item.description && item.description.length > 80 && (
                          <button
                            type="button"
                            onClick={() => setPreviewItem(item)}
                            className="text-[11px] text-sky-600 hover:underline font-medium mt-1 inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Eye size={12} />
                            Lihat selengkapnya
                          </button>
                        )}
                      </td>

                      {/* URL Video */}
                      <td className="px-5 py-3.5 max-w-[220px]">
                        <a
                          href={item.video_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 hover:underline truncate max-w-full font-mono"
                          title={item.video_url}
                        >
                          <span className="truncate">{item.video_url}</span>
                          <ExternalLink size={12} className="shrink-0" />
                        </a>
                      </td>

                      {/* Status Toggle */}
                      <td className="px-5 py-3.5">
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(item)}
                          disabled={updatingStatusId === item.id || !isAdmin}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors ${
                            isAdmin
                              ? 'cursor-pointer'
                              : 'cursor-not-allowed opacity-80'
                          } ${
                            item.is_active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          } ${updatingStatusId === item.id ? 'opacity-50 cursor-wait' : ''}`}
                          title={
                            isAdmin
                              ? 'Klik untuk mengubah status'
                              : 'Hanya admin yang dapat mengubah status'
                          }
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              item.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                          {item.is_active ? 'Aktif' : 'Tidak Aktif'}
                        </button>
                      </td>

                      {/* Aksi */}
                      <td className="px-5 py-3.5 text-right space-x-1 whitespace-nowrap">
                        {isAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onEdit?.(item)}
                              className={`${iconBtn} hover:text-sky-600 hover:bg-sky-50`}
                              title="Edit video profil"
                            >
                              <Edit size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteClick(item)}
                              className={`${iconBtn} hover:text-red-600 hover:bg-red-50`}
                              title="Hapus video profil"
                            >
                              <Trash2 size={16} />
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        {!loading && !error && filteredVideos.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>Menampilkan {filteredVideos.length} video</span>
            <span>Total: {videos.length} video</span>
          </div>
        )}
      </div>

      {/* ── Modal Preview Detail Video ──────────────────────────────────── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Video size={18} className="text-sky-600" />
                <h3 className="text-sm font-bold text-gray-900">Detail Video Profil</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-lg"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Judul Video
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {previewItem.title}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  URL Video YouTube
                </p>
                <a
                  href={previewItem.video_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-flex items-center gap-1.5 text-xs text-sky-600 hover:underline break-all"
                >
                  <span>{previewItem.video_url}</span>
                  <ExternalLink size={12} className="shrink-0" />
                </a>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Deskripsi
                </p>
                <div className="mt-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                  {previewItem.description || 'Tidak ada deskripsi.'}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>
                  Status:{' '}
                  <strong
                    className={
                      previewItem.is_active
                        ? 'text-emerald-600'
                        : 'text-gray-600'
                    }
                  >
                    {previewItem.is_active ? 'Aktif' : 'Tidak Aktif'}
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-gray-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

