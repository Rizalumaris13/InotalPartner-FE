import { useState } from 'react'
import { Eye, EyeOff, CheckCircle2, Loader2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import GoogleLoginButton from '../components/GoogleLoginButton'

export default function RegisterPage({ onNavigate }) {
  const [showPassword, setShowPassword]   = useState(false)
  const [showConfirm, setShowConfirm]     = useState(false)
  const [agreed, setAgreed]               = useState(false)
  const [form, setForm] = useState({
    fullName: '',
    company: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [formError, setFormError] = useState(null)

  const { register, googleLogin, loading, error, setError } = useAuth()

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }))
    setFormError(null)
    setError(null)
  }

  // Validasi sisi FE sebelum kirim ke BE
  const validate = () => {
    if (!form.fullName.trim()) return 'Nama lengkap wajib diisi'
    if (!form.company.trim())  return 'Nama perusahaan wajib diisi'
    if (!form.email.trim())    return 'Email wajib diisi'
    if (form.password.length < 8) return 'Password minimal 8 karakter'
    if (form.password !== form.confirmPassword) return 'Password dan konfirmasi tidak cocok'
    if (!agreed) return 'Harap setujui syarat & ketentuan'
    return null
  }

  // Submit register
  const handleRegister = async () => {
    const validationErr = validate()
    if (validationErr) {
      setFormError(validationErr)
      return
    }
    try {
      await register({
        fullName: form.fullName,
        company:  form.company,
        email:    form.email,
        password: form.password,
      })
      onNavigate?.('dashboard')
    } catch {
      // error sudah di-set oleh hook
    }
  }

  const displayError = formError || error
  const perks = [
    'Access to the full INOTAL service portfolio',
    'Dedicated partnership manager',
    'Real-time collaboration dashboard',
  ]

  return (
    <div className="min-h-screen flex font-sans">

      {/* ── LEFT PANEL ── */}
      <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-sky-900">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-800/90 via-sky-600/70 to-sky-400/60 z-10" />
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: 'linear-gradient(#ffffff 1px, transparent 1px), linear-gradient(90deg, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />
        <div className="absolute top-1/3 left-1/4 w-72 h-72 bg-white/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/3 w-56 h-56 bg-sky-200/20 rounded-full blur-[70px]" />

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
            <h2 className="text-white text-2xl font-extrabold leading-snug mb-6">
              Join the INOTAL <br />
              <span className="text-sky-200">Partner Network</span>
            </h2>
            <div className="space-y-4">
              {perks.map((perk) => (
                <div key={perk} className="flex items-start gap-3">
                  <CheckCircle2 size={18} className="text-sky-300 mt-0.5 shrink-0" />
                  <p className="text-white/80 text-sm leading-relaxed">{perk}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 w-fit">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/80 text-xs font-medium">120+ active partners worldwide</span>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
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
            <span className="text-sm text-gray-500">Already have an account?</span>
            <button
              onClick={() => onNavigate?.('login')}
              className="text-sm font-semibold border border-gray-300 hover:border-sky-400 hover:text-sky-600 text-gray-700 px-5 py-2 rounded-full transition-all"
            >
              Log In
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 rounded-full bg-sky-100 border-2 border-sky-200 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-sky-300" />
              </div>
            </div>

            <h1 className="text-2xl font-extrabold text-gray-900 text-center mb-1">Create an account</h1>
            <p className="text-sm text-gray-400 text-center mb-8">
              Register your organization to start a partnership
            </p>

            {/* ── Error alert ── */}
            {displayError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
                {displayError}
              </div>
            )}

            <div className="space-y-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={handleChange('fullName')}
                  placeholder="John Doe"
                  disabled={loading}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>

              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Company / Organization</label>
                <input
                  type="text"
                  value={form.company}
                  onChange={handleChange('company')}
                  placeholder="PT Example Indonesia"
                  disabled={loading}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  placeholder="you@company.com"
                  disabled={loading}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition disabled:opacity-50 disabled:bg-gray-50"
                />
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={handleChange('password')}
                    placeholder="Min. 8 characters"
                    disabled={loading}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition pr-20 disabled:opacity-50 disabled:bg-gray-50"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="text-xs">{showPassword ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm Password</label>
                <div className="relative">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={handleChange('confirmPassword')}
                    placeholder="Re-enter your password"
                    disabled={loading}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent transition pr-20 disabled:opacity-50 disabled:bg-gray-50"
                  />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    <span className="text-xs">{showConfirm ? 'Hide' : 'Show'}</span>
                  </button>
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-3 pt-1">
                <input
                  id="terms"
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-sky-500 rounded cursor-pointer shrink-0"
                />
                <label htmlFor="terms" className="text-xs text-gray-500 leading-relaxed cursor-pointer">
                  By creating an account, I agree to the{' '}
                  <a href="#" className="underline text-sky-500 hover:text-sky-600">Terms of Use</a>{' '}
                  and{' '}
                  <a href="#" className="underline text-sky-500 hover:text-sky-600">Privacy Policy</a>.
                </label>
              </div>

              {/* Submit */}
              <button
                onClick={handleRegister}
                disabled={loading || !agreed}
                className={`w-full flex items-center justify-center gap-2 font-semibold py-3.5 rounded-xl transition-all text-sm mt-1
                  ${agreed && !loading
                    ? 'bg-sky-500 hover:bg-sky-600 text-white shadow-lg shadow-sky-100'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Creating account...
                  </>
                ) : (
                  'Create Account'
                )}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 my-1">
                <div className="flex-1 h-px bg-gray-100" />
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>

              {/* Google */}
              <GoogleLoginButton onClick={googleLogin} disabled={loading} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}