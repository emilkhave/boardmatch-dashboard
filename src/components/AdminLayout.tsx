import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { Avatar } from './ui'
import {
  IconGrid,
  IconBuilding,
  IconUsers,
  IconFlow,
  IconSpark,
  IconLogout,
} from './icons'

const nav = [
  { to: '/admin', label: 'Overview', icon: IconGrid, end: true },
  { to: '/admin/companies', label: 'Companies', icon: IconBuilding },
  { to: '/admin/candidates', label: 'Candidates', icon: IconUsers },
  { to: '/admin/matches', label: 'Pipeline', icon: IconFlow },
  { to: '/admin/intake', label: 'Intake & Zoho', icon: IconSpark },
]

export function AdminLayout() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-sand-100">
      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-ink-200/60 bg-white lg:flex">
        <div className="flex items-center gap-2.5 px-6 py-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-700 font-display text-lg font-semibold text-white">
            B
          </span>
          <div>
            <div className="text-sm font-semibold tracking-tight text-ink-900">BoardMatch</div>
            <div className="text-[11px] text-ink-400">Admin workspace</div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-accent-50 text-accent-800'
                    : 'text-ink-600 hover:bg-ink-50 hover:text-ink-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon
                    width={19}
                    height={19}
                    className={isActive ? 'text-accent-600' : 'text-ink-400'}
                  />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-ink-100 p-3">
          <div className="flex items-center gap-3 rounded-xl px-2 py-2">
            <Avatar name={session?.name ?? 'Emil'} color="#27534b" size="sm" />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-medium text-ink-900">{session?.name}</div>
              <div className="truncate text-xs text-ink-400">{session?.email}</div>
            </div>
            <button
              onClick={handleLogout}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-ink-400 transition hover:bg-ink-100 hover:text-ink-700"
              title="Sign out"
            >
              <IconLogout width={17} height={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main column ────────────────────────────────────────────── */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-ink-200/60 bg-white px-5 py-3 lg:hidden">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-700 font-display text-base font-semibold text-white">
              B
            </span>
            <span className="text-sm font-semibold">BoardMatch</span>
          </div>
          <button onClick={handleLogout} className="btn-ghost px-2 py-1.5">
            <IconLogout width={18} height={18} />
          </button>
        </header>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

// Shared page wrapper for consistent padding + heading.
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 border-b border-ink-200/60 bg-white px-6 py-6 sm:flex-row sm:items-end sm:justify-between lg:px-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-ink-500">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  )
}
