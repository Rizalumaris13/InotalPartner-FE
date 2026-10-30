import { expect, test, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import PublicFooter from '../src/components/PublicFooter'

test('footer menempatkan ikon WhatsApp dan Instagram di kolom terakhir', () => {
  render(<PublicFooter />)

  const socialNavigation = screen.getByRole('navigation', {
    name: 'Media sosial',
  })
  expect(socialNavigation.parentElement.lastElementChild).toBe(socialNavigation)
  expect(
    within(socialNavigation)
      .getAllByRole('link')
      .map((link) => link.getAttribute('aria-label')),
  ).toEqual(['WhatsApp', 'Instagram'])
  expect(screen.getAllByRole('link', { name: 'WhatsApp' })).toHaveLength(1)
  expect(screen.getAllByRole('link', { name: 'Instagram' })).toHaveLength(1)
})

test('ikon media sosial membuka tujuan sementara di tab baru dengan aman', () => {
  render(<PublicFooter />)

  const whatsapp = screen.getByRole('link', { name: 'WhatsApp' })
  const instagram = screen.getByRole('link', { name: 'Instagram' })
  expect(whatsapp.getAttribute('href')).toBe('https://web.whatsapp.com/')
  expect(instagram.getAttribute('href')).toBe('https://www.instagram.com/')
  for (const link of [whatsapp, instagram]) {
    expect(link.getAttribute('target')).toBe('_blank')
    expect(link.getAttribute('rel')).toContain('noopener')
    expect(link.getAttribute('rel')).toContain('noreferrer')
    expect(link.querySelector('svg').getAttribute('aria-hidden')).toBe('true')
  }
})

test.each([2026, 2027])('copyright footer mengikuti tahun perangkat (%i)', (year) => {
  vi.useFakeTimers()
  try {
    vi.setSystemTime(new Date(year, 5, 15))
    render(<PublicFooter />)

    expect(
      within(screen.getByRole('contentinfo')).queryByText(
        `Copyright © ${year} INOTAL Partner`,
      ),
    ).not.toBeNull()
  } finally {
    vi.useRealTimers()
  }
})
