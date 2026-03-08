import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

export default function LoginPage() {
  const { signIn } = useAuth()
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

  return (
    <div className="min-h-screen bg-cult-black flex items-center justify-center p-4">
      <div className="fixed inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #C8A84B 1px, transparent 0)', backgroundSize: '32px 32px' }} />

      <div className="w-full max-w-sm relative animate-fade-in">
        <div className="text-center mb-12">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="w-12 h-12 border border-cult-gold/40 rounded-sm flex items-center justify-center mb-2">
              <span className="font-display text-cult-gold text-2xl tracking-widest">C</span>
            </div>
            <h1 className="font-display text-5xl tracking-[0.3em] text-cult-white">CULT</h1>
            <span className="font-mono text-xs tracking-[0.4em] text-cult-gold uppercase">Leadership OS</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono tracking-wider text-cult-text uppercase mb-2">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="you@cultcannabis.com" required />
          </div>
          <div>
            <label className="block text-xs font-mono tracking-wider text-cult-text uppercase mb-2">Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" placeholder="••••••••" required />
          </div>
          {error && <p className="text-cult-red-bright text-xs font-mono text-center animate-fade-in">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full mt-6 py-3 text-base tracking-wider font-display uppercase disabled:opacity-50">
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