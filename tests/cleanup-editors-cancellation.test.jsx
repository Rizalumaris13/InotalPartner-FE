import { StrictMode } from 'react'
import { beforeEach, expect, test, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import TeamMemberMultiForm from '../src/components/TeamMemberMultiForm'
import FormFAQPage from '../src/pages/FormFAQPage'
import FormTestimonialPage from '../src/pages/FormTestimonialPage'
import CreateAboutPage from '../src/pages/CreateAboutPage'
import * as about from '../src/api/about'
import * as testimonials from '../src/api/testimonials'

function deferred() {
  let resolve
  const promise = new Promise((done) => { resolve = done })
  return { promise, resolve }
}

beforeEach(() => {
  localStorage.setItem('inotal_token', 'cleanup-lifecycle-fixture-not-real')
  localStorage.setItem('inotal_user', JSON.stringify({ role: 'admin' }))
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: vi.fn() })
})

test('StrictMode discarded multi-form load cannot reassign orders after the live load', async () => {
  const abandoned = deferred()
  const current = deferred()
  const list = vi.spyOn(about, 'getTeamMembersApi').mockReturnValueOnce(abandoned.promise).mockReturnValueOnce(current.promise)
  render(<StrictMode><TeamMemberMultiForm /></StrictMode>)
  expect(list).toHaveBeenCalledTimes(2)
  await act(async () => { current.resolve([{ display_order: 1, is_active: true }]) })
  expect(screen.getAllByRole('spinbutton').map((input) => input.value)).toEqual(['2', '3', '4', '5'])
  await act(async () => { abandoned.resolve([{ display_order: 2, is_active: true }]) })
  expect(screen.getAllByRole('spinbutton').map((input) => input.value)).toEqual(['2', '3', '4', '5'])
})

test('StrictMode discarded FAQ response cannot replace the live detail', async () => {
  const abandoned = deferred()
  const current = deferred()
  vi.spyOn(about, 'getAboutFAQByIdApi').mockReturnValueOnce(abandoned.promise).mockReturnValueOnce(current.promise)
  render(<StrictMode><FormFAQPage editingFAQ={{ id: 1 }} /></StrictMode>)
  await act(async () => { current.resolve({ question: 'Current', answer: 'Current answer' }) })
  await act(async () => { abandoned.resolve({ question: 'Abandoned', answer: 'Old answer' }) })
  expect(screen.getByDisplayValue('Current')).not.toBeNull()
  expect(screen.queryByDisplayValue('Abandoned')).toBeNull()
})

test('StrictMode discarded testimonial load cannot replace complete detail', async () => {
  const abandoned = deferred()
  const current = deferred()
  vi.spyOn(testimonials, 'getTestimonialByIdApi').mockReturnValueOnce(abandoned.promise).mockReturnValueOnce(current.promise)
  render(<StrictMode><FormTestimonialPage editingTestimonial={{ id: 1 }} /></StrictMode>)
  await act(async () => { current.resolve({ name: 'Current', content: 'Current content' }) })
  await act(async () => { abandoned.resolve({ name: 'Abandoned', content: 'Old content' }) })
  expect(screen.getByDisplayValue('Current')).not.toBeNull()
  expect(screen.queryByDisplayValue('Abandoned')).toBeNull()
})

test('unmounted About title load cannot update a remounted title or start its member list', async () => {
  const oldTitle = deferred()
  vi.spyOn(about, 'getAboutSettingApi').mockReturnValueOnce(oldTitle.promise).mockResolvedValue({ team_title: 'Current title' })
  const list = vi.spyOn(about, 'getTeamMembersApi').mockResolvedValue([])
  const { unmount } = render(<CreateAboutPage />)
  unmount()
  render(<CreateAboutPage />)
  await screen.findByDisplayValue('Current title')
  await act(async () => { oldTitle.resolve({ team_title: 'Old title' }) })
  expect(screen.getByDisplayValue('Current title')).not.toBeNull()
  expect(screen.queryByDisplayValue('Old title')).toBeNull()
  expect(list).toHaveBeenCalledOnce()
})
