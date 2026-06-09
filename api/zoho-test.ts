// GET /api/zoho-test?email=someone@x.com&token=YOUR_TEST_TOKEN
// Diagnostic: confirms the Zoho connection works and shows how a person's record
// maps onto our fields — WITHOUT writing anything. Protected by ZOHO_TEST_TOKEN so
// CRM data is never exposed publicly.

export const config = { runtime: 'nodejs' }

const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.eu'
const ZAPI = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu'
const MODULE = process.env.ZOHO_MODULE || 'Leads'
const EMAIL_FIELD = process.env.ZOHO_EMAIL_FIELD || 'Email'
const zohoConfigured = () =>
  Boolean(process.env.ZOHO_CLIENT_ID && process.env.ZOHO_CLIENT_SECRET && process.env.ZOHO_REFRESH_TOKEN)

async function zohoToken(): Promise<string> {
  const params = new URLSearchParams({
    refresh_token: process.env.ZOHO_REFRESH_TOKEN as string,
    client_id: process.env.ZOHO_CLIENT_ID as string,
    client_secret: process.env.ZOHO_CLIENT_SECRET as string,
    grant_type: 'refresh_token',
  })
  const r = await fetch(`${ACCOUNTS}/oauth/v2/token?${params.toString()}`, { method: 'POST' })
  const j: any = await r.json()
  if (!j.access_token) throw new Error('Zoho token error: ' + JSON.stringify(j))
  return j.access_token
}

async function zohoFindByEmail(email: string): Promise<any | null> {
  const token = await zohoToken()
  const url =
    `${ZAPI}/crm/v2/${encodeURIComponent(MODULE)}/search` +
    `?criteria=(${EMAIL_FIELD}:equals:${encodeURIComponent(email)})`
  const r = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } })
  if (r.status === 204) return null
  const j: any = await r.json()
  return j?.data?.length ? j.data[0] : null
}

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
    try { return { ...DEFAULT_MAP, ...JSON.parse(process.env.ZOHO_FIELD_MAP) } } catch { /* ignore */ }
  }
  return DEFAULT_MAP
}
function firstVal(rec: any, keys: string[]): string {
  for (const k of keys) {
    const v = rec?.[k]
    if (v != null && v !== '') return Array.isArray(v) ? v.join('; ') : String(v)
  }
  return ''
}
function listVal(rec: any, keys: string[]): string[] {
  for (const k of keys) {
    const v = rec?.[k]
    if (Array.isArray(v) && v.length) return v.filter(Boolean)
    if (typeof v === 'string' && v.trim()) return v.split(/[;,]/).map((s) => s.trim()).filter(Boolean)
  }
  return []
}
function mapZoho(rec: any) {
  const m = fieldMap()
  return {
    name: firstVal(rec, m.name),
    title: firstVal(rec, m.title),
    linkedin: firstVal(rec, m.linkedin),
    phone: firstVal(rec, m.phone),
    competencies: listVal(rec, m.competencies),
    sectors: listVal(rec, m.sectors),
    bio: firstVal(rec, m.bio),
    boardExperience: firstVal(rec, m.boardExperience),
    location: [firstVal(rec, m.city), firstVal(rec, m.country)].filter(Boolean).join(', '),
  }
}

export default async function handler(req: any, res: any) {
  const token = req.query?.token
  const expected = process.env.ZOHO_TEST_TOKEN
  if (!expected || token !== expected) {
    res.status(403).json({ ok: false, error: 'Forbidden — set ZOHO_TEST_TOKEN and pass it as ?token=' })
    return
  }
  if (!zohoConfigured()) {
    res.status(200).json({ ok: false, zohoConfigured: false, error: 'Missing ZOHO_CLIENT_ID / ZOHO_CLIENT_SECRET / ZOHO_REFRESH_TOKEN' })
    return
  }
  const email = String(req.query?.email || '').trim()
  if (!email) {
    res.status(400).json({ ok: false, error: 'Provide ?email=' })
    return
  }
  try {
    const rec = await zohoFindByEmail(email)
    if (!rec) {
      res.status(200).json({ ok: true, zohoConfigured: true, module: MODULE, found: false, hint: 'Connection works, but no record matched that email in this module.' })
      return
    }
    res.status(200).json({
      ok: true,
      zohoConfigured: true,
      module: MODULE,
      found: true,
      mapped: mapZoho(rec),
      availableFieldNames: Object.keys(rec).filter((k) => !k.startsWith('$')).sort(),
    })
  } catch (e) {
    res.status(500).json({ ok: false, zohoConfigured: true, error: String(e) })
  }
}
