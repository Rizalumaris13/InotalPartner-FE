import { expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GoogleLoginButton from '../src/components/GoogleLoginButton'
import PasswordField from '../src/components/PasswordField'

test('GoogleLoginButton forwards clicks and respects disabled without changing its content', async () => {
  const onClick = vi.fn()
  const view = render(<GoogleLoginButton onClick={onClick} disabled={false} />)
  const user = userEvent.setup()
  const button = screen.getByRole('button', { name: 'Continue with Google' })
  await user.click(button)
  expect(onClick).toHaveBeenCalledOnce()
  view.rerender(<GoogleLoginButton onClick={onClick} disabled />)
  await user.click(button)
  expect(onClick).toHaveBeenCalledOnce()
  expect(button.disabled).toBe(true)
})

test('PasswordField keeps visibility controlled by the owner and its toggle never submits the form', async () => {
  const onToggle = vi.fn()
  const onChange = vi.fn()
  const onSubmit = vi.fn((event) => event.preventDefault())
  const props = { label: 'Password Saat Ini', placeholder: 'Masukkan password saat ini', value: 'fixture', onChange, visible: false, onToggle }
  const view = render(<form onSubmit={onSubmit}><PasswordField {...props} /></form>)
  const user = userEvent.setup()
  const input = screen.getByPlaceholderText('Masukkan password saat ini')
  expect(input.type).toBe('password')
  expect(input.required).toBe(true)
  expect(screen.getByText('Password Saat Ini').tagName).toBe('LABEL')
  const toggle = screen.getByRole('button')
  expect(toggle.getAttribute('type')).toBe('button')
  await user.click(toggle)
  expect(onToggle).toHaveBeenCalledOnce()
  expect(onSubmit).not.toHaveBeenCalled()
  expect(input.type).toBe('password')
  view.rerender(<form onSubmit={onSubmit}><PasswordField {...props} visible /></form>)
  expect(input.type).toBe('text')
  await user.type(input, 'x')
  expect(onChange).toHaveBeenCalledOnce()
  expect(onSubmit).not.toHaveBeenCalled()
})
