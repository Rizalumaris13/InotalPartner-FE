import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { renderToStaticMarkup } from 'react-dom/server'
import AboutIntroSection from '../src/components/AboutIntroSection'
import ArtikelPage from '../src/pages/FrontPage/ArtikelPage'
import EventPage from '../src/pages/FrontPage/EventPage'
import KontakPage from '../src/pages/FrontPage/KontakPage'
import TentangPage from '../src/pages/FrontPage/TentangPage'
import { DEFAULT_ABOUT_INTRO } from '../src/data/aboutIntro'

let observers

beforeEach(() => {
  vi.useFakeTimers()
  observers = []
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback, options) {
      this.callback = callback
      this.options = options
      this.disconnect = vi.fn()
      observers.push(this)
    }
    observe(element) { this.element = element }
  })
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function photoReveal() {
  return screen.getByAltText(DEFAULT_ABOUT_INTRO.photo_alt).parentElement.parentElement
}

test.each([
  ['artikel', ArtikelPage, true],
  ['event', EventPage, false],
  ['kontak', KontakPage, false],
  ['tentang', TentangPage, false],
])('wrapper reveal %s mempertahankan kontrak h-full halaman', (label, Page, fullHeight) => {
  const container = document.createElement('div')
  container.innerHTML = renderToStaticMarkup(<Page />)
  const wrappers = [...container.querySelectorAll('div[style*="transition-delay"]')]
  expect(wrappers.length).toBeGreaterThan(0)
  for (const wrapper of wrappers) {
    expect(wrapper.classList.contains('h-full')).toBe(fullHeight)
    expect(wrapper.classList.contains('opacity-0')).toBe(true)
    expect(wrapper.classList.contains('duration-700')).toBe(true)
  }
})

function progressBar(container) {
  return container.querySelector('[style*="width"]')
}

test('intro mempertahankan wrapper, delay, dan reveal sekali saat beririsan', () => {
  render(<AboutIntroSection />)
  const wrapper = photoReveal()
  const observer = observers.find((entry) => entry.element === wrapper)
  expect(wrapper.tagName).toBe('DIV')
  expect(wrapper.className).toBe('transition-all duration-700 ease-out opacity-0 translate-y-6 relative mb-8 lg:mb-0')
  expect(wrapper.style.transitionDelay).toBe('0ms')
  expect(observer.options).toEqual({ threshold: 0.1 })
  const vision = screen.getByRole('heading', { name: DEFAULT_ABOUT_INTRO.vision.title }).parentElement.parentElement
  expect(vision.style.transitionDelay).toBe('120ms')

  act(() => observer.callback([{ isIntersecting: false }]))
  expect(wrapper.classList.contains('opacity-0')).toBe(true)
  act(() => observer.callback([{ isIntersecting: true }]))
  expect(wrapper.classList.contains('opacity-100')).toBe(true)
  expect(wrapper.classList.contains('translate-y-0')).toBe(true)
  expect(observer.disconnect).toHaveBeenCalledTimes(1)
  act(() => observer.callback([{ isIntersecting: false }]))
  expect(wrapper.classList.contains('opacity-100')).toBe(true)
})

test('fallback reveal 700 ms terpisah dari progres 1200 ms dan durasi 1400 ms', () => {
  const { container } = render(<AboutIntroSection />)
  const wrapper = photoReveal()
  const progress = progressBar(container)
  expect(observers.some((entry) => entry.options.threshold === 0.4)).toBe(true)
  expect(progress.style.width).toBe('0%')
  expect(progress.classList.contains('duration-[1400ms]')).toBe(true)
  act(() => vi.advanceTimersByTime(699))
  expect(wrapper.classList.contains('opacity-0')).toBe(true)
  act(() => vi.advanceTimersByTime(1))
  expect(wrapper.classList.contains('opacity-100')).toBe(true)
  expect(progress.style.width).toBe('0%')
  act(() => vi.advanceTimersByTime(499))
  expect(progress.style.width).toBe('0%')
  act(() => vi.advanceTimersByTime(1))
  expect(progress.style.width).toBe(`${DEFAULT_ABOUT_INTRO.progress[0].percent}%`)
})

test('pratinjau tanpa animasi langsung terlihat dan penuh tanpa h-full tambahan', () => {
  const { container } = render(<AboutIntroSection animate={false} preview />)
  const wrapper = photoReveal()
  expect(wrapper.className).toBe('transition-all duration-700 ease-out opacity-100 translate-y-0 relative')
  expect(progressBar(container).style.width).toBe(`${DEFAULT_ABOUT_INTRO.progress[0].percent}%`)
  expect(wrapper.classList.contains('h-full')).toBe(false)
})

test('unmount intro membersihkan setiap observer dan timer fallback', () => {
  const { unmount } = render(<AboutIntroSection />)
  expect(vi.getTimerCount()).toBe(observers.length)
  unmount()
  expect(vi.getTimerCount()).toBe(0)
  for (const observer of observers) expect(observer.disconnect).toHaveBeenCalledTimes(1)
})
