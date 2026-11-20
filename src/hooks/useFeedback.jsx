import { useCallback, useEffect, useRef, useState } from 'react'
import FeedbackMessages from '../components/FeedbackMessages'

const TOAST_DURATION_MS = 4500

export function useFeedback() {
  const [toast, setToast] = useState(null)
  const [confirmation, setConfirmation] = useState(null)
  const resolverRef = useRef(null)
  const toastTimerRef = useRef(null)

  const notify = useCallback((message, type = 'success') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ message: String(message || 'Terjadi kesalahan.'), type })
    toastTimerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }, [])

  const confirmAction = useCallback((message, options = {}) => new Promise((resolve) => {
    resolverRef.current = resolve
    setConfirmation({
      title: options.title || 'Konfirmasi tindakan',
      message,
      confirmLabel: options.confirmLabel || 'Ya, lanjutkan',
      danger: options.danger ?? true,
    })
  }), [])

  function closeConfirmation(result) {
    setConfirmation(null)
    if (resolverRef.current) resolverRef.current(result)
    resolverRef.current = null
  }

  useEffect(() => () => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    if (resolverRef.current) resolverRef.current(false)
  }, [])

  const feedback = (
    <FeedbackMessages
      toast={toast}
      confirmation={confirmation}
      onDismissToast={() => setToast(null)}
      onConfirm={closeConfirmation}
    />
  )

  return { notify, confirmAction, feedback }
}
