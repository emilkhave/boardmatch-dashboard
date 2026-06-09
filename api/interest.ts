// POST /api/interest — a candidate clicked "I'm interested" on a landing page.
// Flow: validate {firstName,lastName,email,companyId} → look the person up in Zoho
// by email (pulling their REAL data) → upsert candidate + an "Interested" match
// into Upstash Redis → both dashboards read it from /api/candidates.
//
// Self-contained (no shared imports) so the function always bundles on Vercel.
// All secrets come from Vercel environment variables (server-side only).

export const config = { runtime: 'nodejs' }

// ── Redis (Upstash REST) ────────────────────────────────────────────────────
const DB_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL
const DB_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN
const dbConfigured = () => Boolean(DB_URL && DB_TOKEN)

async function redis(args: (string | number)[]): Promise<any> {
  const r = await fetch(DB_URL as string, {
    method: 'POST',
    headers: { Authorization: `Bearer ${DB_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  const j: any = await r.json()
  if (j && j.error) throw new Error('Redis error: ' + j.error)
  return j ? j.result : null
}
async function hvals(hash: string): Promise<any[]> {
  const res: string[] = (await redis(['HVALS', hash])) || []
  return res.map((s) => { try { return JSON.parse(s) } catch { return null } }).filter(Boolean)
}
async function hset(hash: string, field: string, obj: unknown): Promise<void> {
  await redis(['HSET', hash, field, JSON.stringify(obj)])
}

// ── Zoho CRM ────────────────────────────────────────────────────────────────
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
  const city = firstVal(rec, m.city)
  const country = firstVal(rec, m.country)
  return {
    name: firstVal(rec, m.name),
    title: firstVal(rec, m.title),
    linkedin: firstVal(rec, m.linkedin),
    phone: firstVal(rec, m.phone),
    competencies: listVal(rec, m.competencies),
    sectors: listVal(rec, m.sectors),
    bio: firstVal(rec, m.bio),
    boardExperience: firstVal(rec, m.boardExperience),
    location: [city, country].filter(Boolean).join(', '),
  }
}

// ── helpers ─────────────────────────────────────────────────────────────────
const today = () => new Date().toISOString().slice(0, 10)
const PALETTE = ['#27534b', '#3a8073', '#549b8e', '#2d675c', '#1c3833', '#434a55', '#21433d']
function pickColor(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0
  return PALETTE[h % PALETTE.length]
}
const uid = (p: string) =>
  `${p}-${(globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8)}`
function nonEmpty(obj: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = {}
  for (const [k, v] of Object.entries(obj)) {
    if (v == null) continue
    if (typeof v === 'string' && v.trim() === '') continue
    if (Array.isArray(v) && v.length === 0) continue
    out[k] = v
  }
  return out
}

// ── handler ──────────────────────────────────────────────────────────────────
export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ ok: false, error: 'Method not allowed' })
    return
  }
  let body = req.body
  if (typeof body === 'string') { try { body = JSON.parse(body) } catch { body = {} } }

  const firstName = (body?.firstName || '').trim()
  const lastName = (body?.lastName || '').trim()
  const email = (body?.email || '').trim()
  const companyId = (body?.companyId || '').trim()
  const message = (body?.message || '').trim()

  if (!firstName || !email || !companyId) {
    res.status(400).json({ ok: false, error: 'firstName, email and companyId are required' })
    return
  }
  if (!dbConfigured()) {
    res.status(200).json({ ok: false, configured: false })
    return
  }

  try {
    // 1) Pull REAL data from Zoho by email.
    let zoho: ReturnType<typeof mapZoho> | null = null
    let matchedInZoho = false
    if (zohoConfigured()) {
      try {
        const rec = await zohoFindByEmail(email)
        if (rec) { zoho = mapZoho(rec); matchedInZoho = true }
      } catch (e) {
        console.error('Zoho lookup failed:', e)
      }
    }

    // 2) Upsert candidate (reuse by email).
    const candidates = await hvals('bm:candidates')
    const matches = await hvals('bm:matches')
    let candidate = candidates.find((c) => c.email?.toLowerCase() === email.toLowerCase())
    const isNew = !candidate

    if (!candidate) {
      candidate = {
        id: uid('p'),
        name: zoho?.name || `${firstName} ${lastName}`.trim(),
        title: zoho?.title || 'Board candidate',
        location: zoho?.location || '—',
        experienceYears: 0,
        bio: zoho?.bio || message || 'Expressed interest via the landing page.',
        competencies: zoho?.competencies || [],
        sectors: zoho?.sectors || [],
        boardExperience: zoho?.boardExperience || 'To be added.',
        currentBoards: 0,
        availability: 'Available',
        email,
        phone: zoho?.phone || '',
        linkedin: zoho?.linkedin || '',
        avatarColor: pickColor(email),
        createdAt: today(),
      }
      await hset('bm:candidates', candidate.id, candidate)
    } else if (zoho) {
      candidate = { ...candidate, ...nonEmpty(zoho) }
      await hset('bm:candidates', candidate.id, candidate)
    }

    // 3) Upsert the match into the Interested stage.
    let match = matches.find((m) => m.companyId === companyId && m.candidateId === candidate.id)
    if (!match) {
      match = {
        id: uid('m'),
        companyId,
        candidateId: candidate.id,
        stage: 'interested',
        matchScore: 70,
        lastContact: today(),
        nextStep: 'Review new interest',
        notes: message || `Self-reported interest${matchedInZoho ? ' — matched in Zoho' : ''}.`,
        history: [
          {
            id: uid('act'),
            date: today(),
            type: 'created',
            text: `Expressed interest via the landing page${matchedInZoho ? ' — matched in Zoho' : ''}.`,
            author: candidate.name,
          },
        ],
      }
      await hset('bm:matches', match.id, match)
    }

    res.status(200).json({ ok: true, configured: true, matchedInZoho, isNew, candidate, match })
  } catch (e) {
    console.error('interest error:', e)
    res.status(500).json({ ok: false, error: String(e) })
  }
}
