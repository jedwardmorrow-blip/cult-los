import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import { ForgotPassword } from './ForgotPassword';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { signIn, signInWithGoogle } = useAuth();

  if (showForgotPassword) {
    return <ForgotPassword onBack={() => setShowForgotPassword(false)} />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-cult-black">
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `url("/cult-logo-outline.png")`,
          backgroundRepeat: 'repeat',
          backgroundSize: '120px 120px',
          backgroundPosition: '0 0'
        }}
      />
      <div className="bg-cult-graphite/95 backdrop-blur-sm border border-cult-charcoal rounded-cult shadow-glow-strong w-full max-w-md p-8 relative z-10 animate-slide-in">
        <div className="text-center mb-8">
          <img
            src="/cult-logo-white-320.png"
            alt="Cult Cannabis Logo"
            className="w-32 h-32 mx-auto hover:scale-105 transition-transform duration-300"
          />
          <p className="text-cult-silver -mt-3 text-caption uppercase tracking-wider">Operations Management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-cult-red/10 border border-cult-red rounded-cult p-3 flex items-start gap-2 animate-flicker">
              <AlertCircle className="w-5 h-5 text-cult-red flex-shrink-0 mt-0.5" />
              <p className="text-cult-off-white text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-cult-off-white mb-2">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cult-silver" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 bg-cult-black border border-cult-charcoal rounded-cult text-cult-off-white placeholder-cult-silver focus:outline-none focus:border-cult-red focus:ring-2 focus:ring-cult-red/50 transition-all duration-300"
                placeholder="you@example.com"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-cult-off-white">
                Password
              </label>
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-cult-silver hover:text-cult-off-white transition-colors duration-300"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-cult-silver" />
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full pl-10 pr-4 py-3 bg-cult-black border border-cult-charcoal rounded-cult text-cult-off-white placeholder-cult-silver focus:outline-none focus:border-cult-red focus:ring-2 focus:ring-cult-red/50 transition-all duration-300"
                placeholder="Enter your password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full bg-cult-off-white text-cult-black py-3 rounded-cult font-medium uppercase tracking-wider hover:bg-white hover:shadow-glow transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-cult-charcoal" />
          <span className="text-cult-silver text-xs uppercase tracking-wider">or</span>
          <div className="flex-1 h-px bg-cult-charcoal" />
        </div>

        <button
          onClick={async () => {
            setError('');
            setGoogleLoading(true);
            try {
              await signInWithGoogle();
            } catch (err: any) {
              setError(err.message || 'Google sign-in failed');
              setGoogleLoading(false);
            }
          }}
          disabled={loading || googleLoading}
          className="w-full flex items-center justify-center gap-3 bg-cult-black border border-cult-charcoal text-cult-off-white py-3 rounded-cult font-medium hover:border-cult-silver hover:bg-cult-graphite transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          {googleLoading ? 'Redirecting...' : 'Sign in with Google'}
        </button>

        <div className="mt-6 text-center">
          <p className="text-caption text-cult-silver">
            Contact your administrator for account access
          </p>
        </div>
      </div>
    </div>
  );
}
