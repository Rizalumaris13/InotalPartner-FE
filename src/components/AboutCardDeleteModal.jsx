import { useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
import PartnerDialog from './PartnerDialog'
import { deleteAboutCardApi, listAboutCardsApi } from '../api/aboutCards'
import { getAboutCardErrorMessage } from '../utils/aboutCards'

export default function AboutCardDeleteModal({ card, onClose, onDeleted }) {
  const cancelRef = useRef(null)
  const operationRef = useRef(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [accepted, setAccepted] = useState(false)
  const close = () => {
    if (!operationRef.current) onClose(accepted)
  }

  const remove = async () => {
    if (operationRef.current) return
    operationRef.current = true
    setBusy(true)
    setError('')
    let deleted = accepted
    try {
      if (!deleted) {
        await deleteAboutCardApi(card.id)
        deleted = true
        setAccepted(true)
      }
      const cards = await listAboutCardsApi()
      if (cards.some((item) => item.id === card.id))
        throw new Error('Kartu masih ada pada daftar backend.')
      onDeleted(cards)
    } catch (err) {
      const message = getAboutCardErrorMessage(
        err,
        'Gagal menghapus kartu. Periksa koneksi backend.',
      )
      setError(
        deleted
          ? `Penghapusan diterima, tetapi belum terverifikasi: ${message} Coba verifikasi ulang tanpa menghapus lagi.`
          : message,
      )
    } finally {
      operationRef.current = false
      setBusy(false)
    }
  }

  return (
    <PartnerDialog
      role="alertdialog"
      labelledBy="about-delete-title"
      describedBy="about-delete-description"
      busy={busy}
      initialFocusRef={cancelRef}
      onClose={close}
      maxWidth="max-w-md"
    >
      <div className="p-6">
        <span className="mb-4 grid h-11 w-11 place-items-center rounded-full bg-red-50 text-red-600">
          <Trash2 size={22} aria-hidden="true" />
        </span>
        <h2
          id="about-delete-title"
          className="text-lg font-extrabold text-gray-900"
        >
          Hapus Kartu?
        </h2>
        <p
          id="about-delete-description"
          className="mt-2 break-words text-sm leading-relaxed text-gray-600"
        >
          Kartu “{card.title}” akan dihapus dari halaman Tentang. Posisi kartu
          lain dirapikan otomatis.
        </p>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm leading-relaxed text-red-700"
          >
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={close}
            disabled={busy}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-50"
          >
            {accepted ? 'Tutup dan Muat Ulang' : 'Batal'}
          </button>
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            className="rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
          >
            {busy
              ? 'Memverifikasi...'
              : accepted
                ? 'Coba Verifikasi'
                : 'Ya, Hapus Kartu'}
          </button>
        </div>
      </div>
    </PartnerDialog>
  )
}
