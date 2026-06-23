import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { Avatar } from './ui'
import { brandThemeVars, logoCandidates, domainFromWebsite } from '../lib/brand'
import { IconLogout, IconFlow, IconSettings } from './icons'

export function CompanyLayout() {
  const { session, signOut } = useAuth()
  const navigate = useNavigate()
  const { getCompany } = useData()

  const company = session?.companyId ? getCompany(session.companyId) : undefined

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  if (!company) {
    return (
      <div className="grid min-h-screen place-items-center bg-sand-100">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ink-200 border-t-accent-600" />
      </div>
    )
  }

  const navItems = [
    { to: '/company', label: 'Pipeline', icon: IconFlow, end: true },
    { to: '/company/settings', label: 'Settings', icon: IconSettings, end: false },
  ]

  // Theme the whole dashboard in the company's brand color + logo.
  const themeVars = brandThemeVars(company.brandColor ?? company.logoColor)
  const domain = domainFromWebsite(company.website)
  const logoSrcs = company.logoUrl ? [company.logoUrl] : domain ? logoCandidates(domain) : []

  return (
    <div className="min-h-screen bg-sand-100" style={themeVars}>
      <header className="sticky top-0 z-30 border-b border-ink-200/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-5 py-3 lg:px-8">
          <Avatar name={company.name} color={company.logoColor} size="md" srcs={logoSrcs} />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink-900">{company.name}</p>
            <p className="truncate text-xs text-ink-400">Board recruitment workspace</p>
          </div>

          <nav className="ml-4 hidden items-center gap-1 sm:flex">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent-50 text-accent-800'
                      : 'text-ink-500 hover:bg-ink-50 hover:text-ink-900'
                  }`
                }
              >
                <item.icon width={16} height={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto hidden items-center gap-2 rounded-xl bg-sand-100 px-3 py-1.5 text-xs text-ink-500 sm:flex">
            <span className="font-medium text-ink-700">{session?.name}</span>
            <span className="text-ink-300">·</span>
            <span>{company.contactRole}</span>
          </div>
          <button
            onClick={handleLogout}
            className="ml-auto flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition hover:bg-ink-100 hover:text-ink-700 sm:ml-0"
            title="Sign out"
          >
            <IconLogout width={18} height={18} />
          </button>
        </div>

        {/* Mobile nav */}
        <nav className="flex items-center gap-1 border-t border-ink-100 px-3 py-2 sm:hidden">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-accent-50 text-accent-800' : 'text-ink-500 hover:bg-ink-50'
                }`
              }
            >
              <item.icon width={16} height={16} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="mx-auto max-w-[1500px] px-5 py-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  )
}
