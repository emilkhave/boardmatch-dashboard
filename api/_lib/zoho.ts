// ---------------------------------------------------------------------------
// Zoho CRM client — SERVER-SIDE ONLY.
// All secrets are read from Vercel environment variables (encrypted at rest,
// never shipped to the browser). Do NOT prefix these with VITE_.
//
// Required env vars:
//   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN
// Optional (with sensible defaults):
//   ZOHO_ACCOUNTS_DOMAIN  (default https://accounts.zoho.eu)
//   ZOHO_API_DOMAIN       (default https://www.zohoapis.eu)
//   ZOHO_MODULE           (default Leads — set to your custom module API name, e.g. Members)
//   ZOHO_EMAIL_FIELD      (default Email)
//   ZOHO_FIELD_MAP        (optional JSON overriding the field mapping below)
// ---------------------------------------------------------------------------

const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.eu'
const API = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu'
const MODULE = process.env.ZOHO_MODULE || 'Leads'
const EMAIL_FIELD = process.env.ZOHO_EMAIL_FIELD || 'Email'

export function zohoConfigured(): boolean {
  return Boolean(
    process.env.ZOHO_CLIENT_ID &&
      process.env.ZOHO_CLIENT_SECRET &&
      process.env.ZOHO_REFRESH_TOKEN,
  )
}

let cached: { token: string; exp: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cached && cached.exp > Date.now() + 60_000) return cached.token
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN as string,
    client_id: process.env.ZOHO_CLIENT_ID as string,
    client_secret: process.env.ZOHO_CLIENT_SECRET as string,
    grant_type: 'refresh_token',
  })
  const r = await fetch(`${ACCOUNTS}/oauth/v2/token?${params.toString()}`, { method: 'POST' })
  const j: any = await r.json()
  if (!j.access_token) throw new Error('Zoho token error: ' + JSON.stringify(j))
  cached = { token: j.access_token, exp: Date.now() + (j.expires_in ?? 3600) * 1000 }
  return j.access_token
}

// Look up a single record in the configured module by email.
export async function findRecordByEmail(email: string): Promise<any | null> {
  const token = await getAccessToken()
  const url =
    `${API}/crm/v2/${encodeURIComponent(MODULE)}/search` +
    `?criteria=(${EMAIL_FIELD}:equals:${encodeURIComponent(email)})`
  const r = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } })
  if (r.status === 204) return null // no content = no match
  const j: any = await r.json()
  return j?.data?.length ? j.data[0] : null
}

// ---- Field mapping -------------------------------------------------------
// Each of our candidate fields maps to a list of candidate Zoho API names;
// the first non-empty one wins. Override entirely with ZOHO_FIELD_MAP (JSON).
const DEFAULT_MAP: Record<string, string[]> = {
  name: ['Full_Name', 'Member_Name', 'Name', 'Last_Name'],
  title: ['Title', 'Designation'],
  linkedin: ['LinkedIn', 'LinkedIn_URL'],
  phone: ['Mobile', 'Phone'],
  competencies: ['Competencies'],
  sectors: ['Industries', 'Industry'],
  bio: ['Partner_Description', 'Description'],
  boardExperience: ['Advisory_Experiences', 'Advisory_Experiences_Text', 'Advisory_Experience_Text'],
  city: ['City'],
  country: ['Country'],
}

function fieldMap(): Record<string, string[]> {
  if (process.env.ZOHO_FIELD_MAP) {
    try {
      return { ...DEFAULT_MAP, ...JSON.parse(process.env.ZOHO_FIELD_MAP) }
    } catch {
      /* ignore bad JSON, use defaults */
    }
  }
  return DEFAULT_MAP
}

function first(rec: any, keys: string[]): string {
  for (const k of keys) {
    const v = rec?.[k]
    if (v != null && v !== '') return Array.isArray(v) ? v.join('; ') : String(v)
  }
  return ''
}

function listOf(rec: any, keys: string[]): string[] {
  for (const k of keys) {
    const v = rec?.[k]
    if (Array.isArray(v) && v.length) return v.filter(Boolean)
    if (typeof v === 'string' && v.trim())
      return v
        .split(/[;,]/)
        .map((s) => s.trim())
        .filter(Boolean)
  }
  return []
}

// Map a raw Zoho record onto the fields our dashboards understand.
export function mapZohoRecord(rec: any) {
  const m = fieldMap()
  const city = first(rec, m.city)
  const country = first(rec, m.country)
  return {
    name: first(rec, m.name),
    title: first(rec, m.title),
    linkedin: first(rec, m.linkedin),
    phone: first(rec, m.phone),
    competencies: listOf(rec, m.competencies),
    sectors: listOf(rec, m.sectors),
    bio: first(rec, m.bio),
    boardExperience: first(rec, m.boardExperience),
    location: [city, country].filter(Boolean).join(', '),
    zohoId: rec?.id ? String(rec.id) : undefined,
  }
}
