import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { fetchBrand } from '../lib/api'
import { IconGrid, IconBuilding, IconArrowRight, IconCheck } from '../components/icons'
import type { Role } from '../types'

export function Login() {
  const { configured, session, signIn, signUp, loginMock } = useAuth()
  const { companies } = useData()
  const navigate = useNavigate()

  // Once authenticated, route to the right dashboard.
  useEffect(() => {
    if (session) navigate(session.role === 'admin' ? '/admin' : '/company', { replace: true })
  }, [session, navigate])

  if (!configured) return <MockLogin companies={companies} loginMock={loginMock} navigate={navigate} />

  return <RealAuth signIn={signIn} signUp={signUp} />
}

// ── Real Supabase auth ──────────────────────────────────────────────────────
function RealAuth({
  signIn,
  signUp,
}: {
  signIn: (e: string, p: string) => Promise<{ error?: string }>
  signUp: (p: any) => Promise<{ error?: string }>
}) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin')
  const [role, setRole] = useState<Role>('company')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [website, setWebsite] = useState('')
  const [contactRole, setContactRole] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    if (!email.trim() || !password) {
      setError('Enter your email and password.')
      return
    }
    setBusy(true)
    if (mode === 'signin') {
      const { error } = await signIn(email.trim(), password)
      setBusy(false)
      if (error) setError(error)
      // success → the session effect navigates.
      return
    }
    // Sign up
    if (role === 'company' && !companyName.trim()) {
      setBusy(false)
      setError('Enter your company name.')
      return
    }
    let brandColor: string | undefined
    let logoUrl: string | undefined
    if (role === 'company' && website.trim()) {
      const b = await fetchBrand(website.trim())
      if (b) {
        brandColor = b.brandColor
        logoUrl = b.logoUrl
      }
    }
    const { error } = await signUp({
      email: email.trim(),
      password,
      role,
      name: name.trim() || companyName.trim() || email.trim(),
      companyName: companyName.trim(),
      website: website.trim(),
      brandColor,
      logoUrl,
      role_title: contactRole.trim(),
    } as any)
    setBusy(false)
    if (error) {
      setError(error)
      return
    }
    setNotice(
      'Account created. If email confirmation is on, confirm via the email we sent, then sign in.',
    )
    setMode('signin')
  }

  return (
    <Shell>
      <h2 className="text-2xl font-semibold tracking-tight text-ink-900">
        {mode === 'signin' ? 'Welcome back' : 'Create your account'}
      </h2>
      <p className="mt-1 text-sm text-ink-500">
        {mode === 'signin' ? 'Sign in to your dashboard.' : 'Set up your secure login.'}
      </p>

      {/* Mode toggle */}
      <div className="mt-6 inline-flex w-full rounded-xl border border-ink-200 bg-white p-1">
        {(['signin', 'signup'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => {
              setMode(m)
              setError('')
              setNotice('')
            }}
            className={`flex-1 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              mode === m ? 'bg-accent-700 text-white' : 'text-ink-500 hover:text-ink-800'
            }`}
          >
            {m === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {mode === 'signup' && (
          <div className="grid grid-cols-2 gap-3">
            <RoleTile active={role === 'company'} onClick={() => setRole('company')} icon={<IconBuilding />} title="Company" subtitle="Recruiting a board" />
            <RoleTile active={role === 'admin'} onClick={() => setRole('admin')} icon={<IconGrid />} title="Admin" subtitle="Full overview" />
          </div>
        )}

        {mode === 'signup' && role === 'company' && (
          <div className="animate-fade-in space-y-4">
            <Field label="Company name *">
              <input className="input" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Acme A/S" />
            </Field>
            <Field label="Company website">
              <input className="input" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="acme.com" />
              <p className="mt-1 inline-flex items-center gap-1 text-xs text-ink-400">
                <IconCheck width={12} height={12} /> We’ll auto-apply your logo &amp; brand color.
              </p>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Your name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
              <Field label="Your role"><input className="input" value={contactRole} onChange={(e) => setContactRole(e.target.value)} /></Field>
            </div>
          </div>
        )}
        {mode === 'signup' && role === 'admin' && (
          <Field label="Your name"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
        )}

        <Field label="Email">
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </Field>
        <Field label="Password">
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'signin' ? 'current-password' : 'new-password'} placeholder={mode === 'signup' ? 'At least 6 characters' : ''} />
        </Field>

        {error && <p className="text-sm font-medium text-rose-600">{error}</p>}
        {notice && <p className="rounded-lg bg-accent-50 px-3 py-2 text-sm text-accent-800">{notice}</p>}

        <button type="submit" className="btn-primary w-full" disabled={busy}>
          {busy ? 'Please wait…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          {!busy && <IconArrowRight width={16} height={16} />}
        </button>
      </form>
    </Shell>
  )
}

// ── Legacy mock login (only when Supabase isn't configured) ─────────────────
function MockLogin({
  companies,
  loginMock,
  navigate,
}: {
  companies: { id: string; name: string; contactName: string; contactEmail: string }[]
  loginMock: (s: any) => void
  navigate: (to: string) => void
}) {
  const [role, setRole] = useState<Role>('admin')
  const [companyId, setCompanyId] = useState(companies[0]?.id ?? '')
  const company = companies.find((c) => c.id === companyId)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (role === 'admin') {
      loginMock({ role: 'admin', name: 'Emil Sørensen', email: 'emil@boardmatch.dk' })
      navigate('/admin')
    } else if (company) {
      loginMock({ role: 'company', companyId, name: company.contactName, email: company.contactEmail })
      navigate('/company')
    }
  }

  return (
    <Shell>
      <h2 className="text-2xl font-semibold tracking-tight text-ink-900">Welcome back</h2>
      <p className="mt-1 text-sm text-ink-500">Demo sign-in (real auth is being configured).</p>
      <div className="mt-7 grid grid-cols-2 gap-3">
        <RoleTile active={role === 'admin'} onClick={() => setRole('admin')} icon={<IconGrid />} title="Emil — Admin" subtitle="Full overview" />
        <RoleTile active={role === 'company'} onClick={() => setRole('company')} icon={<IconBuilding />} title="Company" subtitle="Your pipeline" />
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        {role === 'company' && (
          <Field label="Select your company">
            <select className="input appearance-none" value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
              {companies.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        )}
        <button type="submit" className="btn-primary w-full">
          {role === 'admin' ? 'Enter admin dashboard' : 'Enter company dashboard'}
          <IconArrowRight width={16} height={16} />
        </button>
      </form>
    </Shell>
  )
}

// ── Shared chrome ────────────────────────────────────────────────────────────
function Shell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-accent-800 p-12 text-white lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, rgba(255,255,255,0.25), transparent 40%), radial-gradient(circle at 80% 70%, rgba(127,188,176,0.4), transparent 45%)',
          }}
        />
        <div className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 font-display text-lg font-semibold">B</span>
          <span className="text-lg font-semibold tracking-tight">BoardMatch</span>
        </div>
        <div className="relative max-w-md">
          <h1 className="font-display text-4xl font-semibold leading-tight">The right people, around the right tables.</h1>
          <p className="mt-4 text-accent-100">The internal platform for curating, tracking and placing exceptional board members across the Nordics.</p>
          <ul className="mt-8 space-y-3 text-sm text-accent-50">
            {['Your own secure account', 'Your pipeline, in your brand', 'Real candidate data, synced'].map((line) => (
              <li key={line} className="flex items-center gap-3">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white/15"><IconCheck width={14} height={14} /></span>
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-accent-200">© 2026 BoardMatch · Board-matching platform</p>
      </div>

      <div className="flex w-full items-center justify-center bg-sand-50 px-6 py-12 lg:w-1/2">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2.5 text-accent-800">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-700 font-display text-lg font-semibold text-white">B</span>
              <span className="text-lg font-semibold tracking-tight">BoardMatch</span>
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  )
}

function RoleTile({ active, onClick, icon, title, subtitle }: { active: boolean; onClick: () => void; icon: React.ReactNode; title: string; subtitle: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
        active ? 'border-accent-400 bg-accent-50 shadow-sm ring-1 ring-accent-200' : 'border-ink-200 bg-white hover:border-ink-300 hover:bg-sand-50'
      }`}
    >
      <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${active ? 'bg-accent-600 text-white' : 'bg-ink-100 text-ink-500'}`}>{icon}</span>
      <span className="text-sm font-semibold text-ink-900">{title}</span>
      <span className="text-xs text-ink-400">{subtitle}</span>
    </button>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="label">{label}</span>
      {children}
    </div>
  )
}
