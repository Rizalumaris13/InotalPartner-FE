import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ShieldAlert,
  Megaphone,
  CheckCircle2,
  XCircle,
  ExternalLink,
} from 'lucide-react'
import {
  getJoinInvitationsApi,
  deleteJoinInvitationApi,
  updateJoinInvitationApi,
} from '../api/joinInvitation'
import { useAuth } from '../hooks/useAuth'

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'inactive', label: 'Tidak Aktif' },
]

export default function ListJoinInvitationPage({ onAddNew, onEdit }) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const [ctas, setCtas] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Filter & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadCTAs = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getJoinInvitationsApi()
        if (isMounted) {
          setCtas(data || [])
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
            err.message ||
            'Gagal mengambil daftar Ajakan Bergabung'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadCTAs()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  // Filter list
  const filteredCTAs = useMemo(() => {
    return ctas.filter((item) => {
      const matchSearch =
        item.title?.toLowerCase().includes(search.toLowerCase()) ||
        item.section_label?.toLowerCase().includes(search.toLowerCase()) ||
        item.button_text?.toLowerCase().includes(search.toLowerCase()) ||
        item.button_url?.toLowerCase().includes(search.toLowerCase())

      if (!matchSearch) return false

      if (statusFilter === 'active') return item.is_active === true
      if (statusFilter === 'inactive') return item.is_active === false
      return true
    })
  }, [ctas, search, statusFilter])

  // Hapus Ajakan Bergabung
  const handleDelete = async (id, title) => {
    if (!isAdmin) return

    const confirmed = window.confirm(
      `Apakah Anda yakin ingin menghapus Ajakan Bergabung "${title || 'ini'}"?`
    )
    if (!confirmed) return

    try {
      await deleteJoinInvitationApi(id)
      setFeedbackMessage('Ajakan Bergabung berhasil dihapus.')
      setRefreshKey((prev) => prev + 1)
      setTimeout(() => setFeedbackMessage(''), 3000)
    } catch (err) {
      alert(
        err.response?.data?.message || err.message || 'Gagal menghapus Ajakan Bergabung'
      )
    }
  }

  // Toggle status aktif
  const handleToggleStatus = async (item) => {
    if (!isAdmin || updatingStatusId) return

    const newStatus = !item.is_active
    setUpdatingStatusId(item.id)
    try {
      await updateJoinInvitationApi(item.id, {
        section_label: item.section_label,
        title: item.title,
        button_text: item.button_text,
        button_url: item.button_url,
        is_active: newStatus,
      })
      setFeedbackMessage(
        newStatus
          ? 'Ajakan Bergabung berhasil diaktifkan. Data lainnya otomatis dinonaktifkan.'
          : 'Ajakan Bergabung berhasil dinonaktifkan.'
      )
      setRefreshKey((prev) => prev + 1)
      setTimeout(() => setFeedbackMessage(''), 3000)
    } catch (err) {
      alert(
        err.response?.data?.message ||
        err.message ||
        'Gagal mengubah status aktif Ajakan Bergabung'
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* ── Header Halaman ────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
            Daftar Ajakan Bergabung
          </h1>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg text-sm font-semibold hover:bg-sky-700 transition shadow-sm self-start sm:self-auto"
          >
            <Plus size={16} />
            Tambah Ajakan Bergabung
          </button>
        )}
      </div>

      {/* ── Banner Proteksi Non-Admin ──────────────────────────────────── */}
      {!isAdmin && (
        <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/70 text-amber-800 text-sm flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 flex-shrink-0 text-amber-600 mt-0.5" />
          <div>
            <p className="font-semibold">Mode Baca Saja</p>
            <p className="text-xs mt-0.5 text-amber-700">
              Role Anda ({currentRole}) hanya dapat melihat daftar Ajakan Bergabung. Hak cipta
              tambah, edit, dan hapus hanya dimiliki oleh Admin & Super Admin.
            </p>
          </div>
        </div>
      )}

      {/* ── Feedback Message ───────────────────────────────────────────── */}
      {feedbackMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg text-xs flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ── Search & Filter Bar ────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            placeholder="Cari label, judul, atau tombol..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
          />
        </div>

        {/* Filter Status */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap mr-1">
            Status:
          </span>
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${statusFilter === f.key
                ? 'bg-sky-600 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Data List Table / Cards ────────────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 text-sm flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
            <span>Memuat data Ajakan Bergabung...</span>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600 text-sm flex flex-col items-center gap-2">
            <AlertCircle size={24} />
            <span>{error}</span>
            <button
              type="button"
              onClick={() => setRefreshKey((prev) => prev + 1)}
              className="mt-2 text-xs text-sky-600 underline font-semibold"
            >
              Coba lagi
            </button>
          </div>
        ) : filteredCTAs.length === 0 ? (
          <div className="p-12 text-center text-gray-400 text-sm flex flex-col items-center gap-2">
            <Megaphone size={32} className="text-gray-300" />
            <span>Tidak ada data Ajakan Bergabung yang ditemukan.</span>
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="text-xs text-sky-600 underline font-semibold mt-1"
              >
                Reset pencarian
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-gray-600 text-xs font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4 w-12 text-center">No</th>
                  <th className="py-3.5 px-4">Konten Ajakan Bergabung</th>
                  <th className="py-3.5 px-4">Tombol & Tautan</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  {isAdmin && (
                    <th className="py-3.5 px-4 text-center w-28">Aksi</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-700">
                {filteredCTAs.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-gray-50/60 transition group"
                  >
                    <td className="py-4 px-4 text-center text-xs text-gray-400 font-mono">
                      {index + 1}
                    </td>

                    {/* Konten Label & Title */}
                    <td className="py-4 px-4 max-w-md">
                      <div className="flex flex-col gap-1">
                        <span className="inline-block text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full w-fit">
                          {item.section_label || 'Ajakan Bergabung'}
                        </span>
                        <h4 className="font-semibold text-gray-900 text-sm leading-snug line-clamp-2">
                          {item.title}
                        </h4>
                      </div>
                    </td>

                    {/* Tombol & URL */}
                    <td className="py-4 px-4 max-w-xs">
                      <div className="space-y-1">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-gray-100 text-gray-800 text-xs font-medium">
                          <span>{item.button_text}</span>
                        </div>
                        <div className="flex items-center gap-1 text-[11px] text-gray-500 font-mono truncate">
                          <span className="truncate">{item.button_url}</span>
                          <a
                            href={item.button_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-gray-400 hover:text-sky-600"
                            title="Buka tautan"
                          >
                            <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>
                    </td>

                    {/* Status Toggle */}
                    <td className="py-4 px-4 text-center">
                      <button
                        type="button"
                        disabled={!isAdmin || updatingStatusId === item.id}
                        onClick={() => handleToggleStatus(item)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition ${item.is_active
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                          : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                          } ${!isAdmin ? 'cursor-default' : 'cursor-pointer'} ${updatingStatusId === item.id ? 'opacity-50' : ''
                          }`}
                        title={
                          isAdmin
                            ? 'Klik untuk mengubah status aktif'
                            : undefined
                        }
                      >
                        {item.is_active ? (
                          <>
                            <CheckCircle2 size={12} className="text-emerald-600" />
                            <span>Aktif</span>
                          </>
                        ) : (
                          <>
                            <XCircle size={12} className="text-gray-400" />
                            <span>Nonaktif</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Aksi */}
                    {isAdmin && (
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onEdit && onEdit(item)}
                            className="p-1.5 text-gray-500 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition"
                            title="Edit Ajakan Bergabung"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id, item.title)}
                            className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Ajakan Bergabung"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
