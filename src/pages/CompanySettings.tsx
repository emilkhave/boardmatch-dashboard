import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { Avatar, Card, CardHeader } from '../components/ui'
import { resolveBrand, logoCandidates, domainFromWebsite, primaryLogoUrl } from '../lib/brand'
import { persistCompany } from '../lib/api'
import { IconCheck, IconSpark } from '../components/icons'

export function CompanySettings() {
  const { session, updateSession, accessToken } = useAuth()
  const { getCompany, updateCompany } = useData()
  const company = session?.companyId ? getCompany(session.companyId) : undefined

  // Your-profile fields
  const [contactName, setContactName] = useState(company?.contactName ?? '')
  const [contactRole, setContactRole] = useState(company?.contactRole ?? '')
  const [contactEmail, setContactEmail] = useState(company?.contactEmail ?? '')

  // Brand fields
  const [website, setWebsite] = useState(company?.website ?? '')
  const [brandColor, setBrandColor] = useState(company?.brandColor ?? company?.logoColor ?? '#27534b')
  const [logoUrl, setLogoUrl] = useState(company?.logoUrl ?? '')
  const [fetching, setFetching] = useState(false)
  const [fetchNote, setFetchNote] = useState('')

  // Company fields
  const [name, setName] = useState(company?.name ?? '')
  const [industry, setIndustry] = useState(company?.industry ?? '')
  const [location, setLocation] = useState(company?.location ?? '')
  const [seatTitle, setSeatTitle] = useState(company?.seatTitle ?? '')
  const [description, setDescription] = useState(company?.description ?? '')

  const [saved, setSaved] = useState(false)

  if (!company) {
    return <p className="text-sm text-ink-500">No company selected.</p>
  }

  const dirtyMark = () => setSaved(false)

  const domain = domainFromWebsite(website)
  const previewLogoSrcs = logoUrl ? [logoUrl] : domain ? logoCandidates(domain) : []

  const handleFetchBrand = async () => {
    setFetchNote('')
    if (!domainFromWebsite(website)) {
      setFetchNote('Enter a valid website first (e.g. acme.com).')
      return
    }
    setFetching(true)
    const res = await resolveBrand(website)
    setFetching(false)
    if (!res) {
      setFetchNote('Could not read that website.')
      return
    }
    setLogoUrl(res.logoUrl ?? '')
    setBrandColor(res.brandColor)
    setFetchNote('Logo and brand color detected — adjust below if needed.')
    dirtyMark()
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const patch = {
      contactName: contactName.trim() || company.contactName,
      contactRole: contactRole.trim(),
      contactEmail: contactEmail.trim(),
      website: website.trim(),
      brandColor,
      logoUrl: logoUrl.trim() || primaryLogoUrl(website),
      name: name.trim() || company.name,
      industry: industry.trim(),
      location: location.trim(),
      seatTitle: seatTitle.trim(),
      description: description.trim(),
    }
    updateCompany(company.id, patch)
    updateSession({ name: contactName.trim() || company.contactName, email: contactEmail.trim() })
    // Persist so the admin sees the updated profile. Fire-and-forget.
    void persistCompany({ ...company, ...patch }, accessToken)
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Manage your own profile, your brand and your company’s details. Changes are saved to this workspace.
        </p>
      </div>

      {/* Your profile */}
      <Card>
        <CardHeader title="Your profile" subtitle="The person managing this board search" />
        <div className="space-y-5 p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <input className="input" value={contactName} onChange={(e) => { setContactName(e.target.value); dirtyMark() }} />
            </Field>
            <Field label="Your role / title">
              <input className="input" value={contactRole} onChange={(e) => { setContactRole(e.target.value); dirtyMark() }} />
            </Field>
          </div>
          <Field label="Email">
            <input className="input" type="email" value={contactEmail} onChange={(e) => { setContactEmail(e.target.value); dirtyMark() }} />
          </Field>
        </div>
      </Card>

      {/* Brand & appearance */}
      <Card>
        <CardHeader
          title="Brand & appearance"
          subtitle="Add your website — we’ll pull in your logo and brand color and theme your whole dashboard"
        />
        <div className="space-y-5 p-5">
          <Field label="Company website">
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                className="input"
                value={website}
                placeholder="e.g. acme.com"
                onChange={(e) => { setWebsite(e.target.value); setLogoUrl(''); dirtyMark() }}
              />
              <button type="button" className="btn-secondary shrink-0" onClick={handleFetchBrand} disabled={fetching}>
                <IconSpark width={16} height={16} />
                {fetching ? 'Fetching…' : 'Fetch brand'}
              </button>
            </div>
          </Field>

          {fetchNote && <p className="text-xs text-ink-500">{fetchNote}</p>}

          <div className="flex flex-wrap items-center gap-5 rounded-xl bg-sand-100 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={name || company.name} color={brandColor} size="lg" srcs={previewLogoSrcs} />
              <div className="text-xs text-ink-500">
                <p className="font-medium text-ink-700">Logo preview</p>
                <p>{domain ?? 'No website yet'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="relative inline-flex h-10 w-10 cursor-pointer overflow-hidden rounded-xl ring-1 ring-ink-200">
                <span className="absolute inset-0" style={{ backgroundColor: brandColor }} />
                <input
                  type="color"
                  className="h-full w-full cursor-pointer opacity-0"
                  value={/^#[0-9a-fA-F]{6}$/.test(brandColor) ? brandColor : '#27534b'}
                  onChange={(e) => { setBrandColor(e.target.value); dirtyMark() }}
                />
              </label>
              <div className="text-xs text-ink-500">
                <p className="font-medium text-ink-700">Brand color</p>
                <p className="uppercase">{brandColor}</p>
              </div>
            </div>
            <div
              className="ml-auto hidden rounded-xl px-4 py-2 text-sm font-medium text-white sm:block"
              style={{ backgroundColor: brandColor }}
            >
              Theme preview
            </div>
          </div>
          <p className="text-xs text-ink-400">
            Tip: if the auto-detected color isn’t exact, click the swatch to set it precisely. Save to apply
            it across your dashboard.
          </p>
        </div>
      </Card>

      {/* Company details */}
      <Card>
        <CardHeader title="Company details" subtitle="Shown across your board recruitment workspace" />
        <div className="space-y-5 p-5">
          <Field label="Company name">
            <input className="input" value={name} onChange={(e) => { setName(e.target.value); dirtyMark() }} />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <input className="input" value={industry} onChange={(e) => { setIndustry(e.target.value); dirtyMark() }} />
            </Field>
            <Field label="Location">
              <input className="input" value={location} onChange={(e) => { setLocation(e.target.value); dirtyMark() }} />
            </Field>
          </div>
          <Field label="Board seat title">
            <input className="input" value={seatTitle} onChange={(e) => { setSeatTitle(e.target.value); dirtyMark() }} />
          </Field>
          <Field label="Description">
            <textarea className="input min-h-24 resize-y" value={description} onChange={(e) => { setDescription(e.target.value); dirtyMark() }} />
          </Field>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-4">
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-700">
            <IconCheck width={16} height={16} /> Changes saved
          </span>
        )}
        <button type="submit" className="btn-primary">Save changes</button>
      </div>
    </form>
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
