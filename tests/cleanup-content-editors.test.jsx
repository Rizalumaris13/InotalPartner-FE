import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { http, HttpResponse } from 'msw'
import { server } from './setup'
import AboutIntroPage from '../src/pages/AboutIntroPage'
import HomepageServicesPage from '../src/pages/HomepageServicesPage'

const originalCreate = Object.getOwnPropertyDescriptor(URL, 'createObjectURL')
const originalRevoke = Object.getOwnPropertyDescriptor(URL, 'revokeObjectURL')

beforeEach(() => {
  let serial = 0
  Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => `blob:fixture-${++serial}`) })
  Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() })
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback) { this.callback = callback }
    observe(element) { this.callback([{ target: element, isIntersecting: true }]) }
    unobserve() {}
    disconnect() {}
  })
  server.use(
    http.get('*/api/about/intro', () => HttpResponse.json({ success: true, data: null })),
    http.get('*/api/homepage/services', () => HttpResponse.json({ success: true, data: null })),
  )
})

afterEach(() => {
  // Unmount while observer and object-URL stubs still exist; cleanup flushes effects.
  cleanup()
  if (originalCreate) Object.defineProperty(URL, 'createObjectURL', originalCreate)
  else delete URL.createObjectURL
  if (originalRevoke) Object.defineProperty(URL, 'revokeObjectURL', originalRevoke)
  else delete URL.revokeObjectURL
  vi.unstubAllGlobals()
})

const editors = [
  ['intro', AboutIntroPage, 'Intro Tentang', 'Judul utama'],
  ['services', HomepageServicesPage, 'Kartu layanan Beranda', 'Judul bagian'],
]
const choose = (label, name) => fireEvent.change(screen.getByLabelText(label), {
  target: { files: [new File(['fixture'], name, { type: 'image/png' })] },
})

describe('shared content editor fields', () => {
  it.each(editors)('only references help and errors that exist in the %s form', async (_name, Editor, formName) => {
    render(<Editor role="admin" />)
    const form = await screen.findByRole('form', { name: formName })
    const missing = [...form.querySelectorAll('[aria-describedby]')].flatMap((field) =>
      field.getAttribute('aria-describedby').split(/\s+/).filter((id) => !document.getElementById(id)),
    )
    expect(missing).toEqual([])
  })

  it.each(editors)('keeps the focused %s field mounted while typing', async (_name, Editor, formName, label) => {
    render(<Editor role="admin" />)
    await screen.findByRole('form', { name: formName })
    const field = screen.getByLabelText(label)
    field.focus()
    fireEvent.change(field, { target: { value: 'Judul diubah' } })
    expect(screen.getByLabelText(label)).toBe(field)
    expect(document.activeElement).toBe(field)
    expect(field.value).toBe('Judul diubah')
  })

  it('releases replaced, cancelled and unmounted intro previews', async () => {
    const view = render(<AboutIntroPage role="admin" />)
    await screen.findByRole('form', { name: 'Intro Tentang' })
    choose('Pilih foto intro', 'first.png')
    expect(view.container.querySelector('img[src="blob:fixture-1"]')).not.toBeNull()
    choose('Pilih foto intro', 'second.png')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-1')
    expect(view.container.querySelector('img[src="blob:fixture-2"]')).not.toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Batal pilih foto intro' }))
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-2')
    choose('Pilih foto intro', 'third.png')
    view.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-3')
  })

  it('keeps the other service photo alive when a slot changes', async () => {
    const view = render(<HomepageServicesPage role="admin" />)
    await screen.findByRole('form', { name: 'Kartu layanan Beranda' })
    choose('Pilih foto utama', 'primary.png')
    choose('Pilih foto kedua', 'secondary.png')
    expect(URL.revokeObjectURL).not.toHaveBeenCalled()
    choose('Pilih foto utama', 'replacement.png')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-1')
    expect(URL.revokeObjectURL).not.toHaveBeenCalledWith('blob:fixture-2')
    expect(view.container.querySelector('img[src="blob:fixture-2"]')).not.toBeNull()
    expect(view.container.querySelector('img[src="blob:fixture-3"]')).not.toBeNull()
    view.unmount()
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-2')
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:fixture-3')
  })
})
