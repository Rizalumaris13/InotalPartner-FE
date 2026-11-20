import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import PasswordField from '../src/components/PasswordField'
import GoogleLoginButton from '../src/components/GoogleLoginButton'

describe('shared auth control semantics', () => {
  it('connects the password label to its input and names the visibility action', () => {
    const onToggle = vi.fn()
    render(<PasswordField label="Kata sandi" value="fixture" onChange={() => {}} visible={false} onToggle={onToggle} />)
    const input = screen.getByLabelText('Kata sandi', { exact: true })
    const toggle = screen.getByRole('button', { name: 'Tampilkan kata sandi' })
    expect(toggle.getAttribute('aria-controls')).toBe(input.id)
    fireEvent.click(toggle)
    expect(onToggle).toHaveBeenCalledOnce()
  })

  it('does not submit a surrounding form while starting Google sign-in', () => {
    const onClick = vi.fn()
    const submit = vi.fn((event) => event.preventDefault())
    render(<form onSubmit={submit}><GoogleLoginButton onClick={onClick} /></form>)
    fireEvent.click(screen.getByRole('button', { name: 'Continue with Google' }))
    expect(onClick).toHaveBeenCalledOnce()
    expect(submit).not.toHaveBeenCalled()
  })
})
