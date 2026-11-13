import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ShieldAlert,
  User,
  CheckCircle2,
  X,
} from 'lucide-react'
import {
  getTeamMembersApi,
  deleteTeamMemberApi,
  updateTeamMemberApi,
  resolveImageUrl,
} from '../api/about'
import { useAuth } from '../hooks/useAuth'

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'inactive', label: 'Tidak Aktif' },
]

export default function ListAboutPage({ onAddNew, onEdit }) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    ''
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [brokenImages, setBrokenImages] = useState({})

  // Filter & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  const handleImageError = (id) => {
    setBrokenImages((prev) => (prev[id] ? prev : { ...prev, [id]: true }))
  }

  useEffect(() => {
    let isMounted = true

    const loadMembers = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getTeamMembersApi()
        if (isMounted) {
          setMembers(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Gagal mengambil daftar anggota tim'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadMembers()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  // Filter pencarian dan status
  const filteredMembers = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    return members.filter((m) => {
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && m.is_active) ||
        (statusFilter === 'inactive' && !m.is_active)

      const matchSearch =
        !keyword ||
        m.name?.toLowerCase().includes(keyword) ||
        m.position?.toLowerCase().includes(keyword)

      return matchStatus && matchSearch
    })
  }, [members, statusFilter, search])

  // Toggle status aktif/nonaktif
  const handleToggleStatus = async (item) => {
    if (updatingStatusId) return

    const newStatus = !item.is_active
    setUpdatingStatusId(item.id)

    try {
      await updateTeamMemberApi(item.id, {
        name: item.name,
        position: item.position,
        photo_url: item.photo_url,
        display_order: item.display_order,
        is_active: newStatus,
      })

      setMembers((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, is_active: newStatus } : m))
      )

      setFeedbackMessage(
        `Status anggota "${item.name}" diubah menjadi ${
          newStatus ? 'Aktif' : 'Tidak Aktif'
        }.`
      )
      setTimeout(() => setFeedbackMessage(''), 3500)
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Gagal memperbarui status anggota tim'
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Handle Delete Action
  const handleDeleteClick = async (item) => {
    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus anggota tim "${item.name}"?`
      )
    ) {
      return
    }

    try {
      await deleteTeamMemberApi(item.id)
      setFeedbackMessage(`Anggota tim "${item.name}" berhasil dihapus.`)
      setTimeout(() => setFeedbackMessage(''), 4000)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Gagal menghapus anggota tim'
      )
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="max-w-md rounded-xl border border-red-200 bg-red-50 p-8 text-center">
          <ShieldAlert size={42} className="mx-auto mb-4 text-red-500" />
          <h2 className="text-lg font-bold text-red-700">Akses Ditolak</h2>
          <p className="mt-2 text-sm text-red-600">
            Hanya admin dan super_admin yang dapat mengakses fitur pengelolaan About.
          </p>
        </div>
      </div>
    )
  }

  const iconBtn = 'p-1.5 rounded-lg transition-colors text-gray-400'

  return (
    <div className="flex flex-col h-full relative space-y-5 pb-10">
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            List Anggota Tim
          </h1>
        </div>

        <button
          type="button"
          onClick={onAddNew}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-sky-500 text-white font-semibold text-sm shadow-sm hover:bg-sky-600 transition-colors self-start sm:self-auto"
        >
          <Plus size={18} />
          Tambah Anggota Tim
        </button>
      </div>

      {/* ── Feedback Message ─────────────────────────────────────────────── */}
      {feedbackMessage && (
        <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm animate-in fade-in duration-200">
          <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* ── Filter Bar ──────────────────────────────────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-sky-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, jabatan..."
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

        {/* Status Filter */}
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

      {/* ── Table Card ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-red-500 gap-2">
              <ShieldAlert size={32} />
              <p className="text-sm font-medium">{error}</p>
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-52 text-gray-400 gap-2">
              <AlertCircle size={32} className="text-gray-300" />
              <p className="text-sm font-medium text-gray-600">
                {members.length === 0
                  ? 'Belum ada data anggota tim.'
                  : 'Tidak ada anggota tim yang cocok dengan filter.'}
              </p>
              {members.length === 0 && (
                <button
                  type="button"
                  onClick={onAddNew}
                  className="mt-1 text-xs font-semibold text-sky-600 hover:underline flex items-center gap-1"
                >
                  <Plus size={14} />
                  Tambah anggota tim pertama sekarang
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/60 border-b border-gray-100">
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-20">
                    Foto
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Nama
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Jabatan
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center">
                    Urutan
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredMembers.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-sky-50/30 transition-colors group"
                  >
                    {/* Foto */}
                    <td className="px-6 py-3.5">
                      <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
                        {item.photo_url && !brokenImages[item.id] ? (
                          <img
                            src={resolveImageUrl(item.photo_url)}
                            alt={item.name || 'Foto'}
                            className="w-full h-full object-cover"
                            onError={() => handleImageError(item.id)}
                          />
                        ) : (
                          <User size={20} className="text-slate-400" />
                        )}
                      </div>
                    </td>

                    {/* Nama */}
                    <td className="px-6 py-3.5">
                      <p className="text-sm font-semibold text-gray-900">
                        {item.name || '-'}
                      </p>
                    </td>

                    {/* Jabatan */}
                    <td className="px-6 py-3.5">
                      <p className="text-sm text-gray-600">
                        {item.position || '-'}
                      </p>
                    </td>

                    {/* Urutan */}
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                        #{item.display_order}
                      </span>
                    </td>

                    {/* Status Toggle */}
                    <td className="px-6 py-3.5">
                      <button
                        type="button"
                        onClick={() => handleToggleStatus(item)}
                        disabled={updatingStatusId === item.id}
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-colors cursor-pointer ${
                          item.is_active
                            ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        } ${updatingStatusId === item.id ? 'opacity-50 cursor-wait' : ''}`}
                        title="Klik untuk mengubah status"
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
                    <td className="px-6 py-3.5 text-right space-x-1 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onEdit?.(item)}
                        className={`${iconBtn} hover:text-sky-600 hover:bg-sky-50`}
                        title="Edit anggota"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteClick(item)}
                        className={`${iconBtn} hover:text-red-600 hover:bg-red-50`}
                        title="Hapus anggota"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        {!loading && !error && filteredMembers.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>
              Menampilkan {filteredMembers.length} anggota
            </span>
            <span>Total: {members.length} anggota</span>
          </div>
        )}
      </div>
    </div>
  )
}
