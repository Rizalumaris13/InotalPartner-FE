import { useState } from 'react'
import { Eye, LayoutList, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import CompanyIcon from './CompanyIcon'
import PartnerDialog from './PartnerDialog'
import { formatCompanyValue } from '../utils/companyInputs'

function OpportunityRow({ entry, menu, factFields, onEdit, onRequestDelete }) {
  const { draft } = entry
  return (
    <tr className="align-top hover:bg-sky-50/30">
      <th scope="row" className="px-5 py-4 text-left font-semibold text-gray-900">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-sky-50 text-sky-600">
            <CompanyIcon kind={menu.icon} size={18} />
          </span>
          <div className="min-w-0">
            <p className="break-words">{draft.title || menu.previewTitle}</p>
            <p className="mt-1 break-words text-xs font-normal text-gray-500">
              {[draft.company, draft.location].filter(Boolean).join(' · ') || 'Perusahaan belum diisi'}
            </p>
          </div>
        </div>
      </th>
      <td className="px-5 py-4">
        <dl className="grid gap-1 text-xs text-gray-600">
          {factFields.map((field) => (
            <div key={field.key} className="flex min-w-0 flex-wrap gap-x-1.5">
              <dt className="text-gray-500">{field.label}:</dt>
              <dd className="min-w-0 break-words font-semibold text-gray-700">
                {formatCompanyValue(field, draft[field.key] || '')}
              </dd>
            </div>
          ))}
        </dl>
      </td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-1">
          <button
            type="button"
            aria-label={`Edit ${draft.title || menu.label}`}
            onClick={() => onEdit(entry.id)}
            className="rounded-lg p-3 text-sky-600 transition hover:bg-sky-50"
          >
            <Pencil size={16} aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={`Hapus ${draft.title || menu.label}`}
            onClick={() => onRequestDelete(entry)}
            className="rounded-lg p-3 text-red-500 transition hover:bg-red-50"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </div>
      </td>
    </tr>
  )
}

export default function CompanyOpportunityList({
  menu,
  entries,
  notice,
  onAdd,
  onEdit,
  onDelete,
}) {
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState(null)
  const keyword = search.trim().toLowerCase()
  const fields = menu.sections.flatMap((section) => section.fields)
  const factFields = menu.previewFacts
    .map((key) => fields.find((field) => field.key === key))
    .filter(Boolean)
  const filtered = entries.filter(({ draft }) =>
    [draft.title, draft.company, draft.location]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(keyword)),
  )

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-sky-600">
            Peluang perusahaan
          </p>
          <h1 className="text-xl font-extrabold tracking-tight text-gray-900">
            {menu.label}
          </h1>
          <p className="mt-1 max-w-xl text-sm leading-relaxed text-gray-500">
            {menu.description}
          </p>
        </div>
        <button
          type="button"
          onClick={onAdd}
          className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
        >
          <Plus size={16} aria-hidden="true" />
          Tambah
        </button>
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-xs leading-relaxed text-sky-800">
        <Eye size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
        <p>
          Tahap tampilan: daftar dan form belum terhubung ke backend. Draf hanya
          tersimpan di halaman ini dan hilang saat dimuat ulang.
        </p>
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
              aria-label={`Cari ${menu.label}`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari judul, perusahaan, atau lokasi..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
            />
          </div>
          <p className="text-xs text-gray-500">
            {filtered.length} dari {entries.length} draf
          </p>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <LayoutList
              size={32}
              aria-hidden="true"
              className="mx-auto mb-3 text-sky-400"
            />
            <p className="text-sm text-gray-500">
              Belum ada {menu.label.toLowerCase()}. Klik Tambah untuk membuat
              draf pertama.
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <LayoutList
              size={32}
              aria-hidden="true"
              className="mx-auto mb-3 text-sky-400"
            />
            <p className="text-sm text-gray-500">
              Tidak ada draf yang cocok dengan pencarian.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table aria-label={`Daftar ${menu.label}`} className="w-full text-left text-sm">
              <thead className="border-b border-sky-100 bg-sky-50/50 text-xs text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-4">Peluang</th>
                  <th scope="col" className="px-5 py-4">Rincian</th>
                  <th scope="col" className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((entry) => (
                  <OpportunityRow
                    key={entry.id}
                    entry={entry}
                    menu={menu}
                    factFields={factFields}
                    onEdit={onEdit}
                    onRequestDelete={setDeleteTarget}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {deleteTarget && (
        <PartnerDialog
          role="alertdialog"
          labelledBy="company-delete-title"
          describedBy="company-delete-description"
          onClose={() => setDeleteTarget(null)}
          maxWidth="max-w-md"
        >
          <div className="p-6">
            <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
              <Trash2 size={22} aria-hidden="true" />
            </span>
            <h2
              id="company-delete-title"
              className="text-lg font-extrabold text-gray-900"
            >
              Hapus Draf?
            </h2>
            <p
              id="company-delete-description"
              className="mt-2 break-words text-sm leading-relaxed text-gray-600"
            >
              Draf “{deleteTarget.draft.title || menu.label}” akan dihapus dari
              daftar. Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDelete(deleteTarget.id)
                  setDeleteTarget(null)
                }}
                className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700"
              >
                Ya, Hapus Draf
              </button>
            </div>
          </div>
        </PartnerDialog>
      )}
    </div>
  )
}
