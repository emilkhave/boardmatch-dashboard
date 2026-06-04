import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { mockCompanies } from '../data/mockCompanies'
import { IconGrid, IconBuilding, IconArrowRight, IconCheck } from '../components/icons'
import type { Role } from '../types'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [role, setRole] = useState<Role>('admin')
  const [companyId, setCompanyId] = useState(mockCompanies[0].id)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'admin') {
      login({ role: 'admin', name: 'Emil Sørensen', email: 'emil@boardmatch.dk' })
      navigate('/admin')
    } else {
      const company = mockCompanies.find((c) => c.id === companyId)!
      login({
        role: 'company',
        companyId,
        name: company.contactName,
        email: company.contactEmail,
      })
      navigate('/company')
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left: brand panel ─────────────────────────────────────────── */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-accent-800 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(127,188,176,0.4), transparent 45%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 font-display text-lg font-semibold">
            B
          </span>
          <span className="text-lg font-semibold tracking-tight">BoardMatch</span>
        </div>

        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight">
            The right people, around the right tables.
          </h1>
          <p className="mt-4 text-accent-100">
            BoardMatch is the internal platform for curating, tracking and placing exceptional board
            members across the Nordics.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-accent-50">
            {[
              'A live overview of every company and candidate',
              'Pipeline tracking from first contact to placement',
              'Fit scoring to surface the strongest matches',
            ].map((line) => (
              <li key={line} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15">
                  <IconCheck width={14} height={14} />
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-accent-200">
          © 2026 BoardMatch · Prototype for Emil’s board-matching practice
        </p>
      </div>

      {/* ── Right: login form ─────────────────────────────────────────── */}
      <div className="flex w-full items-center justify-center bg-sand-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5 text-accent-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-700 font-display text-lg font-semibold text-white">
                B
              </span>
              <span className="text-lg font-semibold tracking-tight">BoardMatch</span>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-ink-900">Welcome back</h2>
          <p className="mt-1 text-sm text-ink-500">Sign in to your dashboard to continue.</p>

          {/* Role selector */}
          <div className="mt-7 grid grid-cols-2 gap-3">
            <RoleTile
              active={role === 'admin'}
              onClick={() => setRole('admin')}
              icon={<IconGrid />}
              title="Emil — Admin"
              subtitle="Full overview"
            />
            <RoleTile
              active={role === 'company'}
              onClick={() => setRole('company')}
              icon={<IconBuilding />}
              title="Company"
              subtitle="Your pipeline"
            />
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            {role === 'company' && (
              <div className="animate-fade-in">
                <label className="label">Select your company</label>
                <select
                  className="input appearance-none"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                >
                  {mockCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="label">Email</label>
              <input
                className="input"
                type="email"
                value={
                  role === 'admin'
                    ? 'emil@boardmatch.dk'
                    : mockCompanies.find((c) => c.id === companyId)?.contactEmail ?? ''
                }
                readOnly
              />
            </div>
            <div>
              <label className="label">Password</label>
              <input className="input" type="password" defaultValue="demo-access" />
            </div>

            <button type="submit" className="btn-primary w-full">
              {role === 'admin' ? 'Enter admin dashboard' : 'Enter company dashboard'}
              <IconArrowRight width={16} height={16} />
            </button>
          </form>

          <p className="mt-6 rounded-xl bg-sand-100 px-4 py-3 text-center text-xs text-ink-500">
            Prototype — choose a role above and sign in. Credentials are pre-filled.
          </p>
        </div>
      </div>
    </div>
  )
}

function RoleTile({
  active,
  onClick,
  icon,
  title,
  subtitle,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  title: string
  subtitle: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
        active
          ? 'border-accent-400 bg-accent-50 shadow-sm ring-1 ring-accent-200'
          : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-sand-50'
      }`}
    >
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-lg ${
          active ? 'bg-accent-600 text-white' : 'bg-ink-100 text-ink-500'
        }`}
      >
        {icon}
      </span>
      <span className="text-sm font-semibold text-ink-900">{title}</span>
      <span className="text-xs text-ink-400">{subtitle}</span>
    </button>
  )
}
