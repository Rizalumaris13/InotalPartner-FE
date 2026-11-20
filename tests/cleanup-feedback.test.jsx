import { afterEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { useFeedback } from '../src/hooks/useFeedback'

function FeedbackHarness({ onDecision = () => {} }) {
  const { notify, confirmAction, feedback } = useFeedback()

  return (
    <>
      <button onClick={() => notify('Perubahan tersimpan.')}>Notifikasi pertama</button>
      <button onClick={() => notify('Sedang memuat ulang.', 'info')}>Notifikasi kedua</button>
      <button onClick={() => confirmAction('Hapus item ini?').then(onDecision)}>Buka konfirmasi</button>
      {feedback}
    </>
  )
}

afterEach(() => vi.useRealTimers())

describe('feedback shared lifecycle', () => {
  it('keeps the dialog and focused action when its parent rerenders', () => {
    const { rerender } = render(<FeedbackHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka konfirmasi' }))
    const dialog = screen.getByRole('alertdialog')
    const cancel = screen.getByRole('button', { name: 'Batal' })
    cancel.focus()

    rerender(<FeedbackHarness />)

    expect(screen.getByRole('alertdialog')).toBe(dialog)
    expect(document.activeElement).toBe(cancel)
  })

  it('resolves both confirmation actions without losing their boolean result', async () => {
    const onDecision = vi.fn()
    render(<FeedbackHarness onDecision={onDecision} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka konfirmasi' }))
    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    await waitFor(() => expect(onDecision).toHaveBeenLastCalledWith(false))
    expect(screen.queryByRole('alertdialog')).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: 'Buka konfirmasi' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ya, lanjutkan' }))
    await waitFor(() => expect(onDecision).toHaveBeenLastCalledWith(true))
  })

  it('only dismisses a confirmation when the backdrop itself is pressed', async () => {
    const onDecision = vi.fn()
    render(<FeedbackHarness onDecision={onDecision} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka konfirmasi' }))
    fireEvent.mouseDown(screen.getByRole('alertdialog'))
    expect(onDecision).not.toHaveBeenCalled()
    fireEvent.mouseDown(screen.getByRole('presentation'))
    await waitFor(() => expect(onDecision).toHaveBeenCalledWith(false))
  })

  it('replaces a toast and gives the replacement its full display time', () => {
    vi.useFakeTimers()
    render(<FeedbackHarness />)
    fireEvent.click(screen.getByRole('button', { name: 'Notifikasi pertama' }))
    act(() => vi.advanceTimersByTime(4000))
    fireEvent.click(screen.getByRole('button', { name: 'Notifikasi kedua' }))
    act(() => vi.advanceTimersByTime(500))
    expect(screen.getByRole('status').textContent).toContain('Sedang memuat ulang.')
    act(() => vi.advanceTimersByTime(4500 - 500))
    expect(screen.queryByRole('status')).toBeNull()
  })

  it('resolves a pending confirmation as cancelled on unmount', async () => {
    const onDecision = vi.fn()
    const { unmount } = render(<FeedbackHarness onDecision={onDecision} />)
    fireEvent.click(screen.getByRole('button', { name: 'Buka konfirmasi' }))
    unmount()
    await waitFor(() => expect(onDecision).toHaveBeenCalledWith(false))
  })
})
