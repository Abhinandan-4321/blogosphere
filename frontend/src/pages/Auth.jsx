import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2, PenSquare, Users, BookOpen } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const brandQuotes = [
  { text: 'Writing is thinking made visible.', author: 'William Zinsser' },
  { text: 'A word after a word after a word is power.', author: 'Margaret Atwood' },
  { text: 'The first draft is just you telling yourself the story.', author: 'Terry Pratchett' },
]

export default function Auth({ mode }) {
  const [activeMode, setActiveMode] = useState(mode || 'login')
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [otpFlow, setOtpFlow] = useState(null) // { userId, method }
  const [otp, setOtp] = useState('')
  const [successMsg, setSuccessMsg] = useState('')
  const [quoteIdx, setQuoteIdx] = useState(0)
  const { login, register, verifyOtp } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIdx(i => (i + 1) % brandQuotes.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (searchParams.get('error') === 'account_deleted') {
      setError('This account has been deleted and cannot be accessed.')
    }
  }, [searchParams])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setSubmitting(true)
    try {
      if (activeMode === 'login') {
        const result = await login(form.email, form.password)
        if (result.requires2FA) {
          setOtpFlow({ userId: result.userId, method: result.method })
        } else {
          navigate('/feed')
        }
      } else {
        const result = await register(form.name, form.email, form.password, form.phone)
        setOtpFlow({ userId: result.userId, method: result.otpSentVia })
        setSuccessMsg(`Verification code sent via ${result.otpSentVia}. Please check and enter below.`)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtpSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const result = await verifyOtp(otpFlow.userId, otp, otpFlow.method)
      if (result.authenticated) {
        // Small delay to ensure user state is set before navigation
        setTimeout(() => {
          navigate(result.isNewUser ? '/choose-avatar' : '/feed')
        }, 100)
      } else {
        setSuccessMsg(result.message || 'Verified! Awaiting admin approval.')
        setOtpFlow(null)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex items-center justify-center px-4 py-4 md:px-8 md:py-8">
      <main className="w-full max-w-6xl mx-auto flex flex-col md:flex-row bg-surface-container-low rounded-[2rem] overflow-hidden shadow-[0_32px_64px_rgba(57,75,59,0.06)] min-h-[720px]">
        {/* Left Side: Brand Manifesto & Texture */}
        <section 
          className="hidden md:flex flex-col justify-between w-full md:w-1/2 p-12 text-on-primary relative overflow-hidden"
          style={{
            background: "linear-gradient(145deg, rgba(80, 99, 82, 0.92), rgba(57, 75, 59, 0.88)), url('https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=2727&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Brand Logo */}
          <div className="z-10">
            <span className="font-display italic text-3xl font-light tracking-tight text-surface">Blogosphere</span>
          </div>
          
          {/* Manifesto Content */}
          <div className="z-10 mt-auto mb-8">
            <h2 className="font-headline text-5xl italic leading-tight mb-6 text-surface">The Writer's Circle</h2>
            <p className="font-body text-lg leading-relaxed text-surface/90 max-w-md">
              A curated space for thoughtful writing. We believe in breathing room for ideas, organic pacing, and the enduring power of a well-told story.
            </p>

            {/* Cycling quote */}
            <div className="mt-8 border-l-2 border-surface/30 pl-4 min-h-[64px]">
              <p className="font-headline text-base italic text-surface/80 transition-opacity duration-500">
                &ldquo;{brandQuotes[quoteIdx].text}&rdquo;
              </p>
              <p className="mt-1 text-xs text-surface/60">&mdash; {brandQuotes[quoteIdx].author}</p>
            </div>
          </div>

          {/* Floating stat cards */}
          <div className="z-10 flex gap-3">
            <div className="flex items-center gap-2 rounded-xl bg-surface/10 backdrop-blur-sm px-3.5 py-2">
              <PenSquare className="h-4 w-4 text-surface/80" />
              <span className="text-xs font-medium text-surface/90">1.2k+ Stories</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface/10 backdrop-blur-sm px-3.5 py-2">
              <Users className="h-4 w-4 text-surface/80" />
              <span className="text-xs font-medium text-surface/90">800+ Writers</span>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-surface/10 backdrop-blur-sm px-3.5 py-2">
              <BookOpen className="h-4 w-4 text-surface/80" />
              <span className="text-xs font-medium text-surface/90">50k+ Reads</span>
            </div>
          </div>
          
          {/* Decorative blob */}
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-surface/5 blur-3xl pointer-events-none" />
          <div className="absolute -top-16 -left-16 h-48 w-48 rounded-full bg-surface/5 blur-2xl pointer-events-none" />
        </section>

        {/* Right Side: Login / Registration Form */}
        <section className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-12 lg:p-16 bg-surface relative">
          {/* Decorative top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/40 via-primary-container/60 to-transparent" />

          {/* Mobile Brand Logo */}
          <div className="md:hidden mb-10 text-center">
            <span className="font-display italic text-4xl font-light tracking-tight text-on-surface">Blogosphere</span>
          </div>
          
          <div className="w-full max-w-sm mx-auto">
            {/* Welcome icon */}
            <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary-fixed/30">
              <PenSquare className="h-5 w-5 text-primary" />
            </div>

            <div className="mb-8">
              <h1 className="font-headline text-3xl font-normal mb-2">
                {activeMode === 'login' ? 'Welcome back' : 'Join the Circle'}
              </h1>
              <p className="font-body text-on-surface-variant text-sm">
                {activeMode === 'login' ? 'Enter your details to access your workspace.' : 'Request an invitation to join our community.'}
              </p>
            </div>

            {error && <div className="mt-4 rounded-xl bg-error-container px-4 py-3 text-sm text-on-error-container">{error}</div>}
            {successMsg && <div className="mt-4 rounded-xl bg-primary-fixed px-4 py-3 text-sm text-on-primary-fixed">{successMsg}</div>}

            {/* OTP verification modal */}
            {otpFlow ? (
              <form onSubmit={handleOtpSubmit} className="mt-8 space-y-4">
                <p className="text-sm text-on-surface-variant">Enter the verification code sent via <strong>{otpFlow.method}</strong>.</p>
                <input
                  type="text" value={otp} onChange={e => setOtp(e.target.value)} required maxLength={6}
                  placeholder="Enter 6-digit code" autoFocus
                  className="w-full rounded-xl bg-surface-container-highest border-none px-4 py-4 text-center text-lg tracking-widest text-on-surface placeholder-on-surface-variant/50 focus:ring-0 focus:bg-surface-container-lowest focus:outline focus:outline-1 focus:outline-outline-variant/15 transition-colors shadow-sm"
                />
                <button type="submit" disabled={submitting || otp.length < 4} className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl py-4 font-body font-medium text-base hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-sm disabled:opacity-40">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Verify Code
                </button>
                <button type="button" onClick={() => { setOtpFlow(null); setOtp(''); setError('') }} className="w-full text-sm text-on-surface-variant hover:text-on-surface">Back to login</button>
              </form>
            ) : (
            <>
            <form onSubmit={handleSubmit} className="space-y-6">
              {activeMode === 'register' && (
                <div className="space-y-2">
                  <label className="block font-label text-sm font-medium text-on-surface uppercase tracking-[0.05em]" htmlFor="name">Username</label>
                  <input
                    type="text" name="name" id="name" value={form.name} onChange={handleChange} required
                    placeholder="e.g. writercircle"
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-on-surface placeholder-on-surface-variant/50 focus:ring-0 focus:bg-surface-container-lowest focus:outline focus:outline-1 focus:outline-outline-variant/15 transition-colors shadow-sm"
                  />
                </div>
              )}
              <div className="space-y-2">
                <label className="block font-label text-sm font-medium text-on-surface uppercase tracking-[0.05em]" htmlFor="email">Email Address</label>
                <input
                  type="email" name="email" id="email" value={form.email} onChange={handleChange} required
                  placeholder="hello@example.com"
                  className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-on-surface placeholder-on-surface-variant/50 focus:ring-0 focus:bg-surface-container-lowest focus:outline focus:outline-1 focus:outline-outline-variant/15 transition-colors shadow-sm"
                />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="block font-label text-sm font-medium text-on-surface uppercase tracking-[0.05em]" htmlFor="password">Password</label>
                  {activeMode === 'login' && (
                    <a href="#" className="text-sm font-body text-primary hover:text-primary-container transition-colors">Forgot?</a>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'} name="password" id="password" value={form.password} onChange={handleChange} required
                    placeholder="••••••••"
                    className="w-full bg-surface-container-highest border-none rounded-xl px-4 py-4 text-on-surface placeholder-on-surface-variant/50 focus:ring-0 focus:bg-surface-container-lowest focus:outline focus:outline-1 focus:outline-outline-variant/15 transition-colors shadow-sm"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-4 flex items-center text-on-surface-variant/70 hover:text-on-surface">
                    <span className="material-symbols-outlined text-xl">{showPassword ? 'visibility' : 'visibility_off'}</span>
                  </button>
                </div>
              </div>

              <div className="pt-4 space-y-4">
                <button type="submit" disabled={submitting} className="w-full bg-gradient-to-br from-primary to-primary-container text-on-primary rounded-xl py-4 font-body font-medium text-base hover:opacity-90 transition-opacity flex justify-center items-center gap-2 shadow-sm disabled:opacity-40">
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {activeMode === 'login' ? 'Enter Workspace' : 'Request Invitation'}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center space-x-4 my-6">
              <div className="h-[1px] w-full bg-surface-variant"></div>
              <span className="font-body text-sm text-on-surface-variant px-2">or</span>
              <div className="h-[1px] w-full bg-surface-variant"></div>
            </div>

            <a
              href={`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`}
              className="w-full bg-surface-container-low text-on-surface rounded-xl py-4 font-body font-medium text-base hover:bg-surface-container transition-colors flex justify-center items-center gap-3"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"></path>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"></path>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"></path>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"></path>
              </svg>
              Continue with Google
            </a>

            <p className="mt-8 text-center font-body text-sm text-on-surface-variant">
              {activeMode === 'login' ? (
                <>New to the Circle? <button onClick={() => setActiveMode('register')} className="text-primary hover:text-primary-container font-medium transition-colors underline decoration-primary/30 underline-offset-4">Request an invitation</button></>
              ) : (
                <>Already have an account? <button onClick={() => setActiveMode('login')} className="text-primary hover:text-primary-container font-medium transition-colors underline decoration-primary/30 underline-offset-4">Sign in</button></>
              )}
            </p>
            </>
            )}
          </div>

          {/* Social proof strip */}
          <div className="mt-auto pt-8 hidden md:block">
            <div className="flex items-center justify-center gap-6 text-on-surface-variant/40">
              <div className="flex -space-x-2">
                {['E', 'J', 'S', 'A'].map((letter, i) => (
                  <div key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-surface bg-surface-container-high text-[10px] font-semibold text-on-surface-variant">{letter}</div>
                ))}
              </div>
              <p className="text-xs text-on-surface-variant">Join 800+ thoughtful writers</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
