import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function AuthCallback() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    async function handleCallback() {
      try {
        // Exchange the code for a session
        const { data, error: authError } = await supabase.auth.getSession()

        if (authError) {
          setError(authError.message)
          return
        }

        if (!data.session) {
          // Wait a moment for the session to be established
          await new Promise(resolve => setTimeout(resolve, 1000))
          const { data: retryData } = await supabase.auth.getSession()
          if (!retryData.session) {
            setError('Authentication failed. Please try again.')
            return
          }
        }

        const session = data.session!
        const user = session.user

        // Check if a profile already exists
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', user.id)
          .single()

        // If no profile, create one (first-time Google login)
        if (!existingProfile) {
          const fullName =
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split('@')[0] ||
            'New User'

          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: fullName,
              role: 'Team_Member',
              permission_level: 'member',
              is_hidden: false,
              is_active: true,
            })

          if (profileError) {
            console.error('Profile creation error:', profileError)
            // Profile might already exist due to race condition â that's ok
          }
        }

        navigate('/dashboard', { replace: true })
      } catch (err) {
        console.error('Auth callback error:', err)
        setError('Something went wrong during sign-in.')
      }
    }

    handleCallback()
  }, [navigate])

  if (error) {
    return (
      <div className="min-h-screen bg-cult-black flex items-center justify-center p-4">
        <div className="text-center">
          <p className="text-cult-red-bright text-sm font-mono mb-4">{error}</p>
          <button
            onClick={() => navigate('/login')}
            className="btn-primary px-6 py-2 text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-cult-black flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border border-cult-gold/40 rounded-sm flex items-center justify-center mx-auto mb-4">
          <span className="font-display text-cult-gold text-2xl">C</span>
        </div>
        <div className="font-mono text-xs text-cult-text tracking-[0.4em] animate-pulse">
          AUTHENTICATING...
        </div>
      </div>
    </div>
  )
}
