import { expect, test, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import LoginPage from '../src/pages/LoginPage'
import RegisterPage from '../src/pages/RegisterPage'
import ChangePasswordPage from '../src/pages/ChangePasswordPage'
import * as authApi from '../src/api/auth'
import { server } from './setup'

const passwordPlaceholders = ['Masukkan password saat ini', 'Masukkan password baru', 'Ulangi password baru']

function passwordFields() {
  return passwordPlaceholders.map((placeholder) => screen.getByPlaceholderText(placeholder))
}

function visibilityButton(input) {
  return within(input.parentElement).getByRole('button')
}

function setPasswords(values) {
  passwordFields().forEach((input, index) => fireEvent.change(input, { target: { value: values[index] } }))
}

test('change-password visibility is independent and persists through successful field resets', async () => {
  localStorage.setItem('inotal_user', JSON.stringify({ email: 'admin@example.test', role: 'admin' }))
  const writes = []
  server.use(http.patch('*/api/users/me/password', async ({ request }) => { writes.push(await request.json()); return HttpResponse.json({}) }))
  render(<ChangePasswordPage />)
  const user = userEvent.setup()
  expect(screen.getByDisplayValue('admin@example.test').disabled).toBe(true)
  const inputs = passwordFields()
  expect(inputs.map((input) => input.type)).toEqual(['password', 'password', 'password'])
  expect(inputs.every((input) => input.required)).toBe(true)
  for (const input of inputs) expect(visibilityButton(input).getAttribute('type')).toBe('button')
  await user.click(visibilityButton(inputs[0]))
  expect(inputs.map((input) => input.type)).toEqual(['text', 'password', 'password'])
  await user.click(visibilityButton(inputs[2]))
  expect(inputs.map((input) => input.type)).toEqual(['text', 'password', 'text'])
  expect(writes).toEqual([])
  setPasswords(['lama-uji', 'baru-uji-123', 'baru-uji-123'])
  await user.click(screen.getByRole('button', { name: 'Simpan Password Baru' }))
  expect(await screen.findByText('Password berhasil diperbarui!')).not.toBeNull()
  expect(writes).toEqual([{ old_password: 'lama-uji', new_password: 'baru-uji-123', confirm_password: 'baru-uji-123' }])
  expect(passwordFields().map((input) => input.value)).toEqual(['', '', ''])
  expect(passwordFields().map((input) => input.type)).toEqual(['text', 'password', 'text'])
})

test('change-password keeps validation order, backend errors and failed drafts', async () => {
  const writes = []
  server.use(http.patch('*/api/users/me/password', async ({ request }) => { writes.push(await request.json()); return HttpResponse.json({ message: 'Password lama salah' }, { status: 400 }) }))
  render(<ChangePasswordPage />)
  const user = userEvent.setup()
  setPasswords(['lama-uji', 'short', 'beda'])
  await user.click(screen.getByRole('button', { name: 'Simpan Password Baru' }))
  expect(screen.getByText('Password baru harus minimal 8 karakter.')).not.toBeNull()
  expect(writes).toEqual([])
  setPasswords(['lama-uji', 'baru-uji-123', 'beda'])
  await user.click(screen.getByRole('button', { name: 'Simpan Password Baru' }))
  expect(screen.getByText('Konfirmasi password tidak cocok dengan password baru.')).not.toBeNull()
  expect(writes).toEqual([])
  setPasswords(['lama-uji', 'baru-uji-123', 'baru-uji-123'])
  await user.click(screen.getByRole('button', { name: 'Simpan Password Baru' }))
  expect(await screen.findByText('Password lama salah')).not.toBeNull()
  expect(passwordFields().map((input) => input.value)).toEqual(['lama-uji', 'baru-uji-123', 'baru-uji-123'])
  expect(screen.queryByText('Password berhasil diperbarui!')).toBeNull()
  expect(writes).toHaveLength(1)
})

test.each([
  { name: 'login', Page: LoginPage },
  { name: 'register', Page: RegisterPage },
])('$name Google button keeps its SVG, label and loading-independent agreement behavior', async ({ Page }) => {
  const google = vi.spyOn(authApi, 'loginWithGoogle').mockImplementation(() => {})
  const view = render(<Page />)
  const button = screen.getByRole('button', { name: 'Continue with Google' })
  expect(button.disabled).toBe(false)
  expect(button.className).toBe('w-full flex items-center justify-center gap-3 border border-gray-200 hover:border-sky-300 hover:bg-sky-50/40 text-gray-700 font-medium py-3.5 rounded-xl transition-all text-sm disabled:opacity-50')
  expect(Array.from(button.querySelectorAll('svg path')).map((path) => path.getAttribute('fill'))).toEqual(['#4285F4', '#34A853', '#FBBC05', '#EA4335'])
  expect(button.querySelector('svg').getAttribute('viewBox')).toBe('0 0 24 24')
  expect(view.container.querySelector('form')).toBeNull()
  const user = userEvent.setup()
  await user.click(button)
  expect(google).toHaveBeenCalledOnce()
})

test('login keeps empty-field errors, Show/Hide, Enter submission, raw payload, loading gates and session navigation', async () => {
  const writes = []
  let finish
  const completed = new Promise((resolve) => { finish = resolve })
  server.use(http.post('*/api/auth/login', async ({ request }) => {
    writes.push(await request.json())
    await completed
    return HttpResponse.json({ data: { token: 'login-fixture-not-real', user: { id: 1, role: 'operator' } } })
  }))
  const onNavigate = vi.fn()
  render(<LoginPage onNavigate={onNavigate} />)
  const user = userEvent.setup()
  await user.click(screen.getByRole('button', { name: 'Log In', exact: true }))
  expect(screen.getByText('Email dan password wajib diisi')).not.toBeNull()
  const email = screen.getByPlaceholderText('you@company.com')
  const password = screen.getByPlaceholderText('••••••••')
  await user.type(email, 'user@example.test')
  expect(screen.queryByText('Email dan password wajib diisi')).toBeNull()
  await user.type(password, '  password-uji  ')
  await user.click(screen.getByRole('button', { name: 'Show' }))
  expect(password.type).toBe('text')
  expect(writes).toEqual([])
  await user.click(password)
  await user.keyboard('{Enter}')
  await waitFor(() => expect(writes).toHaveLength(1))
  expect(writes).toEqual([{ email: 'user@example.test', password: '  password-uji  ' }])
  expect(email.disabled).toBe(true)
  expect(password.disabled).toBe(true)
  expect(screen.getByRole('button', { name: 'Continue with Google' }).disabled).toBe(true)
  expect(screen.getByRole('button', { name: 'Signing in...' }).disabled).toBe(true)
  // Visibility controls were not disabled while waiting for the API.
  await user.click(screen.getByRole('button', { name: 'Hide' }))
  expect(password.type).toBe('password')
  await act(async () => { finish() })
  await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('dashboard'))
  expect(localStorage.getItem('inotal_token')).toBe('login-fixture-not-real')
  await user.click(screen.getByRole('button', { name: 'Sign up' }))
  expect(onNavigate).toHaveBeenLastCalledWith('register')
})

test('login API error is displayed and cleared on input without clearing the password', async () => {
  server.use(http.post('*/api/auth/login', () => HttpResponse.json({ message: 'Login ditolak' }, { status: 400 })))
  render(<LoginPage />)
  const user = userEvent.setup()
  await user.type(screen.getByPlaceholderText('you@company.com'), 'user@example.test')
  await user.type(screen.getByPlaceholderText('••••••••'), 'password-uji')
  await user.click(screen.getByRole('button', { name: 'Log In' }))
  expect(await screen.findByText('Login ditolak')).not.toBeNull()
  expect(screen.getByPlaceholderText('••••••••').value).toBe('password-uji')
  await user.type(screen.getByPlaceholderText('••••••••'), '2')
  expect(screen.queryByText('Login ditolak')).toBeNull()
})

test('register keeps ordered validation, independent visibility, no Enter submit and untrimmed registration payload', async () => {
  const writes = []
  let finish
  const completed = new Promise((resolve) => { finish = resolve })
  server.use(http.post('*/api/auth/register', async ({ request }) => {
    writes.push(await request.json())
    await completed
    return HttpResponse.json({ data: { token: 'register-fixture-not-real', user: { id: 2, role: 'guest' } } })
  }))
  const onNavigate = vi.fn()
  render(<RegisterPage onNavigate={onNavigate} />)
  const user = userEvent.setup()
  expect(screen.getByRole('button', { name: 'Create Account' }).disabled).toBe(true)
  expect(screen.getByRole('button', { name: 'Continue with Google' }).disabled).toBe(false)
  await user.click(screen.getByRole('checkbox'))
  const submit = () => user.click(screen.getByRole('button', { name: 'Create Account' }))
  await submit()
  expect(screen.getByText('Nama lengkap wajib diisi')).not.toBeNull()
  fireEvent.change(screen.getByPlaceholderText('John Doe'), { target: { value: '  Nama Uji  ' } })
  await submit()
  expect(screen.getByText('Nama perusahaan wajib diisi')).not.toBeNull()
  fireEvent.change(screen.getByPlaceholderText('PT Example Indonesia'), { target: { value: '  PT Uji  ' } })
  await submit()
  expect(screen.getByText('Email wajib diisi')).not.toBeNull()
  fireEvent.change(screen.getByPlaceholderText('you@company.com'), { target: { value: 'user@example.test' } })
  await submit()
  expect(screen.getByText('Password minimal 8 karakter')).not.toBeNull()
  const password = screen.getByPlaceholderText('Min. 8 characters')
  const confirm = screen.getByPlaceholderText('Re-enter your password')
  await user.type(password, 'password-uji')
  await submit()
  expect(screen.getByText('Password dan konfirmasi tidak cocok')).not.toBeNull()
  await user.type(confirm, 'password-uji')
  await user.click(visibilityButton(password))
  expect(password.type).toBe('text')
  expect(confirm.type).toBe('password')
  await user.click(confirm)
  await user.keyboard('{Enter}')
  expect(writes).toEqual([])
  await submit()
  await waitFor(() => expect(writes).toHaveLength(1))
  expect(writes).toEqual([{ full_name: '  Nama Uji  ', company: '  PT Uji  ', email: 'user@example.test', password: 'password-uji' }])
  expect(screen.getByRole('button', { name: 'Continue with Google' }).disabled).toBe(true)
  expect(screen.getByRole('button', { name: 'Creating account...' }).disabled).toBe(true)
  expect(password.disabled).toBe(true)
  expect(confirm.disabled).toBe(true)
  expect(visibilityButton(confirm).disabled).toBe(false)
  await act(async () => { finish() })
  await waitFor(() => expect(onNavigate).toHaveBeenCalledWith('dashboard'))
  expect(localStorage.getItem('inotal_token')).toBe('register-fixture-not-real')
  await user.click(screen.getByRole('button', { name: 'Log In' }))
  expect(onNavigate).toHaveBeenLastCalledWith('login')
})
