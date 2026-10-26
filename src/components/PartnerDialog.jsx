import { useEffect, useRef } from 'react'

export default function PartnerDialog({
  children,
  labelledBy,
  describedBy,
  role = 'dialog',
  busy,
  initialFocusRef,
  onClose,
  maxWidth = 'max-w-xl',
}) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    const previousFocus = document.activeElement
    dialog.showModal()
    initialFocusRef?.current?.focus()
    return () => {
      dialog.close()
      previousFocus?.focus()
    }
  }, [initialFocusRef])

  return (
    <dialog
      ref={dialogRef}
      role={role}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-modal="true"
      onCancel={(event) => {
        event.preventDefault()
        if (!busy) onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !busy) onClose()
      }}
      className={`fixed inset-0 m-auto w-[calc(100%_-_2rem)] ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border-0 bg-white p-0 shadow-2xl backdrop:bg-slate-950/40`}
    >
      {children}
    </dialog>
  )
}
