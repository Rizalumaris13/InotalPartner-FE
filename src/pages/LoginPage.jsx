import { useState } from 'react'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function LoginPage({ onNavigate }) {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail]               = useState('')
  const [password, setPassword]         = useState('')

  const { login, googleLogin, loading, error, setError } = useAuth()

  // Submit login 
  const handleLogin = async () => {
    if (!email || !password) {
      setError('Email dan password wajib diisi')
      return
    }
    try {
      await login(email, password)
      onNavigate?.('dashboard')
    } catch {
      // error sudah di-set oleh hook, tidak perlu apa-apa di sini
    }
  }

  // Submit saat tekan Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin()
  }

  return (
    <div className="min-h-screen flex font-sans">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-sky-900">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-800/90 via-sky-600/70 to-sky-400/60 z-10" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-white/10 rounded-full blur-[80px]" />
        <div className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-sky-200/20 rounded-full blur-[60px]" />

        <div className="relative z-20 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigate?.('landing')}>
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center border border-white/30">
              <span className="text-white font-extrabold text-xs tracking-tight">IN</span>
            </div>
            <span className="font-extrabold text-xl text-white tracking-tight">
              INOTAL <span className="text-sky-400">PARTNER</span>
            </span>
          </div>

          <div>
            <blockquote className="text-white/90 text-2xl font-bold leading-snug mb-4">
              "Grow together through{' '}
              <span className="text-sky-200">trusted partnerships</span>{' '}
              and technology."
            </blockquote>
            <p className="text-white/60 text-sm">
              Join hundreds of organizations building the future with INOTAL.
            </p>
          </div>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium">Platform active 24/7</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col bg-white">
        {/* Top bar */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
          <div className="flex lg:hidden items-center gap-2 cursor-pointer" onClick={() => onNavigate?.('landing')}>
            <div className="w-7 h-7 rounded-lg bg-sky-500 flex items-center justify-center">
              <span className="text-white font-extrabold text-[10px]">IN</span>
            </div>
            <span className="font-extrabold text-base text-gray-900">
              INOTAL <span className="text-sky-400">PARTNER</span>
            </span>
          </div>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500">Don't have an account?</span>
            <button
              onClick={() => onNavigate?.('register')}
              className="text-sm font-semibold border border-gray-300 hover:border-sky-400 hover:text-sky-600 text-gray-700 px-5 py-2 rounded-full transition-all"
            >
              Sign up
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-sky-100 border-2 border-sky-200 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-sky-300" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-1">Welcome back</h1>
            <p className="text-sm text-gray-400 text-center mb-8">
              Sign in to your INOTAL PARTNER account
            </p>

            {/* Error alert */}
            {error && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {error}
              </div>
            )}

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null) }}
                  onKeyDown={handleKeyDown}
                  placeholder="you@company.com"
                  disabled={loading}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-sm font-medium text-gray-700">Password</label>
                  <button className="text-xs text-sky-500 hover:text-sky-600 font-medium transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(null) }}
                    onKeyDown={handleKeyDown}
                    placeholder="••••••••"
                    disabled={loading}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition pr-20 disabled:opacity-50 disabled:bg-gray-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="text-xs">{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleLogin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-sky-500 hover:bg-sky-600 disabled:bg-sky-300 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-sky-100 text-sm mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Log In'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Google */}
              <GoogleLoginButton onClick={googleLogin} disabled={loading} />
            </div>

            <p className="text-center text-xs text-gray-400 mt-8">
              By logging in, you agree to our{' '}
              <a href="#" className="underline hover:text-sky-500 transition-colors">Terms of Use</a>{' '}
              and{' '}
              <a href="#" className="underline hover:text-sky-500 transition-colors">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}