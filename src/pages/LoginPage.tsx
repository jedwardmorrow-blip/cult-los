import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn, signInWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(email, password)
    if (error) {
      setError('Invalid credentials. Contact Justin to get access.')
      setLoading(false)
    } else {
      navigate('/dashboard')
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setLoading(true)
    const { error } = await signInWithGoogle()
    if (error) {
      setError('Google sign-in failed. Try again or use email/password.')
      setLoading(false)
    }
    // On success, Supabase redirects to /auth/callback â no navigate needed
  }

  return (
    <div className="min-h-screen bg-cult-black flex items-center justify-center p-4">
      <div
        className="fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A84B 1px, transparent 0)',
          backgroundSize: '32px 32px',
        }}
      />

      <div className="w-full max-w-sm relative animate-fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 border border-cult-gold/40 rounded-sm flex items-center justify-center mb-2">
              <span className="font-display text-cult-gold text-2xl tracking-widest">C</span>
            </div>
            <h1 className="font-display text-5xl tracking-[0.3em] text-cult-white">CULT</h1>
            <span className="font-mono text-xs tracking-[0.4em] text-cult-gold uppercase">
              Leadership OS
            </span>
          </div>
        </div>

        {/* Google Sign-In */}
        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-cult-dark border border-cult-border rounded-md hover:border-cult-gold/40 transition-colors disabled:opacity-50 mb-6 group"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          <span className="text-sm font-medium text-cult-white group-hover:text-cult-gold transition-colors">
            Sign in with Google
          </span>
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-cult-border" />
          <span className="text-[10px] font-mono text-cult-text uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-cult-border" />
        </div>

        {/* Email/Password */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono tracking-wider text-cult-text uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="you@cultcannabis.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono tracking-wider text-cult-text uppercase mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              placeholder="â¢â¢â¢â¢â¢â¢â¢â¢"
              required
            />
          </div>

          {error && (
            <p className="text-cult-red-bright text-xs font-mono text-center animate-fade-in">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full mt-6 py-3 text-base tracking-wider font-display uppercase disabled:opacity-50"
          >
            {loading ? 'Entering...' : 'Enter'}
          </button>
        </form>

        <p className="text-center text-cult-text text-xs font-mono mt-8 tracking-wider">
          Access restricted to leadership team
        </p>
      </div>
    </div>
  )
}
