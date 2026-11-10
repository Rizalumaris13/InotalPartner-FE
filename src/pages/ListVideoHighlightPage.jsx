import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react'
import {
  getAboutVideoHighlightsApi,
  deleteAboutVideoHighlightApi,
  updateAboutVideoHighlightApi,
} from '../api/about'
import { DynamicHighlightIcon } from '../components/HighlightIcon'
import { useAuth } from '../hooks/useAuth'

import { STATUS_FILTERS } from '../data/statusFilters'

export default function ListVideoHighlightPage({ onAddNew, onEdit }) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const [highlights, setHighlights] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Filter & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  // Modal konfirmasi hapus
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    let isMounted = true

    const loadHighlights = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getAboutVideoHighlightsApi()
        if (isMounted) {
          setHighlights(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Gagal mengambil daftar poin video profil.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadHighlights()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  // Filter highlights berdasarkan pencarian & status
  const filteredHighlights = useMemo(() => {
    const hasSearch = Boolean(search.trim())
    const query = search.toLowerCase()
    return highlights.filter((item) => {
      // Filter status
      if (statusFilter === 'active' && !item.is_active) return false
      if (statusFilter === 'inactive' && item.is_active) return false

      // Search
      if (hasSearch) {
        const titleMatch = (item.title || '').toLowerCase().includes(query)
        const descMatch = (item.description || '').toLowerCase().includes(query)
        const iconMatch = (item.icon || '').toLowerCase().includes(query)
        return titleMatch || descMatch || iconMatch
      }

      return true
    })
  }, [highlights, statusFilter, search])

  // Toggle status aktif langsung dari tabel
  const handleToggleStatus = async (item) => {
    if (!isAdmin || updatingStatusId) return

    setUpdatingStatusId(item.id)
    const newStatus = !item.is_active

    try {
      await updateAboutVideoHighlightApi(item.id, {
        icon: item.icon,
        title: item.title,
        description: item.description,
        display_order: item.display_order,
        is_active: newStatus,
      })

      setHighlights((prev) =>
        prev.map((h) => (h.id === item.id ? { ...h, is_active: newStatus } : h))
      )
      setFeedbackMessage(
        `Status poin video "${item.title}" berhasil diubah menjadi ${
          newStatus ? 'Aktif' : 'Nonaktif'
        }.`
      )
      setTimeout(() => setFeedbackMessage(''), 3000)
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Gagal memperbarui status poin video.'
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Handle delete highlight
  const confirmDelete = async () => {
    if (!deleteTarget || !isAdmin) return

    setDeleting(true)
    try {
      await deleteAboutVideoHighlightApi(deleteTarget.id)
      setHighlights((prev) => prev.filter((h) => h.id !== deleteTarget.id))
      setFeedbackMessage(`Poin video "${deleteTarget.title}" berhasil dihapus.`)
      setDeleteTarget(null)
      setTimeout(() => setFeedbackMessage(''), 3000)
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Gagal menghapus poin video.'
      )
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="w-full max-w-none space-y-6">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>About</span>
            <span>/</span>
            <span>Video Profil</span>
            <span>/</span>
            <span className="text-sky-600">Poin Video Profil</span>
          </div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight flex items-center gap-2">
            <Sparkles className="text-sky-500" size={26} />
            Daftar Poin Video Profil
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola poin-poin keunggulan perusahaan yang ditampilkan di samping video profil.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddNew}
            className="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 active:bg-sky-700 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-2 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Tambah Poin Video Baru</span>
          </button>
        )}
      </div>

      {/* Role Warning jika bukan Admin */}
      {!isAdmin && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3">
          <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={20} />
          <div>
            <h4 className="text-sm font-bold text-amber-900">Akses Terbatas</h4>
            <p className="text-xs text-amber-700 mt-0.5">
              Anda hanya memiliki izin melihat. Role Anda saat ini tidak diizinkan menambah, mengedit, atau menghapus poin video.
            </p>
          </div>
        </div>
      )}

      {/* Toast Feedback */}
      {feedbackMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-emerald-800 text-sm font-medium animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            onClick={() => setFeedbackMessage('')}
            className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-500 hover:text-emerald-700 transition"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-700 text-sm font-medium">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} className="text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            className="text-xs font-bold underline hover:text-rose-900"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari judul, deskripsi, atau ikon..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-gray-200 bg-gray-50/50 text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 transition"
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-1.5 self-start md:self-auto overflow-x-auto w-full md:w-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                statusFilter === f.key
                  ? 'bg-sky-50 text-sky-600 border border-sky-200'
                  : 'text-gray-500 hover:bg-gray-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-100 shadow-sm rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <div className="w-8 h-8 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm font-medium text-gray-500">Memuat daftar poin video...</p>
          </div>
        ) : filteredHighlights.length === 0 ? (
          <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-3xl bg-sky-50 flex items-center justify-center text-sky-500 mb-4">
              <Sparkles size={32} />
            </div>
            <h3 className="text-base font-bold text-gray-800">
              {search || statusFilter !== 'all'
                ? 'Tidak ada poin video yang sesuai dengan filter'
                : 'Belum ada poin video profil'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              {search || statusFilter !== 'all'
                ? 'Coba ganti kata kunci pencarian atau bersihkan filter status.'
                : 'Tambahkan poin-poin keunggulan yang merepresentasikan budaya atau nilai perusahaan Anda.'}
            </p>
            {isAdmin && !search && statusFilter === 'all' && (
              <button
                type="button"
                onClick={onAddNew}
                className="mt-4 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-xs font-bold shadow-md shadow-sky-500/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Plus size={15} />
                <span>Tambah Poin Video Pertama</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="py-4 px-6 w-20 text-center">Urutan</th>
                  <th className="py-4 px-6 w-24">Ikon</th>
                  <th className="py-4 px-6 min-w-[200px]">Judul & Deskripsi</th>
                  <th className="py-4 px-6 w-32 text-center">Status</th>
                  <th className="py-4 px-6 w-32 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredHighlights.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/60 transition group"
                  >
                    {/* Urutan */}
                    <td className="py-4 px-6 text-center">
                      <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-gray-100 text-gray-600 text-xs font-extrabold">
                        {item.display_order ?? 0}
                      </span>
                    </td>

                    {/* Ikon */}
                    <td className="py-4 px-6">
                      <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center shadow-xs">
                        <DynamicHighlightIcon name={item.icon} size={20} />
                      </div>
                    </td>

                    {/* Judul & Deskripsi */}
                    <td className="py-4 px-6">
                      <div className="space-y-1">
                        <div className="font-bold text-gray-900 group-hover:text-sky-600 transition flex items-center gap-2">
                          <span>{item.title}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 font-mono">
                            {item.icon || 'Sparkles'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-6 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={!isAdmin || updatingStatusId === item.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer disabled:opacity-50 ${
                          item.is_active
                            ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                            : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                          }`}
                        />
                        <span>{item.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </button>
                    </td>

                    {/* Aksi */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          title="Edit Poin Video"
                          className="p-2 rounded-xl text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition cursor-pointer"
                        >
                          <Edit size={16} />
                        </button>
                        {isAdmin && (
                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            title="Hapus Poin Video"
                            className="p-2 rounded-xl text-gray-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center">
              <Trash2 size={24} />
            </div>

            <div>
              <h3 className="text-base font-bold text-gray-900">Hapus Poin Video?</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Poin video <strong className="text-gray-800">"{deleteTarget.title}"</strong> akan dihapus permanen dari sistem. Aksi ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold transition disabled:opacity-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={confirmDelete}
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
