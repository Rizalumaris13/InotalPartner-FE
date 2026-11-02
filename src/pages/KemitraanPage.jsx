import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  Handshake,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import PartnerFormModal from '../components/PartnerFormModal'
import PartnerDeleteModal from '../components/PartnerDeleteModal'
import PartnerLogo from '../components/PartnerLogo'
import { useFeedback } from '../components/FeedbackUI'
import {
  deletePartnerApi,
  listPartnersApi,
  updatePartnerApi,
} from '../api/partners'
import {
  getPartnerErrorMessage,
  sortPartners,
  toPartnerPayload,
} from '../utils/partners'

const PAGE_SIZE = 10

export default function KemitraanPage({ role }) {
  const canManage = ['super_admin', 'admin'].includes(role)
  const [partners, setPartners] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [refreshKey, setRefreshKey] = useState(0)
  const [editing, setEditing] = useState(undefined)
  const [busyId, setBusyId] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleteError, setDeleteError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const { notify, FeedbackUI } = useFeedback()

  useEffect(() => {
    if (!canManage) return undefined
    const controller = new AbortController()
    const load = async () => {
      try {
        const data = await listPartnersApi({ signal: controller.signal })
        if (!controller.signal.aborted) {
          setPartners(sortPartners(data))
          setLoading(false)
        }
      } catch (err) {
        if (!controller.signal.aborted) {
          setError(
            err.response?.status === 404
              ? 'Endpoint GET /api/homepage/partners belum tersedia di backend.'
              : getPartnerErrorMessage(
                  err,
                  'Gagal memuat daftar mitra. Coba muat ulang.',
                ),
          )
          setLoading(false)
        }
      }
    }
    load()
    return () => controller.abort()
  }, [canManage, refreshKey])

  const keyword = search.trim().toLowerCase()
  const filtered = partners.filter((partner) => {
    const matchesStatus =
      filter === 'all' || partner.is_active === (filter === 'active')
    const matchesSearch =
      !keyword ||
      partner.name.toLowerCase().includes(keyword) ||
      (partner.website_url || '').toLowerCase().includes(keyword)
    return matchesStatus && matchesSearch
  })
  const activeCount = partners.filter((partner) => partner.is_active).length
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const firstIndex = (currentPage - 1) * PAGE_SIZE
  const pageItems = filtered.slice(firstIndex, firstIndex + PAGE_SIZE)

  const reload = () => {
    setLoading(true)
    setError('')
    setRefreshKey((key) => key + 1)
  }

  const toggleStatus = async (partner) => {
    if (!canManage || busyId !== null) return
    setBusyId(partner.id)
    try {
      await updatePartnerApi(
        partner.id,
        toPartnerPayload({
          ...partner,
          logo_url: partner.logo_url || '',
          website_url: partner.website_url || '',
          sort_order: String(partner.sort_order),
          is_active: !partner.is_active,
        }),
      )
      notify(
        partner.is_active
          ? 'Mitra berhasil dinonaktifkan.'
          : 'Mitra berhasil diaktifkan.',
      )
      reload()
    } catch (err) {
      notify(
        getPartnerErrorMessage(err, 'Gagal mengubah status mitra.'),
        'error',
      )
    } finally {
      setBusyId(null)
    }
  }

  const deleteNow = async () => {
    if (!canManage || !deleteTarget || busyId !== null) return
    setBusyId(deleteTarget.id)
    setDeleteError('')
    try {
      await deletePartnerApi(deleteTarget.id)
      setDeleteTarget(null)
      notify('Mitra berhasil dihapus.')
      reload()
    } catch (err) {
      setDeleteError(
        getPartnerErrorMessage(err, 'Gagal menghapus mitra. Coba lagi.'),
      )
    } finally {
      setBusyId(null)
    }
  }

  if (!canManage)
    return (
      <p role="alert" className="text-sm text-red-600">
        Kamu tidak memiliki akses untuk mengatur kemitraan.
      </p>
    )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
            Kemitraan
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Kelola daftar mitra pada bagian “Akselerasi Kemitraan Anda” di
            beranda.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={loading || busyId !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />{' '}
            Muat Ulang
          </button>
          <button
            type="button"
            onClick={() => setEditing(null)}
            disabled={loading || busyId !== null}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Plus size={16} />
            Tambah Mitra
          </button>
        </div>
      </div>

      <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
        {!error && (
          <div className="flex flex-col gap-3 border-b border-sky-100 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search
                size={16}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="search"
                aria-label="Cari mitra"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value)
                  setPage(1)
                }}
                placeholder="Cari nama atau situs mitra..."
                disabled={loading}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:bg-white focus:ring-2 focus:ring-sky-100"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: 'all', label: 'Semua', count: partners.length },
                { key: 'active', label: 'Aktif', count: activeCount },
                {
                  key: 'inactive',
                  label: 'Nonaktif',
                  count: partners.length - activeCount,
                },
              ].map((item) => (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={filter === item.key}
                  onClick={() => {
                    setFilter(item.key)
                    setPage(1)
                  }}
                  disabled={loading}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${filter === item.key ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}
                >
                  {item.label} ({loading ? '...' : item.count})
                </button>
              ))}
            </div>
          </div>
        )}
        {loading ? (
          <p role="status" className="p-10 text-center text-sm text-gray-500">
            Memuat daftar mitra...
          </p>
        ) : error ? (
          <div
            role="alert"
            className="flex items-center justify-center gap-3 p-10 text-sm text-red-600"
          >
            <AlertCircle size={20} />
            {error}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <Handshake size={32} className="mx-auto mb-3 text-sky-400" />
            <p className="text-sm text-gray-500">
              {partners.length === 0
                ? 'Belum ada mitra.'
                : 'Tidak ada mitra yang cocok dengan pencarian atau filter.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              aria-label="Daftar mitra"
              className="w-full text-left text-sm"
            >
              <thead className="border-b border-sky-100 bg-sky-50/50 text-xs text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    Mitra
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Urutan
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Status
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageItems.map((partner) => (
                  <tr key={partner.id} className="hover:bg-sky-50/30">
                    <th
                      scope="row"
                      className="px-5 py-4 font-semibold text-gray-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="h-12 w-12 shrink-0 rounded-xl border border-sky-100 bg-white p-2">
                          <PartnerLogo
                            name={partner.name}
                            url={partner.logo_url}
                            compact
                            decorative
                          />
                        </span>
                        <span className="break-words">{partner.name}</span>
                      </div>
                    </th>
                    <td className="px-5 py-4 text-gray-500">
                      {partner.sort_order}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-medium ${partner.is_active ? 'bg-sky-50 text-sky-700' : 'bg-gray-100 text-gray-500'}`}
                      >
                        {partner.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${partner.name}`}
                          onClick={() => setEditing(partner)}
                          disabled={busyId !== null}
                          className="rounded-lg p-2 text-sky-600 hover:bg-sky-50 disabled:opacity-40"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          aria-label={`${partner.is_active ? 'Nonaktifkan' : 'Aktifkan'} ${partner.name}`}
                          onClick={() => toggleStatus(partner)}
                          disabled={busyId !== null}
                          className="rounded-lg p-2 text-gray-500 hover:bg-sky-50 hover:text-sky-600 disabled:opacity-40"
                        >
                          {partner.is_active ? (
                            <EyeOff size={16} />
                          ) : (
                            <Eye size={16} />
                          )}
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${partner.name}`}
                          onClick={() => {
                            setDeleteError('')
                            setDeleteTarget(partner)
                          }}
                          disabled={busyId !== null}
                          className="rounded-lg p-2 text-red-500 hover:bg-red-50 disabled:opacity-40"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !error && filtered.length > PAGE_SIZE && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-sky-100 px-5 py-4">
            <p className="text-xs text-gray-500">
              Menampilkan {firstIndex + 1}–
              {Math.min(firstIndex + PAGE_SIZE, filtered.length)} dari{' '}
              {filtered.length} mitra
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label="Halaman sebelumnya"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs text-gray-500">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                aria-label="Halaman berikutnya"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-lg border border-gray-200 p-2 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </section>
      {editing !== undefined && (
        <PartnerFormModal
          key={editing?.id ?? 'new'}
          partner={editing}
          nextOrder={
            partners.reduce((max, item) => Math.max(max, item.sort_order), -1) +
            1
          }
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined)
            notify(
              editing
                ? 'Mitra berhasil diperbarui.'
                : 'Mitra berhasil ditambahkan.',
            )
            reload()
          }}
        />
      )}
      {deleteTarget && (
        <PartnerDeleteModal
          partner={deleteTarget}
          busy={busyId !== null}
          error={deleteError}
          onClose={() => setDeleteTarget(null)}
          onConfirm={deleteNow}
        />
      )}
      <FeedbackUI />
    </div>
  )
}
