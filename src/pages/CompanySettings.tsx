import { useState } from 'react'
import { useAuth } from '../lib/auth'
import { useData } from '../lib/store'
import { Avatar, Card, CardHeader } from '../components/ui'
import { IconCheck } from '../components/icons'

export function CompanySettings() {
  const { session, updateSession } = useAuth()
  const { getCompany, updateCompany } = useData()
  const company = session?.companyId ? getCompany(session.companyId) : undefined

  // Your-profile fields
  const [contactName, setContactName] = useState(company?.contactName ?? '')
  const [contactRole, setContactRole] = useState(company?.contactRole ?? '')
  const [contactEmail, setContactEmail] = useState(company?.contactEmail ?? '')

  // Company fields
  const [name, setName] = useState(company?.name ?? '')
  const [industry, setIndustry] = useState(company?.industry ?? '')
  const [location, setLocation] = useState(company?.location ?? '')
  const [website, setWebsite] = useState(company?.website ?? '')
  const [seatTitle, setSeatTitle] = useState(company?.seatTitle ?? '')
  const [description, setDescription] = useState(company?.description ?? '')

  const [saved, setSaved] = useState(false)

  if (!company) {
    return <p className="text-sm text-ink-500">No company selected.</p>
  }

  const dirtyMark = () => setSaved(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateCompany(company.id, {
      contactName: contactName.trim() || company.contactName,
      contactRole: contactRole.trim(),
      contactEmail: contactEmail.trim(),
      name: name.trim() || company.name,
      industry: industry.trim(),
      location: location.trim(),
      website: website.trim(),
      seatTitle: seatTitle.trim(),
      description: description.trim(),
    })
    // Keep the signed-in identity (top bar, activity author) in sync.
    updateSession({ name: contactName.trim() || company.contactName, email: contactEmail.trim() })
    setSaved(true)
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Settings</h1>
        <p className="mt-1 text-sm text-ink-500">
          Manage your own profile and your company’s details. Changes are saved to this workspace.
        </p>
      </div>

      {/* Your profile */}
      <Card>
        <CardHeader title="Your profile" subtitle="The person managing this board search" />
        <div className="space-y-5 p-5">
          <div className="flex items-center gap-4">
            <Avatar name={contactName || company.contactName} color={company.logoColor} size="lg" />
            <p className="text-sm text-ink-500">
              This is how you appear in the workspace and on activity you log.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Your name">
              <input
                className="input"
                value={contactName}
                onChange={(e) => {
                  setContactName(e.target.value)
                  dirtyMark()
                }}
              />
            </Field>
            <Field label="Your role / title">
              <input
                className="input"
                value={contactRole}
                onChange={(e) => {
                  setContactRole(e.target.value)
                  dirtyMark()
                }}
              />
            </Field>
          </div>
          <Field label="Email">
            <input
              className="input"
              type="email"
              value={contactEmail}
              onChange={(e) => {
                setContactEmail(e.target.value)
                dirtyMark()
              }}
            />
          </Field>
        </div>
      </Card>

      {/* Company details */}
      <Card>
        <CardHeader title="Company details" subtitle="Shown across your board recruitment workspace" />
        <div className="space-y-5 p-5">
          <Field label="Company name">
            <input
              className="input"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                dirtyMark()
              }}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Industry">
              <input
                className="input"
                value={industry}
                onChange={(e) => {
                  setIndustry(e.target.value)
                  dirtyMark()
                }}
              />
            </Field>
            <Field label="Location">
              <input
                className="input"
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value)
                  dirtyMark()
                }}
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Website">
              <input
                className="input"
                value={website}
                onChange={(e) => {
                  setWebsite(e.target.value)
                  dirtyMark()
                }}
              />
            </Field>
            <Field label="Board seat title">
              <input
                className="input"
                value={seatTitle}
                onChange={(e) => {
                  setSeatTitle(e.target.value)
                  dirtyMark()
                }}
              />
            </Field>
          </div>
          <Field label="Description">
            <textarea
              className="input min-h-24 resize-y"
              value={description}
              onChange={(e) => {
                setDescription(e.target.value)
                dirtyMark()
              }}
            />
          </Field>
        </div>
      </Card>

      <div className="flex items-center justify-end gap-3 pb-4">
        {saved && (
          <span className="inline-flex items-center gap-1.5 text-sm font-medium text-accent-700">
            <IconCheck width={16} height={16} /> Changes saved
          </span>
        )}
        <button type="submit" className="btn-primary">
          Save changes
        </button>
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
