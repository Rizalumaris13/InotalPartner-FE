import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ShieldAlert,
  BarChart3,
  CheckCircle2,
  X,
  RefreshCw,
  Eye,
} from 'lucide-react'
import {
  getStatisticsApi,
  deleteStatisticApi,
  updateStatisticApi,
} from '../api/statistics'
import { DynamicStatisticIcon } from '../components/StatisticIconHelper'
import { useAuth } from '../hooks/useAuth'

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'inactive', label: 'Tidak Aktif' },
]

export default function ListStatisticPage({ onAddNew, onEdit }) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const [statistics, setStatistics] = useState([])
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

  // Modal pratinjau detail
  const [previewTarget, setPreviewTarget] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadStats = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getStatisticsApi()
        if (isMounted) {
          setStatistics(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Gagal mengambil daftar statistik beranda.'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadStats()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  // Toggle status aktif/nonaktif
  const handleToggleStatus = async (item) => {
    if (!isAdmin || updatingStatusId) return

    setUpdatingStatusId(item.id)
    setFeedbackMessage('')

    const nextStatus = !item.is_active

    try {
      await updateStatisticApi(item.id, {
        title: item.title,
        icon: item.icon,
        statistic_value: item.statistic_value,
        statistic_suffix: item.statistic_suffix,
        description: item.description,
        display_order: item.display_order,
        is_active: nextStatus,
      })

      setStatistics((prev) =>
        prev.map((s) => (s.id === item.id ? { ...s, is_active: nextStatus } : s))
      )
      setFeedbackMessage(
        `Status statistik "${item.title}" berhasil diubah menjadi ${nextStatus ? 'Aktif' : 'Nonaktif'}.`
      )
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal memperbarui status aktif statistik.'
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Konfirmasi hapus
  const handleDeleteConfirm = async () => {
    if (!deleteTarget || !isAdmin) return

    setDeleting(true)
    setError('')
    try {
      await deleteStatisticApi(deleteTarget.id)
      setStatistics((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      setFeedbackMessage(`Statistik "${deleteTarget.title}" berhasil dihapus.`)
      setDeleteTarget(null)
    } catch (err) {
      setError(
        err.response?.data?.message ||
          err.message ||
          'Gagal menghapus data statistik.'
      )
    } finally {
      setDeleting(false)
    }
  }

  // Filter list
  const filteredList = useMemo(() => {
    return statistics.filter((item) => {
      const matchSearch =
        search === '' ||
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.statistic_value?.toLowerCase().includes(search.toLowerCase()) ||
        item.description?.toLowerCase().includes(search.toLowerCase())

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.is_active) ||
        (statusFilter === 'inactive' && !item.is_active)

      return matchSearch && matchStatus
    })
  }, [statistics, search, statusFilter])

  return (
    <div className="flex flex-col h-full relative space-y-5 pb-10">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Statistik Beranda
          </h1>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50 transition shadow-sm"
            title="Muat ulang data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={onAddNew}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm shadow-sm hover:bg-sky-600 transition-colors"
            >
              <Plus size={18} />
              Tambah Statistik
            </button>
          )}
        </div>
      </div>

      {/* Role Notice */}
      {!isAdmin && (
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-amber-800 text-sm">
          <ShieldAlert size={18} className="shrink-0 mt-0.5 text-amber-600" />
          <div>
            <p className="font-semibold">Mode Baca (Read-Only)</p>
            <p className="text-xs text-amber-700 mt-0.5">
              Anda masuk dengan role <strong>{currentRole}</strong>. Anda hanya dapat melihat daftar statistik tanpa izin menambah, mengedit, atau menghapus.
            </p>
          </div>
        </div>
      )}

      {/* Feedback Success Message */}
      {feedbackMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-start justify-between gap-3 animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-600" />
            <span>{feedbackMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setFeedbackMessage('')}
            className="text-emerald-500 hover:text-emerald-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800 text-sm flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
            <div>
              <p className="font-semibold text-xs">Terjadi Kesalahan</p>
              <p className="text-xs text-red-700 mt-0.5">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setError('')}
            className="text-red-400 hover:text-red-700"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari label, angka, atau deskripsi..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-sky-400 focus:bg-white transition-all placeholder:text-gray-400"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-gray-50 border border-gray-200 rounded-xl self-stretch sm:self-auto overflow-x-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all whitespace-nowrap ${
                statusFilter === f.key
                  ? 'bg-white text-sky-600 shadow-sm'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabel Data Statistik */}
      <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/60 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                <th className="px-5 py-3.5 w-16 text-center">Urutan</th>
                <th className="px-4 py-3.5 w-16 text-center">Ikon</th>
                <th className="px-5 py-3.5 w-44">Nilai / Angka</th>
                <th className="px-5 py-3.5 w-52">Label / Judul</th>
                <th className="px-5 py-3.5 hidden md:table-cell">Keterangan</th>
                <th className="px-4 py-3.5 w-28 text-center">Status</th>
                <th className="px-5 py-3.5 w-28 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <RefreshCw size={24} className="animate-spin text-sky-500" />
                      <span>Memuat data statistik...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredList.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <BarChart3 size={32} className="text-gray-300" />
                      <span className="font-medium text-gray-600">
                        {search || statusFilter !== 'all'
                          ? 'Tidak ada statistik yang sesuai filter.'
                          : 'Belum ada data statistik.'}
                      </span>
                      {isAdmin && !search && statusFilter === 'all' && (
                        <button
                          type="button"
                          onClick={onAddNew}
                          className="mt-2 text-xs text-sky-600 font-bold hover:underline"
                        >
                          + Tambah Statistik Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredList.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition group"
                  >
                    <td className="px-5 py-3.5 text-center font-bold text-gray-400">
                      <span className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-gray-100 text-gray-700 text-xs font-semibold">
                        {item.display_order ?? 0}
                      </span>
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mx-auto border border-sky-100">
                        <DynamicStatisticIcon name={item.icon} size={18} />
                      </div>
                    </td>

                    <td className="px-5 py-3.5 font-extrabold text-sky-600 text-base tabular-nums">
                      <span>{item.statistic_value}</span>
                      {item.statistic_suffix && (
                        <span className="text-sky-400 text-sm ml-0.5">
                          {item.statistic_suffix}
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="font-bold text-gray-900 block tracking-wide">
                        {item.title}
                      </span>
                      <span className="text-[11px] text-gray-400 font-mono">
                        {item.icon}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 hidden md:table-cell text-gray-500 text-xs max-w-xs truncate">
                      {item.description || (
                        <span className="text-gray-300 italic">Tidak ada catatan</span>
                      )}
                    </td>

                    <td className="px-4 py-3.5 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={!isAdmin || updatingStatusId === item.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold transition ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } ${!isAdmin ? 'cursor-default' : 'cursor-pointer'}`}
                        title={isAdmin ? 'Klik untuk mengubah status' : 'Status publikasi'}
                      >
                        {updatingStatusId === item.id ? (
                          <RefreshCw size={12} className="animate-spin mr-1" />
                        ) : (
                          <span
                            className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                              item.is_active ? 'bg-emerald-500' : 'bg-gray-400'
                            }`}
                          />
                        )}
                        {item.is_active ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>

                    <td className="px-5 py-3.5 text-right whitespace-nowrap space-x-1">
                      <button
                        type="button"
                        onClick={() => setPreviewTarget(item)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition"
                        title="Pratinjau detail"
                      >
                        <Eye size={16} />
                      </button>

                      {isAdmin && (
                        <>
                          <button
                            type="button"
                            onClick={() => onEdit(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition"
                            title="Edit statistik"
                          >
                            <Edit size={16} />
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteTarget(item)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                            title="Hapus statistik"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer info data */}
        <div className="px-5 py-3 bg-gray-50/50 border-t border-gray-100 text-xs text-gray-500 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>
            Menampilkan <strong>{filteredList.length}</strong> dari total <strong>{statistics.length}</strong> statistik
          </span>
          <span className="text-[11px] text-gray-400">
            Halaman publik mengambil 4 statistik aktif teratas berdasarkan <strong>Urutan Tampilan (display_order)</strong>.
          </span>
        </div>
      </div>

      {/* Modal Preview Detail */}
      {previewTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-5">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                <BarChart3 size={18} className="text-sky-500" />
                Detail Statistik
              </h3>
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>

            {/* Kartu Pratinjau Tampilan Beranda */}
            <div className="p-6 rounded-2xl bg-slate-900 flex flex-col items-center justify-center text-center">
              <div className="bg-white rounded-2xl shadow-xl px-6 py-4 min-w-[140px] border border-white/20">
                <span className="text-sky-500 text-3xl font-extrabold leading-none flex items-baseline justify-center">
                  {previewTarget.statistic_value}
                  {previewTarget.statistic_suffix && (
                    <span className="text-sky-400 text-2xl font-bold ml-0.5">
                      {previewTarget.statistic_suffix}
                    </span>
                  )}
                </span>
                <span className="text-gray-600 text-xs font-semibold tracking-wide mt-2 text-center flex items-center justify-center gap-1.5">
                  <DynamicStatisticIcon name={previewTarget.icon} size={14} className="text-sky-500" />
                  {previewTarget.title}
                </span>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400 font-semibold">Ikon Lucide</span>
                <span className="font-mono text-gray-700">{previewTarget.icon}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400 font-semibold">Urutan Tampilan</span>
                <span className="font-bold text-gray-700">{previewTarget.display_order}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-400 font-semibold">Status</span>
                <span
                  className={`font-bold ${
                    previewTarget.is_active ? 'text-emerald-600' : 'text-gray-400'
                  }`}
                >
                  {previewTarget.is_active ? 'Aktif (Tampil di Landing Page)' : 'Nonaktif'}
                </span>
              </div>
              {previewTarget.description && (
                <div className="py-1">
                  <span className="text-gray-400 font-semibold block mb-1">Keterangan:</span>
                  <p className="text-gray-600 bg-gray-50 p-2.5 rounded-lg leading-relaxed">
                    {previewTarget.description}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewTarget(null)}
                className="px-5 py-2 rounded-xl bg-gray-100 text-gray-700 text-xs font-bold hover:bg-gray-200 transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-xl border border-gray-100 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 size={24} />
            </div>

            <div className="text-center">
              <h3 className="font-extrabold text-gray-900 text-base">Hapus Statistik?</h3>
              <p className="text-xs text-gray-500 mt-1">
                Apakah Anda yakin ingin menghapus data statistik{' '}
                <strong>"{deleteTarget.title}"</strong> ({deleteTarget.statistic_value}{deleteTarget.statistic_suffix})?
                Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-xs font-bold hover:bg-gray-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition shadow-md shadow-red-600/20 disabled:opacity-50"
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
