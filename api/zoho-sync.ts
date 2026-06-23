// POST /api/zoho-sync?token=YOUR_TEST_TOKEN
// Imports REAL candidates from the Zoho module into Supabase (paginated, bulk
// upsert). Token-gated so it can't be triggered by anyone. The dashboards then
// show these real people. Self-contained for reliable Vercel bundling.

export const config = { runtime: 'nodejs', maxDuration: 60 }

// ── Supabase ────────────────────────────────────────────────────────────────
const SB_URL = process.env.SUPABASE_URL
const SB_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY
const sbHeaders = () => ({ apikey: SB_KEY as string, Authorization: `Bearer ${SB_KEY}`, 'Content-Type': 'application/json' })
async function bulkUpsert(table: string, rows: { id: string; data: any }[]): Promise<void> {
  if (!rows.length) return
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...sbHeaders(), Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  })
  if (!r.ok) throw new Error(`Supabase upsert ${r.status}: ${await r.text()}`)
}

// ── Zoho ────────────────────────────────────────────────────────────────────
const ACCOUNTS = process.env.ZOHO_ACCOUNTS_DOMAIN || 'https://accounts.zoho.eu'
const ZAPI = process.env.ZOHO_API_DOMAIN || 'https://www.zohoapis.eu'
const MODULE = process.env.ZOHO_MODULE || 'Leads'
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
    if (v != null && v !== '') return Array.isArray(v) ? v.join('; ') : typeof v === 'object' ? (v.name ?? '') : String(v)
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
function cell(rec: any, keys: string[]): string {
  for (const k of keys) {
    const v = rec?.[k]
    if (v == null || v === '') continue
    if (typeof v === 'boolean') return v ? 'Yes' : ''
    if (Array.isArray(v)) { const a = v.filter(Boolean); if (a.length) return a.join(', '); continue }
    if (typeof v === 'object') { if (v.name) return String(v.name); continue }
    return String(v)
  }
  return ''
}
const EXTRA_FIELDS: { label: string; keys: string[] }[] = [
  { label: 'Company', keys: ['Company', 'Account_Name'] },
  { label: 'Partnership goals', keys: ['Partnership_Goals'] },
  { label: 'Partnership goals — detail', keys: ['Partnership_Goals_Elaboration'] },
  { label: 'Motivation towards startups', keys: ['Motivation_towards_Startups'] },
  { label: 'Key competencies & industry', keys: ['key_competencies_and_industry_experience'] },
  { label: 'Advisory board experience', keys: ['Advisory_Board_Experience'] },
  { label: 'Investment experience', keys: ['Investment_Experiences_Text', 'Investment_Experiences'] },
  { label: 'Considering investing', keys: ['Considering_investing'] },
  { label: 'Investment range', keys: ['investment_range', 'Investment_Range'] },
  { label: 'Membership status', keys: ['Membership_Status'] },
  { label: 'Membership type', keys: ['Membership_Type'] },
  { label: 'Language', keys: ['Language'] },
]

const PALETTE = ['#27534b', '#3a8073', '#549b8e', '#2d675c', '#1c3833', '#434a55', '#21433d']
function pickColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
const today = () => new Date().toISOString().slice(0, 10)

function toCandidate(rec: any) {
  const m = fieldMap()
  const email = firstVal(rec, ['Email'])
  const name = firstVal(rec, m.name) || [firstVal(rec, ['First_Name']), firstVal(rec, ['Last_Name'])].filter(Boolean).join(' ')
  return {
    id: `z-${rec.id}`,
    name: name || 'Unnamed',
    title: firstVal(rec, m.title) || 'Board candidate',
    location: [firstVal(rec, m.city), firstVal(rec, m.country)].filter(Boolean).join(', ') || '—',
    experienceYears: 0,
    bio: firstVal(rec, m.bio) || '',
    competencies: listVal(rec, m.competencies),
    sectors: listVal(rec, m.sectors),
    boardExperience: firstVal(rec, m.boardExperience) || '',
    currentBoards: 0,
    availability: 'Available',
    email,
    phone: firstVal(rec, m.phone),
    linkedin: firstVal(rec, m.linkedin),
    avatarColor: pickColor(email || String(rec.id)),
    createdAt: today(),
    extra: EXTRA_FIELDS.map((f) => ({ label: f.label, value: cell(rec, f.keys) })).filter((e) => e.value),
    source: 'zoho',
  }
}

export default async function handler(req: any, res: any) {
  if (!process.env.ZOHO_TEST_TOKEN || (req.query?.token !== process.env.ZOHO_TEST_TOKEN)) {
    res.status(403).json({ ok: false, error: 'Forbidden — pass ?token=ZOHO_TEST_TOKEN' })
    return
  }
  if (!SB_URL || !SB_KEY) {
    res.status(200).json({ ok: false, error: 'Supabase not configured' })
    return
  }
  if (!zohoConfigured()) {
    res.status(200).json({ ok: false, error: 'Zoho not configured' })
    return
  }
  try {
    const token = await zohoToken()
    let page = 1
    let imported = 0
    const maxPages = 8 // up to 1600 records
    while (page <= maxPages) {
      const url = `${ZAPI}/crm/v2/${encodeURIComponent(MODULE)}?per_page=200&page=${page}`
      const r = await fetch(url, { headers: { Authorization: `Zoho-oauthtoken ${token}` } })
      if (r.status === 204) break
      const j: any = await r.json()
      const data: any[] = j?.data || []
      if (!data.length) break
      await bulkUpsert('candidates', data.map((rec) => ({ id: `z-${rec.id}`, data: toCandidate(rec) })))
      imported += data.length
      if (!j?.info?.more_records) break
      page++
    }
    res.status(200).json({ ok: true, imported, module: MODULE })
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) })
  }
}
