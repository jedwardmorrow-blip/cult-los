import { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { usePermissions } from '../../hooks/usePermissions'
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  AlertCircle,
  BarChart2,
  Users,
  LogOut,
  ChevronRight,
  Building2,
  Radio,
  ShieldCheck,
  ListChecks,
  Calendar,
  Activity,
  Compass,
  Bot,
  DollarSign,
} from 'lucide-react'

interface LayoutProps {
  children: ReactNode
}

const navItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/plan', icon: Target, label: 'My 90-Day Plan' },
  { path: '/rocks', icon: BarChart2, label: 'Rocks & Scorecard' },
  { path: '/todos', icon: CheckSquare, label: 'To-Dos' },
  { path: '/my-todos', icon: ListChecks, label: 'My Checklist' },
  { path: '/calendar', icon: Calendar, label: 'Calendar' },
  { path: '/issues', icon: AlertCircle, label: 'Issues (IDS)' },
  { path: '/rooms', icon: Radio, label: 'L10 Meetings' },
  { path: '/vto', icon: Compass, label: 'V/TO' },
  { path: '/analytics', icon: Activity, label: 'Analytics' },
  { path: '/revenue', icon: DollarSign, label: 'Revenue' },
  { path: '/claude', icon: Bot, label: 'Claude AI' },
  { path: '/team', icon: Users, label: 'Team' },
]

export default function AppLayout({ children }: LayoutProps) {
  const { profile, signOut } = useAuth()
  const { isAdmin, isOwner } = usePermissions()
  const location = useLocation()
  const navigate = useNavigate()

  async function handleSignOut() {
    await signOut()
    navigate('/login')
  }

  const initials = profile?.full_name
    ? profile.full_name.split(' ').map((n: string) => n[0]).join('').toUpperCase()
    : '?'

  return (
    <div className="flex h-screen bg-cult-black overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-cult-dark border-r border-cult-border flex flex-col">
        <div className="px-4 py-5 border-b border-cult-border">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-cult-gold/40 rounded-sm flex items-center justify-center flex-shrink-0">
              <span className="font-display text-cult-gold text-lg">C</span>
            </div>
            <div>
              <div className="font-display text-cult-white text-lg tracking-widest leading-none">CULT</div>
              <div className="font-mono text-[9px] tracking-[0.3em] text-cult-gold/70 uppercase mt-0.5">Leadership OS</div>
            </div>
          </div>
        </div>

        <div className="px-3 py-3 border-b border-cult-border">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-cult-muted cursor-pointer hover:bg-cult-border transition-colors">
            <Building2 size={12} className="text-cult-gold" />
            <span className="font-mono text-xs text-cult-text flex-1">Cult Cannabis</span>
            <ChevronRight size={10} className="text-cult-text" />
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ path, icon: Icon, label }) => {
            const active = location.pathname === path
            return (
              <Link key={path} to={path} className={active ? 'nav-item-active' : 'nav-item'}>
                <Icon size={15} />
                <span className="text-xs font-medium">{label}</span>
              </Link>
            )
          })}

          {/* Admin nav item – only visible to admin/owner */}
          {(isAdmin || isOwner) && (
            <Link
              to="/admin"
              className={location.pathname === '/admin' ? 'nav-item-active' : 'nav-item'}
            >
              <ShieldCheck size={15} />
              <span className="text-xs font-medium">Admin</span>
            </Link>
          )}
        </nav>

        <div className="px-3 py-4 border-t border-cult-border">
          <div className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-cult-muted transition-colors cursor-pointer group">
            <div className="w-7 h-7 rounded-full bg-cult-gold/20 border border-cult-gold/30 flex items-center justify-center flex-shrink-0">
              <span className="font-mono text-xs text-cult-gold font-medium">{initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-cult-white truncate">{profile?.full_name || 'User'}</div>
              <div className="text-[10px] text-cult-text font-mono truncate">{profile?.role?.replace(/_/g, ' ')}</div>
            </div>
            <button onClick={handleSignOut} className="opacity-0 group-hover:opacity-100 transition-opacity">
              <LogOut size={13} className="text-cult-text hover:text-cult-red-bright transition-colors" />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden">
        <div className={`h-full ${location.pathname.startsWith('/meeting/') ? '' : 'p-8 overflow-y-auto'} animate-fade-in`}>
          {children}
        </div>
      </main>
    </div>
  )
}
