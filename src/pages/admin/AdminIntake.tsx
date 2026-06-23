import { useState } from 'react'
import { PageHeader } from '../../components/AdminLayout'
import { Card, CardHeader, Avatar } from '../../components/ui'
import { useData } from '../../lib/store'
import { useZohoConfig, ZOHO_WEBHOOK_PATH, type ZohoDataCenter, type ZohoModule } from '../../lib/zoho'
import { formatDate } from '../../lib/format'
import { IconCheck, IconLink, IconArrowRight, IconSpark } from '../../components/icons'

const origin = typeof window !== 'undefined' ? window.location.origin : ''

export function AdminIntake() {
  const { companies, candidates, refresh, clearDemo } = useData()
  const { config, update } = useZohoConfig()
  const [syncResult, setSyncResult] = useState<string | null>(null)
  const [syncToken, setSyncToken] = useState('')
  const [syncing, setSyncing] = useState(false)

  const openCompanies = companies.filter((c) => c.status !== 'placed')
  const webhookUrl = `${origin}${ZOHO_WEBHOOK_PATH}`
  const realCount = candidates.filter((c) => c.source === 'zoho').length

  // Pull the REAL candidate base from Zoho into the dashboards.
  const runSync = async () => {
    if (!syncToken.trim()) {
      setSyncResult('Enter your ZOHO_TEST_TOKEN to sync.')
      return
    }
    setSyncing(true)
    setSyncResult(null)
    try {
      const r = await fetch(`/api/zoho-sync?token=${encodeURIComponent(syncToken.trim())}`, { method: 'POST' })
      const j = await r.json()
      if (j.ok) {
        await refresh()
        update({ connected: true, lastSyncedAt: new Date().toISOString().slice(0, 10) })
        setSyncResult(`Imported ${j.imported} real candidate(s) from Zoho (${j.module}).`)
      } else {
        setSyncResult(`Sync failed: ${j.error || 'unknown error'}`)
      }
    } catch (e) {
      setSyncResult(`Sync failed: ${String(e)}`)
    } finally {
      setSyncing(false)
    }
  }

  const removeDemo = () => {
    clearDemo()
    void refresh()
    setSyncResult('Demo candidates & pipeline removed — showing real data only.')
  }

  return (
    <>
      <PageHeader
        title="Intake & Zoho"
        subtitle="Candidate landing pages and your Zoho integration"
      />

      <div className="space-y-6 px-6 py-6 lg:px-8">
        {/* Landing pages */}
        <Card>
          <CardHeader
            title="Candidate landing pages"
            subtitle="Share these links (e.g. in a Zoho email). When a candidate clicks “I’m interested”, they appear in the Interested stage of that company’s pipeline — and here in your pipeline."
          />
          <div className="divide-y divide-ink-100">
            <LinkRow
              label="General landing page"
              sublabel="Candidate picks the opportunity"
              url={`${origin}/apply`}
            />
            {openCompanies.map((c) => (
              <div key={c.id} className="flex items-center gap-3 px-5 py-3.5">
                <Avatar name={c.name} color={c.logoColor} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-ink-900">{c.name}</p>
                  <p className="truncate text-xs text-ink-400">{c.seatTitle}</p>
                </div>
                <CopyButton text={`${origin}/apply/${c.id}`} />
                <a
                  href={`/apply/${c.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-ghost px-2.5 py-1.5 text-xs text-accent-700"
                >
                  Preview <IconArrowRight width={14} height={14} />
                </a>
              </div>
            ))}
          </div>
        </Card>

        {/* Zoho integration */}
        <Card>
          <CardHeader
            title="Zoho integration"
            subtitle="Sync candidate records from Zoho CRM / Recruit"
            action={
              <span
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium ${
                  config.connected
                    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200'
                    : 'bg-ink-100 text-ink-500 ring-1 ring-inset ring-ink-200'
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${config.connected ? 'bg-emerald-500' : 'bg-ink-400'}`} />
                {config.connected ? 'Connected' : 'Not connected'}
              </span>
            }
          />
          <div className="space-y-5 p-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Data center">
                <select
                  className="input appearance-none"
                  value={config.dataCenter}
                  onChange={(e) => update({ dataCenter: e.target.value as ZohoDataCenter })}
                >
                  <option value="eu">Europe (zoho.eu)</option>
                  <option value="com">United States (zoho.com)</option>
                  <option value="in">India (zoho.in)</option>
                  <option value="com.au">Australia (zoho.com.au)</option>
                  <option value="jp">Japan (zoho.jp)</option>
                </select>
              </Field>
              <Field label="Module">
                <select
                  className="input appearance-none"
                  value={config.module}
                  onChange={(e) => update({ module: e.target.value as ZohoModule })}
                >
                  <option value="Leads">CRM — Leads</option>
                  <option value="Contacts">CRM — Contacts</option>
                  <option value="Candidates">Recruit — Candidates</option>
                </select>
              </Field>
              <Field label="Client ID">
                <input
                  className="input"
                  value={config.clientId}
                  onChange={(e) => update({ clientId: e.target.value })}
                  placeholder="1000.XXXXXXXXXXXXXXXX"
                />
              </Field>
              <Field label="Organization ID">
                <input
                  className="input"
                  value={config.orgId}
                  onChange={(e) => update({ orgId: e.target.value })}
                  placeholder="e.g. 20071234567"
                />
              </Field>
            </div>

            {/* Webhook endpoint */}
            <div>
              <span className="label">Inbound webhook URL (paste into Zoho → Workflow → Webhook)</span>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-xl border border-ink-200 bg-sand-50 px-3.5 py-2.5 text-xs text-ink-700">
                  {webhookUrl}
                </code>
                <CopyButton text={webhookUrl} />
              </div>
              <p className="mt-1.5 text-xs text-ink-400">
                Zoho posts candidate changes here. Live two-way sync also needs the serverless
                backend + a stored OAuth token (see README).
              </p>
            </div>

            <div className="border-t border-ink-100 pt-5">
              <span className="label">Sync token (your ZOHO_TEST_TOKEN)</span>
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  className="input"
                  type="password"
                  value={syncToken}
                  onChange={(e) => setSyncToken(e.target.value)}
                  placeholder="paste ZOHO_TEST_TOKEN"
                />
                <button className="btn-primary shrink-0" onClick={runSync} disabled={syncing}>
                  <IconSpark width={16} height={16} />
                  {syncing ? 'Syncing…' : 'Sync candidates from Zoho'}
                </button>
              </div>
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-ink-500">
                  {config.lastSyncedAt ? `Last synced: ${formatDate(config.lastSyncedAt)}` : 'Never synced yet.'}
                  {realCount > 0 && ` · ${realCount} real candidate(s) loaded`}
                </span>
                <button className="btn-secondary text-xs" onClick={removeDemo}>
                  Remove demo data (show real only)
                </button>
              </div>
            </div>

            {syncResult && (
              <p className="inline-flex items-center gap-1.5 rounded-lg bg-accent-50 px-3 py-2 text-sm font-medium text-accent-800">
                <IconCheck width={16} height={16} /> {syncResult}
              </p>
            )}
            <p className="rounded-xl bg-sand-100 px-4 py-3 text-xs text-ink-500">
              <span className="font-semibold text-ink-700">Live:</span> “Sync” pulls your real Zoho
              records (module <code>{config.module}</code>) into the dashboards. “Remove demo data”
              clears the sample candidates/pipeline so only real Zoho data remains.
            </p>
          </div>
        </Card>
      </div>
    </>
  )
}

function LinkRow({ label, sublabel, url }: { label: string; sublabel: string; url: string }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3.5">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-50 text-accent-600">
        <IconLink width={16} height={16} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink-900">{label}</p>
        <p className="truncate text-xs text-ink-400">{sublabel}</p>
      </div>
      <CopyButton text={url} />
      <a href="/apply" target="_blank" rel="noreferrer" className="btn-ghost px-2.5 py-1.5 text-xs text-accent-700">
        Preview <IconArrowRight width={14} height={14} />
      </a>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard blocked — ignore in prototype */
    }
  }
  return (
    <button onClick={copy} className="btn-secondary px-2.5 py-1.5 text-xs">
      {copied ? (
        <>
          <IconCheck width={14} height={14} /> Copied
        </>
      ) : (
        'Copy link'
      )}
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
