import { useMemo, useState } from 'react'
import { useParams, useSearchParams } from 'react-router-dom'
import { useData } from '../lib/store'
import { postInterest } from '../lib/api'
import { Tag, Avatar } from '../components/ui'
import { brandThemeVars, logoCandidates, domainFromWebsite } from '../lib/brand'
import { IconCheck, IconPin, IconBriefcase, IconStar, IconArrowRight, IconSpark } from '../components/icons'

// Public, no-auth landing page. A candidate (e.g. arriving from a Zoho email)
// reviews a board opportunity and clicks "I'm interested" — which drops them into
// the Interested stage of both the company and Emil's pipelines.
export function Apply() {
  const { companyId } = useParams()
  const [params] = useSearchParams()
  const { companies, addInterest } = useData()

  // Opportunities a candidate can express interest in (active searches).
  const openCompanies = useMemo(
    () => companies.filter((c) => c.status !== 'placed'),
    [companies],
  )

  const [selectedId, setSelectedId] = useState(
    companyId && companies.some((c) => c.id === companyId) ? companyId : openCompanies[0]?.id ?? '',
  )
  const company = companies.find((c) => c.id === selectedId)

  // Pre-fill from query params — this is how a Zoho email merge would pass data.
  const [firstName, setFirstName] = useState(params.get('firstName') ?? params.get('name') ?? '')
  const [lastName, setLastName] = useState(params.get('lastName') ?? '')
  const [email, setEmail] = useState(params.get('email') ?? '')
  const [message, setMessage] = useState('')
  const prefilled = Boolean(params.get('firstName') || params.get('name') || params.get('email'))

  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Theme the landing page in the opportunity's company brand.
  const themeVars = company ? brandThemeVars(company.brandColor ?? company.logoColor) : undefined
  const logoDomain = domainFromWebsite(company?.website)
  const logoSrcs = company?.logoUrl ? [company.logoUrl] : logoDomain ? logoCandidates(logoDomain) : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!company) return
    if (!firstName.trim() || !email.trim()) {
      setError('Please enter your first name and email.')
      return
    }
    setError('')
    setSubmitting(true)

    // Real path: server matches the person in Zoho + stores them for both dashboards.
    const result = await postInterest({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      companyId: company.id,
      message: message.trim(),
    })

    // Fallback for when the backend isn't configured yet: write to the local store.
    if (!result.ok || !result.configured) {
      addInterest({
        companyId: company.id,
        name: `${firstName} ${lastName}`.trim(),
        title: '',
        email: email.trim(),
        message: message.trim(),
        source: 'landing',
      })
    }

    setSubmitting(false)
    setSubmitted(true)
  }

  return (
    <div className="min-h-screen bg-sand-100" style={themeVars}>
      {/* Brand bar */}
      <header className="border-b border-ink-200/60 bg-white">
        <div className="mx-auto flex max-w-3xl items-center gap-2.5 px-5 py-4">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-700 font-display text-lg font-semibold text-white">
            B
          </span>
          <span className="text-lg font-semibold tracking-tight text-ink-900">BoardMatch</span>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
        {submitted ? (
          <SuccessCard companyName={company?.name ?? ''} name={firstName} />
        ) : !company ? (
          <div className="card p-8 text-center text-sm text-ink-500">
            No open board opportunities right now.
          </div>
        ) : (
          <>
            {/* Opportunity hero */}
            <div className="overflow-hidden rounded-2xl bg-accent-800 p-7 text-white shadow-soft">
              <div className="flex items-start justify-between gap-4">
                <p className="inline-flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-accent-200">
                  <IconSpark width={14} height={14} /> Board opportunity
                </p>
                {logoSrcs.length > 0 && (
                  <Avatar name={company.name} color="#ffffff" size="md" srcs={logoSrcs} />
                )}
              </div>
              <h1 className="mt-2 font-display text-3xl font-semibold leading-tight">
                {company.seatTitle}
              </h1>
              <p className="mt-1 text-accent-100">
                {company.name} · {company.industry}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-sm">
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1">
                  <IconBriefcase width={14} height={14} /> {company.seatType}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1">
                  <IconPin width={14} height={14} /> {company.location}
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-lg bg-white/15 px-2.5 py-1">
                  <IconStar width={14} height={14} /> {company.compensation}
                </span>
              </div>
            </div>

            {/* About + competencies */}
            <div className="card mt-5 p-6">
              <p className="text-sm leading-relaxed text-ink-700">{company.description}</p>
              <div className="mt-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  We’re looking for experience in
                </p>
                <div className="flex flex-wrap gap-2">
                  {company.requiredCompetencies.map((rc) => (
                    <Tag key={rc} tone="accent">
                      {rc}
                    </Tag>
                  ))}
                </div>
              </div>
            </div>

            {/* Interest form */}
            <form onSubmit={handleSubmit} className="card mt-5 p-6">
              <h2 className="text-lg font-semibold text-ink-900">Register your interest</h2>
              <p className="mt-1 text-sm text-ink-500">
                Tell us you’re interested and we’ll be in touch. It takes less than a minute.
              </p>

              {prefilled && (
                <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-2 text-xs text-accent-800">
                  <IconCheck width={14} height={14} /> We’ve pre-filled your details — please review.
                </p>
              )}

              {/* Opportunity selector when not locked to one company */}
              {!companyId && openCompanies.length > 1 && (
                <div className="mt-5">
                  <span className="label">Opportunity</span>
                  <select
                    className="input appearance-none"
                    value={selectedId}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {openCompanies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} — {c.seatTitle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="First name *">
                  <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
                </Field>
                <Field label="Last name">
                  <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="Email *">
                  <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>
              </div>
              <div className="mt-4">
                <Field label="A short note (optional)">
                  <textarea
                    className="input min-h-24 resize-y"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Why this board interests you…"
                  />
                </Field>
              </div>

              {error && <p className="mt-3 text-sm font-medium text-rose-600">{error}</p>}

              <button type="submit" className="btn-primary mt-6 w-full" disabled={submitting}>
                {submitting ? 'Submitting…' : 'I’m interested'}
                {!submitting && <IconArrowRight width={16} height={16} />}
              </button>
              <p className="mt-3 text-center text-xs text-ink-400">
                We’ll match your details and be in touch about this board role.
              </p>
            </form>
          </>
        )}
      </main>
    </div>
  )
}

function SuccessCard({ companyName, name }: { companyName: string; name: string }) {
  return (
    <div className="card animate-scale-in p-8 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-100 text-accent-700">
        <IconCheck width={28} height={28} />
      </div>
      <h1 className="mt-5 font-display text-2xl font-semibold text-ink-900">Thank you{name ? `, ${name.split(' ')[0]}` : ''}!</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink-600">
        Your interest in the board role at <span className="font-medium text-ink-800">{companyName}</span> has
        been registered. You’ve been added to the shortlist and our team will reach out with next steps.
      </p>
      <p className="mt-6 text-xs text-ink-400">You can close this page.</p>
    </div>
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
