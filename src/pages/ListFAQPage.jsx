import React, { useState, useEffect, useMemo } from 'react'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  AlertCircle,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  Eye,
  X,
} from 'lucide-react'
import {
  getAboutFAQsApi,
  deleteAboutFAQApi,
  updateAboutFAQApi,
} from '../api/about'
import { useAuth } from '../hooks/useAuth'

const STATUS_FILTERS = [
  { key: 'all', label: 'Semua' },
  { key: 'active', label: 'Aktif' },
  { key: 'inactive', label: 'Tidak Aktif' },
]

export default function ListFAQPage({ onAddNew, onEdit }) {
  const { role, user } = useAuth()
  const currentRole =
    (typeof user?.role === 'object' ? user?.role?.name : user?.role) ||
    role ||
    'guest'
  const isAdmin = currentRole === 'admin' || currentRole === 'super_admin'

  const [faqs, setFaqs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)

  // Modal preview jawaban penuh
  const [previewItem, setPreviewItem] = useState(null)

  // Filter & Search
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  useEffect(() => {
    let isMounted = true

    const loadFAQs = async () => {
      setLoading(true)
      setError('')
      try {
        const data = await getAboutFAQsApi()
        if (isMounted) {
          setFaqs(Array.isArray(data) ? data : [])
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              'Gagal mengambil daftar FAQ'
          )
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadFAQs()

    return () => {
      isMounted = false
    }
  }, [refreshKey])

  // Filter list data berdasarkan search dan status
  const filteredFAQs = useMemo(() => {
    return faqs.filter((item) => {
      const matchSearch =
        search === '' ||
        (item.question &&
          item.question.toLowerCase().includes(search.toLowerCase())) ||
        (item.answer &&
          item.answer.toLowerCase().includes(search.toLowerCase()))

      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && item.is_active) ||
        (statusFilter === 'inactive' && !item.is_active)

      return matchSearch && matchStatus
    })
  }, [faqs, search, statusFilter])

  // Toggle status aktif / tidak aktif
  const handleToggleStatus = async (item) => {
    if (!isAdmin) {
      alert('Hanya admin dan super_admin yang dapat mengubah status FAQ.')
      return
    }
    if (updatingStatusId) return

    const newStatus = !item.is_active
    setUpdatingStatusId(item.id)

    try {
      await updateAboutFAQApi(item.id, {
        question: item.question,
        answer: item.answer,
        display_order: item.display_order,
        is_active: newStatus,
      })

      setFaqs((prev) =>
        prev.map((f) => (f.id === item.id ? { ...f, is_active: newStatus } : f))
      )

      setFeedbackMessage(
        `Status FAQ "${item.question.slice(0, 30)}..." diubah menjadi ${
          newStatus ? 'Aktif' : 'Tidak Aktif'
        }.`
      )
      setTimeout(() => setFeedbackMessage(''), 3500)
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Gagal memperbarui status FAQ'
      )
    } finally {
      setUpdatingStatusId(null)
    }
  }

  // Handle Delete Action
  const handleDeleteClick = async (item) => {
    if (!isAdmin) {
      alert('Hanya admin dan super_admin yang dapat menghapus FAQ.')
      return
    }

    if (
      !window.confirm(
        `Apakah Anda yakin ingin menghapus pertanyaan FAQ:\n"${item.question}"?`
      )
    ) {
      return
    }

    try {
      await deleteAboutFAQApi(item.id)
      setFeedbackMessage(`FAQ berhasil dihapus.`)
      setTimeout(() => setFeedbackMessage(''), 4000)
      setRefreshKey((k) => k + 1)
    } catch (err) {
      alert(
        err.response?.data?.message ||
          err.message ||
          'Gagal menghapus FAQ'
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
            <HelpCircle className="text-sky-600" size={24} />
            Daftar FAQ (Pertanyaan Umum)
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Kelola daftar pertanyaan dan jawaban FAQ untuk halaman Tentang Kami.
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={onAddNew}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <Plus size={16} />
            Tambah FAQ Baru
          </button>
        )}
      </div>

      {/* ── Banner Proteksi Non-Admin ──────────────────────────────────── */}
      {!isAdmin && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs">
          <ShieldAlert size={18} className="shrink-0 text-amber-600" />
          <span>
            Anda masuk dengan hak akses terbatas (hanya baca). Pengelolaan FAQ
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
              placeholder="Cari pertanyaan atau jawaban..."
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
              <p className="text-xs font-medium">Memuat daftar FAQ...</p>
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
          ) : filteredFAQs.length === 0 ? (
            <div className="py-16 text-center text-gray-400 space-y-2">
              <HelpCircle size={32} className="mx-auto text-gray-300" />
              <p className="text-xs font-medium text-gray-600">
                {search || statusFilter !== 'all'
                  ? 'Tidak ada FAQ yang cocok dengan filter atau kata kunci.'
                  : 'Belum ada data FAQ.'}
              </p>
              {isAdmin && !search && statusFilter === 'all' && (
                <button
                  type="button"
                  onClick={onAddNew}
                  className="inline-flex items-center gap-1.5 text-xs text-sky-600 hover:underline font-semibold cursor-pointer pt-2"
                >
                  <Plus size={14} />
                  Tambah FAQ Sekarang
                </button>
              )}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-gray-100 bg-slate-50/75">
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-14 text-center">
                    No
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Pertanyaan
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Cuplikan Jawaban
                  </th>
                  <th className="px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-center w-24">
                    Urutan
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
                {filteredFAQs.map((item, index) => (
                  <tr
                    key={item.id}
                    className="hover:bg-sky-50/30 transition-colors group"
                  >
                    {/* Nomor */}
                    <td className="px-5 py-3.5 text-center text-xs text-gray-500 font-medium">
                      {index + 1}
                    </td>

                    {/* Pertanyaan */}
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-sm font-semibold text-gray-900 line-clamp-2">
                        {item.question}
                      </p>
                    </td>

                    {/* Cuplikan Jawaban */}
                    <td className="px-5 py-3.5 max-w-sm">
                      <p className="text-xs text-gray-600 line-clamp-2">
                        {item.answer}
                      </p>
                      {item.answer && item.answer.length > 90 && (
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

                    {/* Urutan */}
                    <td className="px-5 py-3.5 text-center">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold bg-slate-100 text-slate-700">
                        #{item.display_order}
                      </span>
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
                            title="Edit FAQ"
                          >
                            <Edit size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteClick(item)}
                            className={`${iconBtn} hover:text-red-600 hover:bg-red-50`}
                            title="Hapus FAQ"
                          >
                            <Trash2 size={16} />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs text-gray-400 italic">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer info */}
        {!loading && !error && filteredFAQs.length > 0 && (
          <div className="px-5 py-3 border-t border-gray-100 text-xs text-gray-400 flex items-center justify-between">
            <span>Menampilkan {filteredFAQs.length} FAQ</span>
            <span>Total: {faqs.length} FAQ</span>
          </div>
        )}
      </div>

      {/* ── Modal Preview Jawaban Penuh ─────────────────────────────────── */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <HelpCircle size={18} className="text-sky-600" />
                <h3 className="text-sm font-bold text-gray-900">Detail FAQ</h3>
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
                  Pertanyaan
                </p>
                <p className="text-sm font-semibold text-gray-900 mt-1">
                  {previewItem.question}
                </p>
              </div>

              <div>
                <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                  Jawaban Lengkap
                </p>
                <div className="mt-1 p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-gray-700 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {previewItem.answer}
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs text-gray-500 pt-2 border-t border-gray-100">
                <span>
                  Urutan Tampil:{' '}
                  <strong className="text-gray-800">
                    #{previewItem.display_order}
                  </strong>
                </span>
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

