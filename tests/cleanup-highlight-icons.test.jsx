import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import * as Icons from 'lucide-react'
import { DynamicHighlightIcon } from '../src/components/HighlightIcon'
import { HIGHLIGHT_ICON_OPTIONS, normalizeIconName, resolveLucideIconKey } from '../src/utils/highlightIcons'

describe('stored video highlight icons', () => {
  it.each([
    ['Video', 'Video'], [' video ', 'Video'], ['VIDEO', 'Video'],
    ['shield-check', 'ShieldCheck'], ['shield_check', 'ShieldCheck'],
    ['ShieldCheckIcon', 'ShieldCheckIcon'], ['rocket', 'Rocket'],
    ['not-a-real-icon', 'not-a-real-icon'], ['', 'Sparkles'],
    [null, 'Sparkles'], [undefined, 'Sparkles'], [42, 'Sparkles'],
  ])('preserves normalization of %s', (input, expected) => {
    expect(normalizeIconName(input)).toBe(expected)
  })

  it.each(['Video', 'video', 'VIDEO', 'video-icon', 'VideoIcon'])('resolves the stored %s alias to the same Lucide component', (input) => {
    expect(Icons[resolveLucideIconKey(input)]).toBe(Icons.Video)
  })

  it('keeps the full icon namespace available beyond the preset dropdown', () => {
    expect(HIGHLIGHT_ICON_OPTIONS.some((option) => option.value === 'Rocket')).toBe(false)
    expect(Icons[resolveLucideIconKey('rocket')]).toBe(Icons.Rocket)
    const { container } = render(<DynamicHighlightIcon name="rocket" size={27} className="fixture-icon" />)
    const svg = container.querySelector('svg')
    expect(svg.classList.contains('lucide-rocket')).toBe(true)
    expect(svg.classList.contains('fixture-icon')).toBe(true)
    expect(svg.getAttribute('width')).toBe('27')
  })

  it.each(['', 'missing-icon', null, 42])('renders the same Sparkles fallback for %s', (input) => {
    expect(resolveLucideIconKey(input)).toBeNull()
    const { container } = render(<DynamicHighlightIcon name={input} />)
    expect(container.querySelector('svg').classList.contains('lucide-sparkles')).toBe(true)
  })
})
