import { useEffect, useState } from 'react'
import {
  LayoutList,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import AboutCardIcon from '../components/AboutCardIcon'
import AboutCardFormModal from '../components/AboutCardFormModal'
import AboutCardDeleteModal from '../components/AboutCardDeleteModal'
import { listAboutCardsApi } from '../api/aboutCards'
import {
  formatAboutCardPosition,
  getAboutCardErrorMessage,
  sortAboutCards,
} from '../utils/aboutCards'

const PAGE_SIZE = 10

export default function KartuTentangPage({ role }) {
  const canManage = ['admin', 'super_admin'].includes(role)
  const [result, setResult] = useState({
    status: 'loading',
    cards: [],
    message: '',
  })
  const [refreshKey, setRefreshKey] = useState(0)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [editing, setEditing] = useState(undefined)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!canManage) return undefined
    const controller = new AbortController()
    const load = async () => {
      try {
        const cards = await listAboutCardsApi({ signal: controller.signal })
        if (!controller.signal.aborted)
          setResult({
            status: 'ready',
            cards: sortAboutCards(cards),
            message: '',
          })
      } catch (error) {
        if (!controller.signal.aborted)
          setResult({
            status: 'error',
            cards: [],
            message: getAboutCardErrorMessage(
              error,
              error.response?.status === 404
                ? 'Endpoint GET /api/about/cards belum tersedia di backend.'
                : 'Daftar kartu belum dapat dimuat. Pastikan backend dan endpoint GET /api/about/cards tersedia.',
            ),
          })
      }
    }
    load()
    return () => controller.abort()
  }, [canManage, refreshKey])

  const reload = () => {
    setResult({ status: 'loading', cards: [], message: '' })
    setRefreshKey((key) => key + 1)
  }
  const keyword = search.trim().toLowerCase()
  const filtered = result.cards.filter((card) =>
    [card.title, card.description, card.url].some((value) =>
      value.toLowerCase().includes(keyword),
    ),
  )
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, pages)
  const pageCards = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  if (!canManage)
    return (
      <p role="alert" className="text-sm text-red-600">
        Kamu tidak memiliki akses untuk mengatur kartu Tentang.
      </p>
    )

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            Kartu Tentang
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
            Kelola kartu “Pilih yang Terbaik” di halaman Tentang. Nomor kartu
            mengikuti posisi tampil.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={reload}
            disabled={result.status === 'loading'}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 disabled:opacity-50"
          >
            <RefreshCw size={16} aria-hidden="true" />
            Muat Ulang
          </button>
          <button
            type="button"
            onClick={() => {
              setNotice('')
              setEditing(null)
            }}
            disabled={result.status === 'loading'}
            className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
          >
            <Plus size={16} aria-hidden="true" />
            Tambah Kartu
          </button>
        </div>
      </div>
      {notice && (
        <p
          role="status"
          className="rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800"
        >
          {notice}
        </p>
      )}
      <section className="overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-sky-100 p-4">
          <div className="relative w-full sm:max-w-xs">
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="search"
              aria-label="Cari kartu Tentang"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value)
                setPage(1)
              }}
              placeholder="Cari judul, deskripsi, atau URL..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <p className="text-xs text-gray-500">
            {result.status === 'ready'
              ? `${filtered.length} dari ${result.cards.length} kartu`
              : 'Menunggu data backend'}
          </p>
        </div>
        {result.status === 'loading' ? (
          <p role="status" className="p-10 text-center text-sm text-gray-500">
            Memuat daftar kartu...
          </p>
        ) : result.status === 'error' ? (
          <p role="alert" className="p-8 text-sm leading-relaxed text-red-600">
            {result.message}
          </p>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <LayoutList
              size={32}
              aria-hidden="true"
              className="mx-auto mb-3 text-sky-400"
            />
            <p className="text-sm text-gray-500">
              {result.cards.length
                ? 'Tidak ada kartu yang cocok dengan pencarian.'
                : 'Belum ada kartu. Tambahkan kartu pertama.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table
              aria-label="Daftar kartu Tentang"
              className="w-full text-left text-sm"
            >
              <thead className="border-b border-sky-100 bg-sky-50/50 text-xs text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    Posisi
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Kartu
                  </th>
                  <th scope="col" className="px-5 py-4">
                    URL Tujuan
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {pageCards.map((card) => (
                  <tr key={card.id} className="hover:bg-sky-50/30">
                    <td className="px-5 py-4 font-semibold tabular-nums text-sky-700">
                      {formatAboutCardPosition(card.sort_order)}
                    </td>
                    <th
                      scope="row"
                      className="px-5 py-4 font-semibold text-gray-900"
                    >
                      <div className="flex items-center gap-3">
                        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
                          <AboutCardIcon name={card.icon} size={20} />
                        </span>
                        <span className="break-words">{card.title}</span>
                      </div>
                    </th>
                    <td className="max-w-xs break-all px-5 py-4 text-gray-500">
                      {card.url}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          aria-label={`Edit ${card.title}`}
                          onClick={() => {
                            setNotice('')
                            setEditing(card)
                          }}
                          className="rounded-lg p-3 text-sky-600 hover:bg-sky-50"
                        >
                          <Pencil size={16} aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label={`Hapus ${card.title}`}
                          onClick={() => {
                            setNotice('')
                            setDeleteTarget(card)
                          }}
                          className="rounded-lg p-3 text-red-500 hover:bg-red-50"
                        >
                          <Trash2 size={16} aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {pages > 1 && (
          <div className="flex items-center justify-between border-t border-sky-100 px-5 py-4 text-xs text-gray-500">
            <span>
              Halaman {currentPage} dari {pages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"
              >
                Sebelumnya
              </button>
              <button
                type="button"
                disabled={currentPage === pages}
                onClick={() => setPage(currentPage + 1)}
                className="rounded-lg border border-gray-200 px-3 py-2 disabled:opacity-40"
              >
                Berikutnya
              </button>
            </div>
          </div>
        )}
      </section>
      {editing !== undefined && (
        <AboutCardFormModal
          key={editing?.id ?? 'new'}
          card={editing}
          maxPosition={result.cards.length + (editing ? 0 : 1)}
          canSave={result.status === 'ready'}
          onClose={(reloadNeeded) => {
            setEditing(undefined)
            if (reloadNeeded) reload()
          }}
          onSaved={(cards) => {
            setResult({
              status: 'ready',
              cards: sortAboutCards(cards),
              message: '',
            })
            setEditing(undefined)
            setNotice(
              editing
                ? 'Kartu berhasil diperbarui.'
                : 'Kartu berhasil ditambahkan.',
            )
          }}
        />
      )}
      {deleteTarget && (
        <AboutCardDeleteModal
          card={deleteTarget}
          onClose={(reloadNeeded) => {
            setDeleteTarget(null)
            if (reloadNeeded) reload()
          }}
          onDeleted={(cards) => {
            setResult({
              status: 'ready',
              cards: sortAboutCards(cards),
              message: '',
            })
            setDeleteTarget(null)
            setNotice('Kartu berhasil dihapus.')
          }}
        />
      )}
    </div>
  )
}
