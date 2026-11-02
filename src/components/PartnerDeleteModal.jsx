import { Trash2 } from 'lucide-react'
import PartnerDialog from './PartnerDialog'

export default function PartnerDeleteModal({
  partner,
  busy,
  error,
  onClose,
  onConfirm,
}) {
  return (
    <PartnerDialog
      labelledBy="partner-delete-title"
      describedBy="partner-delete-description"
      role="alertdialog"
      busy={busy}
      onClose={onClose}
      maxWidth="max-w-md"
    >
      <div className="p-6">
        <span className="mb-4 inline-flex rounded-xl bg-red-50 p-3 text-red-500">
          <Trash2 size={24} />
        </span>
        <h2
          id="partner-delete-title"
          className="text-lg font-extrabold text-gray-900"
        >
          Hapus Mitra?
        </h2>
        <p
          id="partner-delete-description"
          className="mt-3 text-sm leading-relaxed text-gray-600"
        >
          Mitra{' '}
          <strong className="break-words text-gray-900">{partner.name}</strong>{' '}
          akan dihapus dari daftar dan tidak lagi tampil di beranda. Tindakan
          ini tidak bisa dibatalkan.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy ? 'Menghapus...' : 'Hapus Mitra'}
          </button>
        </div>
      </div>
    </PartnerDialog>
  )
}
